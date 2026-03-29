"""
CodeBud DSA Analyzer - Main Flask Server with AI-Powered Validation
"""

import logging
import copy
import hashlib
import hmac
import base64
import json
import time
import uuid
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any, Dict, Tuple
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Import modules
from executors import PythonExecutor, CExecutor, SourceExecutor, DeterministicTestRunner, TestValidator
from problems import ProblemDatabase
from ai_analyzer import AIAnalyzer
from solution import ReferenceSolutionStore, TemplateMatcher
from queueing import MemoryJobStore, AsyncExecutionManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


def _is_true(value: str) -> bool:
    return str(value).strip().lower() in ('1', 'true', 'yes', 'on')

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
cors_origins_raw = os.getenv(
    'CORS_ORIGINS',
    'http://localhost:3000,http://localhost:5173,http://127.0.0.1:5500,null'
)
cors_origins = [origin.strip() for origin in cors_origins_raw.split(',') if origin.strip()]
if '*' in cors_origins:
    CORS(app)
else:
    CORS(app, origins=cors_origins)


@app.after_request
def disable_cache(response):
    """Prevent stale API responses from being cached by browser/proxy layers."""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# Initialize services
problem_db = ProblemDatabase()
python_executor = PythonExecutor(
    timeout=int(os.getenv('MAX_EXECUTION_TIME', 10)),
    max_memory_mb=int(os.getenv('MAX_MEMORY_MB', 512))
)
c_executor = CExecutor(
    timeout=int(os.getenv('MAX_EXECUTION_TIME', 10)),
    max_memory_mb=int(os.getenv('MAX_MEMORY_MB', 512))
)
source_executor = SourceExecutor(
    timeout=int(os.getenv('MAX_EXECUTION_TIME', 10)),
    max_memory_mb=int(os.getenv('MAX_MEMORY_MB', 512))
)
SUPPORTED_LANGUAGES = set(SourceExecutor.SUPPORTED_LANGUAGES)
AI_ENABLED = _is_true(os.getenv('ENABLE_AI', 'False'))
ai_analyzer = AIAnalyzer(model=os.getenv('AI_MODEL', 'google')) if AI_ENABLED else AIAnalyzer(model='disabled')
test_runner = DeterministicTestRunner()
test_validator = TestValidator()
ai_judge_cache = {}
reference_solution_store = ReferenceSolutionStore()
template_matcher = TemplateMatcher()
job_store = MemoryJobStore()
async_execution_manager = None
AUTH_SECRET = os.getenv('JWT_SECRET', 'codebud-backend-auth-secret-2026')
AUTH_TTL_HOURS = int(os.getenv('AUTH_TOKEN_TTL_HOURS', 72))
AUTH_STORE_PATH = os.getenv('AUTH_STORE_PATH', os.path.join(os.path.dirname(__file__), 'auth_users.json'))
auth_store_lock = Lock()


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _auth_response(success: bool, user: Dict[str, Any] = None, token: str = '', error: str = None):
    return jsonify({
        'success': bool(success),
        'user': user,
        'token': token if success else '',
        'error': None if success else (error or 'Authentication failed')
    })


def _safe_user(user: Dict[str, Any]) -> Dict[str, Any]:
    if not user:
        return {}
    return {
        '_id': user.get('_id'),
        'email': user.get('email'),
        'display_name': user.get('display_name', ''),
        'role': user.get('role', 'student'),
        'created_at': user.get('created_at'),
        'last_active': user.get('last_active'),
        'onboarding_completed': user.get('onboarding_completed', True)
    }


def _load_auth_store() -> Dict[str, Dict[str, Any]]:
    if not os.path.exists(AUTH_STORE_PATH):
        return {}
    try:
        with open(AUTH_STORE_PATH, 'r', encoding='utf-8') as handle:
            data = json.load(handle)
        if isinstance(data, dict):
            return data
    except Exception as exc:
        logger.warning('[AUTH] Failed to read auth store: %s', str(exc))
    return {}


def _save_auth_store(store: Dict[str, Dict[str, Any]]) -> None:
    os.makedirs(os.path.dirname(AUTH_STORE_PATH), exist_ok=True)
    with open(AUTH_STORE_PATH, 'w', encoding='utf-8') as handle:
        json.dump(store, handle, indent=2)


def _hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 120000)
    return base64.urlsafe_b64encode(digest).decode('utf-8')


def _verify_password(password: str, salt: str, expected_hash: str) -> bool:
    computed = _hash_password(password, salt)
    return hmac.compare_digest(computed, expected_hash)


def _encode_token(payload: Dict[str, Any]) -> str:
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8').rstrip('=')
    sig = hmac.new(AUTH_SECRET.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip('=')
    return f'cb.{payload_b64}.{sig_b64}'


def _decode_token(token: str) -> Dict[str, Any]:
    parts = str(token or '').split('.')
    if len(parts) != 3 or parts[0] != 'cb':
        raise ValueError('Invalid token format')

    payload_b64 = parts[1]
    sig_b64 = parts[2]
    expected_sig = hmac.new(AUTH_SECRET.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).digest()
    provided_sig = base64.urlsafe_b64decode(sig_b64 + '=' * (-len(sig_b64) % 4))
    if not hmac.compare_digest(expected_sig, provided_sig):
        raise ValueError('Invalid token signature')

    payload_raw = base64.urlsafe_b64decode(payload_b64 + '=' * (-len(payload_b64) % 4))
    payload = json.loads(payload_raw.decode('utf-8'))
    exp = int(payload.get('exp', 0))
    if exp and int(time.time()) > exp:
        raise ValueError('Token expired')
    return payload


def _issue_auth_token(user: Dict[str, Any]) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=AUTH_TTL_HOURS)
    payload = {
        'sub': user.get('_id'),
        'email': user.get('email'),
        'role': user.get('role', 'student'),
        'onboarding_completed': user.get('onboarding_completed', True),
        'iat': int(time.time()),
        'exp': int(expires_at.timestamp())
    }
    return _encode_token(payload)


def _normalize_language(language: str) -> str:
    return SourceExecutor.normalize_language(language)


def _is_supported_language(language: str) -> bool:
    return _normalize_language(language) in SUPPORTED_LANGUAGES


def _deterministic_analysis(code: str, language: str, test_results: dict = None) -> dict:
    lines = str(code or '').split('\n')
    logical_lines = len([l for l in lines if l.strip() and not l.strip().startswith('#')])
    status = (test_results or {}).get('status', 'Not run')
    passed = (test_results or {}).get('passed', 0)
    total = (test_results or {}).get('total', (test_results or {}).get('total_tests', 0))

    analysis_text = (
        f"Static Code Analysis ({language.upper()}):\n\n"
        f"- Total lines: {len(lines)}\n"
        f"- Logical lines: {logical_lines}\n"
        f"- Test status: {status}\n"
        f"- Passed: {passed}/{total}\n\n"
        "Recommendations:\n"
        "1. Validate edge cases (empty input, single element, max constraints).\n"
        "2. Prefer clear variable names and avoid redundant passes.\n"
        "3. Keep time/space complexity aligned with problem constraints.\n"
    )
    return {
        'status': 'fallback',
        'analysis': analysis_text,
        'note': 'LLM disabled; deterministic static analysis mode'
    }


def _deterministic_semantic_validation(test_results: dict) -> dict:
    passed = bool((test_results or {}).get('all_passed', False))
    return {
        'is_correct': passed,
        'confidence': 1.0 if passed else 0.0,
        'reasoning': 'LLM disabled; semantic verdict derived from deterministic test result only.',
        'issues': [] if passed else ['One or more deterministic tests failed'],
        'edge_cases_covered': [],
        'potential_issues': [] if passed else ['Review failing deterministic test cases'],
        'mode': 'deterministic'
    }


def _deterministic_optimization_suggestions(code: str, language: str, complexity: str) -> dict:
    suggestions = (
        f"Deterministic optimization hints ({language}, current complexity: {complexity}):\n"
        "- Remove unnecessary nested loops where possible.\n"
        "- Use hash maps/sets for O(1) lookups when appropriate.\n"
        "- Avoid copying large arrays unless required.\n"
        "- Short-circuit early once answer is found.\n"
    )
    return {'suggestions': suggestions}


def _deterministic_hidden_test_cases(public_cases: list, count: int) -> dict:
    generated = []
    source = [tc for tc in (public_cases or []) if isinstance(tc, dict)]
    if source:
        idx = 0
        while len(generated) < count:
            tc = source[idx % len(source)]
            generated.append({
                'input': tc.get('input'),
                'expected': tc.get('expected'),
                'hidden': True
            })
            idx += 1
    else:
        while len(generated) < count:
            generated.append({'input': ([],), 'expected': None, 'hidden': True})

    return {
        'status': 'fallback',
        'model': 'deterministic',
        'hidden_test_cases': generated,
        'note': 'LLM disabled; generated baseline hidden cases from available data'
    }


def _get_judge_mode(request_data: dict) -> str:
    """
    Modes:
    - test: classic deterministic test-case judge
    - ai: Gemini semantic verdict is final
    - hybrid: tests + Gemini override only when tests fail
    """
    if not AI_ENABLED:
        return 'test'

    mode = (request_data or {}).get('judge_mode', os.getenv('JUDGE_MODE', 'test'))
    mode = str(mode).strip().lower()
    if mode not in ('test', 'ai', 'hybrid'):
        mode = 'test'
    return mode


def _validate_template_signature(problem: dict, code: str, language: str) -> tuple:
    """Ensure submission follows required template entrypoint."""
    if language != 'python':
        return True, ''
    function_name = (problem or {}).get('function_name', '')
    is_valid, error = template_matcher.validate_required_callable(code, function_name)
    if is_valid:
        return True, ''
    return False, error


def _apply_reference_crossmatch(problem: dict, language: str, test_cases: list, base_result: dict) -> dict:
    """
    Cross-match user outputs against canonical reference-solution outputs.
    A testcase is passed only when user output equals reference output.
    """
    if language != 'python':
        return base_result

    reference_code = reference_solution_store.get_solution(problem.get('id', ''), language)
    if not reference_code:
        return base_result

    reference_result = python_executor.execute_with_function(
        reference_code,
        problem.get('function_name'),
        copy.deepcopy(test_cases or [])
    )
    if reference_result.get('status') != 'success':
        return base_result

    judged = copy.deepcopy(base_result)
    user_rows = judged.get('test_results', [])
    ref_rows = reference_result.get('test_results', [])
    if len(user_rows) != len(ref_rows):
        return judged

    passed_count = 0
    for i, user_row in enumerate(user_rows):
        ref_row = ref_rows[i]
        got = str(user_row.get('got', ''))
        ref_got = str(ref_row.get('got', ''))

        has_exec_error = bool(user_row.get('error'))
        timed_out = str(user_row.get('got', '')).upper() == 'TIMEOUT'
        memory_limited = str(user_row.get('got', '')).upper() == 'MEMORY_LIMIT_EXCEEDED'

        passed = (not has_exec_error) and (not timed_out) and (not memory_limited) and (got == ref_got)
        user_row['passed'] = passed
        user_row['matched_reference'] = passed
        if not passed and not has_exec_error:
            user_row['expected'] = ref_row.get('got', user_row.get('expected'))
            user_row['error'] = 'Output does not match reference solution'
        if passed:
            passed_count += 1

    judged['passed'] = passed_count
    judged['total'] = len(user_rows)
    judged['all_passed'] = passed_count == len(user_rows)
    judged['status'] = 'success' if judged['all_passed'] else 'wrong_answer'
    judged['judge_basis'] = 'reference_crossmatch'
    return judged


def _apply_ai_judge(problem: dict, code: str, language: str, base_result: dict) -> tuple:
    """Return (result_after_ai_judge, ai_validation)."""
    if not AI_ENABLED:
        return base_result, {
            'is_correct': bool(base_result.get('all_passed')),
            'confidence': 1.0,
            'reasoning': 'AI judging disabled; using deterministic test verdict only.',
            'mode': 'deterministic'
        }

    cache_key = hashlib.sha256(
        f"{problem.get('id','')}|{language}|{code.strip()}".encode()
    ).hexdigest()

    cached = ai_judge_cache.get(cache_key)
    if cached:
        ai_validation = copy.deepcopy(cached)
    else:
        ai_validation = ai_analyzer.validate_solution_semantically(
            code=code,
            problem_description=problem.get('description', ''),
            language=language,
            test_results=base_result
        )
        ai_judge_cache[cache_key] = copy.deepcopy(ai_validation)

    is_correct = bool(ai_validation.get('is_correct', False))
    judged = copy.deepcopy(base_result)
    total = int(judged.get('total', judged.get('total_tests', 0)))
    passed = int(judged.get('passed', 0))

    # Keep deterministic per-test results for UI test-case display.
    judged['total'] = total
    judged['total_tests'] = total
    judged['all_passed'] = bool(passed == total)
    judged['status'] = judged.get('status', 'success' if judged['all_passed'] else 'wrong_answer')
    judged['ai_judge'] = True
    judged['judge_mode'] = 'ai'
    judged['ai_validation'] = ai_validation
    judged['ai_verdict'] = 'ACCEPTED' if is_correct else 'WRONG_ANSWER'
    judged['ai_is_correct'] = is_correct

    return judged, ai_validation


def _redact_hidden_test_results(test_results: list) -> list:
    redacted = []
    for item in test_results or []:
        row = copy.deepcopy(item)
        if row.get('hidden'):
            row['input'] = '[HIDDEN]'
            row['expected'] = '[HIDDEN]'
            row['got'] = '[HIDDEN]'
            row['error'] = ''
        redacted.append(row)
    return redacted


def _derive_verdict(test_result: dict) -> str:
    status = (test_result or {}).get('status', '')
    rows = (test_result or {}).get('test_results', [])
    if bool((test_result or {}).get('ai_judge')) and bool((test_result or {}).get('ai_is_correct')):
        return 'ACCEPTED'

    if status in ('compilation_error', 'syntax_error'):
        return 'COMPILATION_ERROR'
    if status == 'timeout' or any(r.get('time_limit_exceeded') or str(r.get('got', '')).upper() == 'TIMEOUT' for r in rows):
        return 'TIME_LIMIT_EXCEEDED'
    if status == 'memory_limit_exceeded' or any(r.get('memory_limit_exceeded') for r in rows):
        return 'MEMORY_LIMIT_EXCEEDED'
    if status in ('runtime_error', 'error') or any(bool(r.get('error')) for r in rows):
        return 'RUNTIME_ERROR'
    if bool((test_result or {}).get('all_passed')):
        return 'ACCEPTED'
    return 'WRONG_ANSWER'


class ApiRequestError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _normalize_stdin_inputs(raw_input: Any, inputs: Any) -> str:
    """Normalize stdin payload supporting both `input` and `inputs` request shapes."""
    if isinstance(inputs, list) and inputs:
        return "\n".join(str(item) for item in inputs)
    if isinstance(inputs, str):
        return inputs
    if raw_input is None:
        return ''
    if isinstance(raw_input, list):
        return "\n".join(str(item) for item in raw_input)
    return str(raw_input)


def _standard_execution_payload(
    output: Any,
    error: Any,
    return_code: int,
    execution_time: float = None,
    compilation_error: bool = False,
    timeout_error: bool = False
) -> Dict[str, Any]:
    """Create a consistent execution response contract for /api/execute and /api/run."""
    safe_error = str(error or '').strip()
    safe_output = '' if output is None else str(output)
    success = (int(return_code) == 0) and (not compilation_error) and (not timeout_error) and (not safe_error)
    runtime_error = bool(safe_error) and (not compilation_error) and (not timeout_error)

    payload = {
        'success': success,
        'output': safe_output,
        'error': None if not safe_error else safe_error,
        'return_code': int(return_code),
        'compilation_error': bool(compilation_error),
        'runtime_error': runtime_error,
        'timeout_error': bool(timeout_error)
    }
    if execution_time is not None:
        payload['execution_time'] = round(float(execution_time), 3)
    return payload


def _validate_run_request(data: Dict[str, Any]) -> Dict[str, Any]:
    if not data:
        raise ApiRequestError('No JSON data provided', 400)

    problem_id = data.get('problem_id')
    code = data.get('code')
    language = _normalize_language(data.get('language', 'python'))
    judge_mode = _get_judge_mode(data)

    if not problem_id:
        raise ApiRequestError('Problem ID is required', 400)
    if not code or not str(code).strip():
        raise ApiRequestError('Code is required', 400)
    if language not in SUPPORTED_LANGUAGES:
        raise ApiRequestError(f'Unsupported language. Use one of: {", ".join(sorted(SUPPORTED_LANGUAGES))}', 400)

    problem = problem_db.get_problem(problem_id)
    if not problem:
        raise ApiRequestError(f'Problem {problem_id} not found', 404)

    is_template_valid, template_error = _validate_template_signature(problem, code, language)
    if not is_template_valid:
        raise ApiRequestError(template_error, 400)

    return {
        'problem_id': problem_id,
        'code': code,
        'language': language,
        'judge_mode': judge_mode
    }


def _build_legacy_run_payload(
    problem_id: str,
    code: str,
    language: str,
    judge_mode: str
) -> Dict[str, Any]:
    problem = problem_db.get_problem(problem_id)
    if not problem:
        raise ApiRequestError(f'Problem {problem_id} not found', 404)

    logger.info(f"Running code for problem {problem_id} in language {language}")

    test_cases = problem_db.get_judge_test_cases(problem_id)
    execution_test_cases = copy.deepcopy(test_cases)

    if language == 'python':
        test_result = python_executor.execute_with_function(
            code,
            problem.get('function_name'),
            execution_test_cases
        )
    else:
        test_result = source_executor.execute_with_test_cases(
            code,
            language,
            execution_test_cases,
            problem.get('function_name')
        )

    test_result = _apply_reference_crossmatch(problem, language, test_cases, test_result)

    ai_validation = None
    if judge_mode == 'ai':
        test_result, ai_validation = _apply_ai_judge(problem, code, language, test_result)
    elif judge_mode == 'hybrid' and not test_result.get('all_passed'):
        test_result, ai_validation = _apply_ai_judge(problem, code, language, test_result)

    # Normalize to legacy frontend result schema
    normalized_results = []
    error_count = 0
    total_exec_ms = 0.0
    for t in test_result.get('test_results', []):
        passed = bool(t.get('passed'))
        got = t.get('got')
        err = t.get('error', '')
        exec_ms = float(t.get('execution_time', 0))
        memory_mb = float(t.get('memory_used_mb', 0))
        total_exec_ms += exec_ms

        if err:
            status = 'error'
            error_count += 1
        elif str(got).upper() == 'TIMEOUT':
            status = 'timeout'
            error_count += 1
        else:
            status = 'passed' if passed else 'failed'

        is_hidden = bool(t.get('hidden'))
        normalized_results.append({
            'status': status,
            'input': '[HIDDEN]' if is_hidden else str(t.get('input', '')),
            'expected': '[HIDDEN]' if is_hidden else str(t.get('expected', '')),
            'actual': '[HIDDEN]' if is_hidden else str(got if got is not None else ''),
            'error': '' if is_hidden else err,
            'execution_time_ms': round(exec_ms, 2),
            'memory_used_mb': round(memory_mb, 3),
            'stdout': '' if is_hidden else str(t.get('stdout', ''))
        })

    test_result['verdict'] = _derive_verdict(test_result)
    test_result['test_results'] = _redact_hidden_test_results(test_result.get('test_results', []))
    is_accepted = test_result.get('verdict') == 'ACCEPTED'
    failed = int(test_result.get('total', 0) - test_result.get('passed', 0))
    final_output = normalized_results[-1]['actual'] if normalized_results else None

    code_hash = hashlib.sha256(code.strip().encode()).hexdigest()
    payload = {
        'status': {
            'ACCEPTED': 'Accepted',
            'WRONG_ANSWER': 'Wrong Answer',
            'TIME_LIMIT_EXCEEDED': 'Time Limit Exceeded',
            'MEMORY_LIMIT_EXCEEDED': 'Memory Limit Exceeded',
            'RUNTIME_ERROR': 'Runtime Error',
            'COMPILATION_ERROR': 'Compilation Error'
        }.get(test_result.get('verdict', 'WRONG_ANSWER'), 'Wrong Answer'),
        'is_accepted': is_accepted,
        'total_tests': int(test_result.get('total', 0)),
        'passed': int(test_result.get('passed', 0)),
        'failed': failed,
        'errors': error_count,
        'total_execution_time_ms': round(total_exec_ms, 2),
        'max_memory_used_mb': max([float(r.get('memory_used_mb', 0)) for r in normalized_results], default=0),
        'results': normalized_results,
        'final_output': final_output,
        'final_stdout': str(test_result.get('final_stdout', '')),
        'message': 'Accepted! All test cases passed.' if is_accepted else 'Rejected: Some test cases failed',
        'resolved_function': test_result.get('resolved_function'),
        'run_id': f"run_{uuid.uuid4().hex}",
        'code_hash': code_hash,
        'judge_mode': judge_mode,
        'verdict': test_result.get('verdict', 'WRONG_ANSWER')
    }

    if ai_validation is not None:
        payload['ai_validation'] = ai_validation

    return payload


def _get_async_execution_manager() -> AsyncExecutionManager:
    global async_execution_manager
    if async_execution_manager is None:
        def _execute_job(request_payload: Dict[str, Any]) -> Dict[str, Any]:
            return _build_legacy_run_payload(
                request_payload['problem_id'],
                request_payload['code'],
                request_payload['language'],
                request_payload['judge_mode']
            )

        async_execution_manager = AsyncExecutionManager(
            job_store=job_store,
            executor=_execute_job,
            max_workers=int(os.getenv('JOB_WORKER_THREADS', 2))
        )
    return async_execution_manager


# ============================================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'CodeBud DSA Analyzer Server is running',
        'version': '1.0.0',
        'service': 'codebud_backend_app'
    }), 200


@app.route('/api/status', methods=['GET'])
def status():
    """Get server status and available features"""
    language_services = {
        lang: True for lang in sorted(SUPPORTED_LANGUAGES)
    }
    # Keep env-based toggles where they already exist.
    language_services['python'] = os.getenv('ENABLE_PYTHON_SUPPORT', 'True') == 'True'
    language_services['c'] = os.getenv('ENABLE_C_SUPPORT', 'True') == 'True'

    return jsonify({
        'status': 'operational',
        'services': {
            **language_services,
            'ai_analysis': AI_ENABLED and ai_analyzer.client is not None,
            'async_queue': True
        },
        'supported_languages': sorted(SUPPORTED_LANGUAGES),
        'ai_model': os.getenv('AI_MODEL', 'claude'),
        'queue_backend': os.getenv('JOB_STORE_BACKEND', 'memory'),
        'worker_threads': int(os.getenv('JOB_WORKER_THREADS', 2))
    }), 200


# ============================================================================
# AUTH ENDPOINTS
# ============================================================================

@app.route('/api/auth/signup', methods=['POST'])
@app.route('/api/auth/register', methods=['POST'])
def auth_signup():
    """Create a user account for frontend auth flows."""
    try:
        data = request.get_json() or {}
        email = str(data.get('email', '')).strip().lower()
        password = str(data.get('password', ''))
        role = str(data.get('role', 'student')).strip().lower() or 'student'
        display_name = str(data.get('displayName') or data.get('display_name') or '').strip()

        if not email or not password:
            return _auth_response(False, error='Email and password are required'), 400
        if '@' not in email or '.' not in email.split('@')[-1]:
            return _auth_response(False, error='Invalid email format'), 400
        if len(password) < 6:
            return _auth_response(False, error='Password must be at least 6 characters'), 400

        with auth_store_lock:
            store = _load_auth_store()
            if email in store:
                return _auth_response(False, error='User already exists'), 409

            now_iso = _utc_now_iso()
            user = {
                '_id': f"usr_{uuid.uuid4().hex}",
                'email': email,
                'display_name': display_name or email.split('@')[0],
                'role': role,
                'created_at': now_iso,
                'last_active': now_iso,
                'onboarding_completed': True,
                'salt': uuid.uuid4().hex,
            }
            user['password_hash'] = _hash_password(password, user['salt'])
            store[email] = user
            _save_auth_store(store)

        safe_user = _safe_user(user)
        token = _issue_auth_token(safe_user)
        return _auth_response(True, user=safe_user, token=token), 201
    except Exception as exc:
        logger.error('[AUTH] Signup error: %s', str(exc))
        return _auth_response(False, error='Failed to create account'), 500


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Authenticate user and return access token."""
    try:
        data = request.get_json() or {}
        email = str(data.get('email', '')).strip().lower()
        password = str(data.get('password', ''))
        expected_role = str(data.get('expectedRole') or data.get('expected_role') or '').strip().lower()

        if not email or not password:
            return _auth_response(False, error='Email and password are required'), 400

        with auth_store_lock:
            store = _load_auth_store()
            user = store.get(email)
            if not user:
                return _auth_response(False, error='Invalid email or password'), 401

            if not _verify_password(password, user.get('salt', ''), user.get('password_hash', '')):
                return _auth_response(False, error='Invalid email or password'), 401

            if expected_role and user.get('role') != expected_role:
                return _auth_response(
                    False,
                    error=f"Access denied. This account is registered as {user.get('role')}, but you're trying to login as {expected_role}."
                ), 403

            user['last_active'] = _utc_now_iso()
            store[email] = user
            _save_auth_store(store)

        safe_user = _safe_user(user)
        token = _issue_auth_token(safe_user)
        return _auth_response(True, user=safe_user, token=token), 200
    except Exception as exc:
        logger.error('[AUTH] Login error: %s', str(exc))
        return _auth_response(False, error='Login failed'), 500


@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    """Return current user profile from bearer token."""
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return _auth_response(False, error='Missing token'), 401

        token = auth_header[7:]
        payload = _decode_token(token)
        email = str(payload.get('email', '')).strip().lower()
        if not email:
            return _auth_response(False, error='Invalid token payload'), 401

        with auth_store_lock:
            store = _load_auth_store()
            user = store.get(email)

        if not user:
            return _auth_response(False, error='User not found'), 404

        return _auth_response(True, user=_safe_user(user), token=''), 200
    except ValueError as exc:
        return _auth_response(False, error=str(exc)), 401
    except Exception as exc:
        logger.error('[AUTH] Me endpoint error: %s', str(exc))
        return _auth_response(False, error='Failed to load profile'), 500


# ============================================================================
# PROBLEM ENDPOINTS
# ============================================================================

@app.route('/api/problems', methods=['GET'])
def get_problems():
    """Get all available DSA problems"""
    try:
        problems = problem_db.get_problem_list()
        # Frontend compatibility: include description + function_name fields.
        for p in problems:
            detail = problem_db.get_problem(p['id'])
            if detail:
                p['description'] = detail.get('description', '')
                p['function_name'] = detail.get('function_name', '')
        return jsonify({
            'success': True,
            'count': len(problems),
            'problems': problems
        }), 200
    except Exception as e:
        logger.error(f"Error fetching problems: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/problems/<problem_id>', methods=['GET'])
@app.route('/api/problem/<problem_id>', methods=['GET'])
def get_problem(problem_id):
    """Get specific problem details"""
    try:
        problem = problem_db.get_problem(problem_id)
        
        if not problem:
            return jsonify({
                'success': False,
                'error': f'Problem {problem_id} not found'
            }), 404
        
        # Don't send test cases in the detail view initially
        problem_detail = {
            'id': problem['id'],
            'title': problem['title'],
            'description': problem['description'],
            'difficulty': problem.get('difficulty', 'Unknown'),
            'tags': problem.get('tags', []),
            'function_name': problem['function_name'],
            'test_count': len(problem.get('test_cases', []))
        }
        
        return jsonify({
            'success': True,
            'problem': problem_detail
        }), 200
    except Exception as e:
        logger.error(f"Error fetching problem {problem_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/problems/<problem_id>/template', methods=['GET'])
def get_template(problem_id):
    """Get code template for a problem"""
    try:
        language = _normalize_language(request.args.get('language', 'python'))
        
        if language not in SUPPORTED_LANGUAGES:
            return jsonify({
                'success': False,
                'error': f'Unsupported language. Use one of: {", ".join(sorted(SUPPORTED_LANGUAGES))}'
            }), 400
        
        template = problem_db.get_template(problem_id, language)
        
        if not template:
            return jsonify({
                'success': False,
                'error': f'Template not found for problem {problem_id} in {language}'
            }), 404
        
        return jsonify({
            'success': True,
            'template': template,
            'language': language
        }), 200
    except Exception as e:
        logger.error(f"Error fetching template: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# EXECUTION ENDPOINTS
# ============================================================================

@app.route('/api/execute', methods=['POST'])
def execute_code():
    """Execute code and return terminal output"""
    started_at = time.time()
    request_id = f"exec_{uuid.uuid4().hex[:10]}"
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        code = data.get('code')
        language = _normalize_language(data.get('language', 'python'))
        stdin_data = _normalize_stdin_inputs(data.get('input'), data.get('inputs'))
        
        # Validation
        if not code or not code.strip():
            return jsonify({
                'success': False,
                'error': 'Code is required'
            }), 400
        
        if language not in SUPPORTED_LANGUAGES:
            return jsonify({
                'success': False,
                'error': f'Unsupported language. Use one of: {", ".join(sorted(SUPPORTED_LANGUAGES))}'
            }), 400
        
        logger.info(
            "[RUN] execute request_id=%s language=%s code_length=%s inputs=%s",
            request_id,
            language,
            len(str(code or '')),
            len(stdin_data)
        )
        
        # Execute
        if language == 'python':
            result = python_executor.run_terminal_code(code, stdin_data=stdin_data)
        else:
            # Source executor accepts list-based test inputs; wrap normalized stdin as a single payload.
            result = source_executor.run_terminal_code(code, language, [stdin_data] if stdin_data else None)
        
        output = result.get('stdout', '')
        error = result.get('stderr', '')
        return_code = int(result.get('return_code', -1))
        compilation_error = bool(result.get('compilation_error')) or ('syntaxerror' in str(error).lower())
        timeout_error = result.get('status') == 'timeout' or 'timeout' in str(error).lower()
        response_payload = _standard_execution_payload(
            output=output,
            error=error,
            return_code=return_code,
            execution_time=(time.time() - started_at),
            compilation_error=compilation_error,
            timeout_error=timeout_error
        )

        logger.info(
            "[RUN] execute complete request_id=%s status=%s duration_ms=%.2f",
            request_id,
            'success' if response_payload.get('success') else 'failed',
            (time.time() - started_at) * 1000
        )

        return jsonify({
            **response_payload,
            'request_id': request_id,
            'language': language,
            'status': 'success' if response_payload.get('success') else 'failed'
        }), 200
        
    except Exception as e:
        logger.error(f"Execution error [{request_id}]: {str(e)}")
        return jsonify({
            **_standard_execution_payload(
                output='',
                error=str(e),
                return_code=-1,
                execution_time=(time.time() - started_at),
                compilation_error=False,
                timeout_error=False
            ),
            'request_id': request_id,
            'status': 'failed'
        }), 500


# ============================================================================
# TEST EXECUTION ENDPOINTS
# ============================================================================

@app.route('/api/test', methods=['POST'])
def run_tests():
    """Run code against test cases with consistency checking and AI validation"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        problem_id = data.get('problem_id')
        code = data.get('code')
        language = _normalize_language(data.get('language', 'python'))
        validate_semantically = data.get('validate_semantically', False)
        judge_mode = _get_judge_mode(data)
        
        # Validation
        if not problem_id:
            return jsonify({
                'success': False,
                'error': 'Problem ID is required'
            }), 400
        
        if not code or not code.strip():
            return jsonify({
                'success': False,
                'error': 'Code is required'
            }), 400
        
        if language not in SUPPORTED_LANGUAGES:
            return jsonify({
                'success': False,
                'error': f'Unsupported language. Use one of: {", ".join(sorted(SUPPORTED_LANGUAGES))}'
            }), 400
        
        # Get problem and test cases
        problem = problem_db.get_problem(problem_id)
        if not problem:
            return jsonify({
                'success': False,
                'error': f'Problem {problem_id} not found'
            }), 404

        is_template_valid, template_error = _validate_template_signature(problem, code, language)
        if not is_template_valid:
            return jsonify({
                'success': False,
                'error': template_error
            }), 400
        
        test_cases = problem_db.get_judge_test_cases(problem_id)
        if not test_cases:
            return jsonify({
                'success': False,
                'error': 'No test cases found for this problem'
            }), 404
        
        logger.info(f"Running tests for problem {problem_id} in {language}")
        
        # Use deep copies to prevent in-place mutations from polluting future runs
        pristine_test_cases = copy.deepcopy(test_cases)
        execution_test_cases = copy.deepcopy(test_cases)

        # Execute tests
        if language == 'python':
            function_name = problem.get('function_name')
            result = python_executor.execute_with_function(code, function_name, execution_test_cases)
        else:
            result = source_executor.execute_with_test_cases(
                code,
                language,
                execution_test_cases,
                problem.get('function_name')
            )

        result = _apply_reference_crossmatch(problem, language, pristine_test_cases, result)

        # Extract boolean results for consistency checking
        test_results = [test['passed'] for test in result.get('test_results', [])]
        
        # Check consistency across runs
        consistency_report = test_runner.check_consistency(code, pristine_test_cases, test_results)
        
        # Record this test run
        run_id = test_runner.record_test_run(code, pristine_test_cases, test_results)
        
        # Add consistency info to result
        result['consistency'] = consistency_report
        result['run_id'] = run_id

        if judge_mode == 'ai':
            result, semantic_validation = _apply_ai_judge(problem, code, language, result)
            result['ai_validation'] = semantic_validation
        elif judge_mode == 'hybrid' and not result.get('all_passed'):
            result, semantic_validation = _apply_ai_judge(problem, code, language, result)
            result['ai_validation'] = semantic_validation
        
        # AI semantic validation if enabled and tests are inconsistent
        if AI_ENABLED and validate_semantically and consistency_report.get('is_flaky'):
            logger.info(f"Flaky tests detected - running AI semantic validation")
            semantic_validation = ai_analyzer.validate_solution_semantically(
                code=code,
                problem_description=problem.get('description', ''),
                language=language,
                test_results=result
            )
            result['ai_validation'] = semantic_validation
            
            # If AI says it's correct but tests failed, flag this
            if semantic_validation.get('is_correct') and not result.get('all_passed'):
                result['note'] = 'IMPORTANT: AI validation suggests solution is correct despite test failures. This may indicate an issue with test cases or a flaky test environment.'
        
        # Add test coverage analysis
        result['test_coverage'] = test_validator.analyze_test_patterns(pristine_test_cases)
        result['verdict'] = _derive_verdict(result)
        result['test_results'] = _redact_hidden_test_results(result.get('test_results', []))
        
        return jsonify({
            'success': True,
            'problem_id': problem_id,
            'language': language,
            'result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Test execution error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# AI ANALYSIS ENDPOINTS
# ============================================================================

@app.route('/api/analyze', methods=['POST'])
def analyze_code():
    """Get AI analysis of code"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        problem_id = data.get('problem_id')
        code = data.get('code')
        language = _normalize_language(data.get('language', 'python'))
        test_results = data.get('test_results')  # Optional
        
        # Validation
        if not problem_id:
            return jsonify({
                'success': False,
                'error': 'Problem ID is required'
            }), 400
        
        if not code or not code.strip():
            return jsonify({
                'success': False,
                'error': 'Code is required'
            }), 400
        
        # Get problem description
        problem = problem_db.get_problem(problem_id)
        if not problem:
            return jsonify({
                'success': False,
                'error': f'Problem {problem_id} not found'
            }), 404
        
        logger.info(f"Analyzing code for problem {problem_id}")
        
        # Get AI analysis
        if AI_ENABLED:
            analysis = ai_analyzer.analyze_code(
                code=code,
                problem_description=problem['description'],
                language=language,
                test_results=test_results
            )
        else:
            analysis = _deterministic_analysis(code, language, test_results)
        
        return jsonify({
            'success': True,
            'problem_id': problem_id,
            'language': language,
            'analysis': analysis
        }), 200
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/validate-semantic', methods=['POST'])
def validate_semantic():
    """Perform AI semantic validation of solution correctness"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        problem_id = data.get('problem_id')
        code = data.get('code')
        language = _normalize_language(data.get('language', 'python'))
        test_results = data.get('test_results', {})
        
        # Validation
        if not problem_id or not code:
            return jsonify({
                'success': False,
                'error': 'Problem ID and code are required'
            }), 400
        
        problem = problem_db.get_problem(problem_id)
        if not problem:
            return jsonify({
                'success': False,
                'error': f'Problem {problem_id} not found'
            }), 404
        
        logger.info(f"Running semantic validation for problem {problem_id}")
        
        # Perform semantic validation
        if AI_ENABLED:
            validation_result = ai_analyzer.validate_solution_semantically(
                code=code,
                problem_description=problem.get('description', ''),
                language=language,
                test_results=test_results
            )
        else:
            validation_result = _deterministic_semantic_validation(test_results)
        
        return jsonify({
            'success': True,
            'problem_id': problem_id,
            'language': language,
            'validation': validation_result
        }), 200
        
    except Exception as e:
        logger.error(f"Semantic validation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/optimize', methods=['POST'])
def get_optimizations():
    """Get optimization suggestions for code"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        code = data.get('code')
        language = _normalize_language(data.get('language', 'python'))
        complexity = data.get('current_complexity', 'Unknown')
        
        # Validation
        if not code or not code.strip():
            return jsonify({
                'success': False,
                'error': 'Code is required'
            }), 400
        
        logger.info(f"Getting optimizations for {language} code")
        
        # Get suggestions
        if AI_ENABLED:
            suggestions = ai_analyzer.get_optimization_suggestions(code, language, complexity)
        else:
            suggestions = _deterministic_optimization_suggestions(code, language, complexity)
        
        return jsonify({
            'success': True,
            'language': language,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        logger.error(f"Optimization error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# TEST REPORT ENDPOINTS
# ============================================================================

@app.route('/api/test-report/<code_hash>', methods=['GET'])
def get_test_report(code_hash):
    """Get consistency report for a specific code submission"""
    try:
        report = test_runner.get_test_report(code_hash)
        
        return jsonify({
            'success': True,
            'report': report
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting test report: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/generate-hidden-tests', methods=['POST'])
def generate_hidden_tests():
    """Generate hidden test cases using Gemini/OpenAI (with fallback)."""
    try:
        data = request.get_json() or {}
        problem_id = data.get('problem_id')
        problem_description = data.get('problem_description')
        function_name = data.get('function_name')
        language = _normalize_language(data.get('language', 'python'))
        count = int(data.get('count', 5))
        persist = bool(data.get('persist', False))

        if language not in SUPPORTED_LANGUAGES:
            return jsonify({
                'success': False,
                'error': f'Unsupported language. Use one of: {", ".join(sorted(SUPPORTED_LANGUAGES))}'
            }), 400

        public_cases = []
        if problem_id:
            problem = problem_db.get_problem(problem_id)
            if not problem:
                return jsonify({'success': False, 'error': f'Problem {problem_id} not found'}), 404
            problem_description = problem_description or problem.get('description', '')
            function_name = function_name or problem.get('function_name')
            public_cases = problem_db.get_public_test_cases(problem_id)
        elif not problem_description:
            return jsonify({
                'success': False,
                'error': 'Provide either problem_id or problem_description'
            }), 400

        if AI_ENABLED:
            generated = ai_analyzer.generate_hidden_test_cases(
                problem_description=problem_description or '',
                language=language,
                public_test_cases=public_cases,
                function_name=function_name,
                count=count
            )
        else:
            generated = _deterministic_hidden_test_cases(public_cases, count)

        hidden_cases = generated.get('hidden_test_cases', [])
        added = 0
        if persist and problem_id:
            added = problem_db.add_hidden_test_cases(problem_id, hidden_cases)

        response_cases = []
        for i, tc in enumerate(hidden_cases, start=1):
            response_cases.append({
                'test_case': i,
                'input': '[HIDDEN]',
                'expected': '[HIDDEN]',
                'hidden': True
            })

        return jsonify({
            'success': True,
            'problem_id': problem_id,
            'language': language,
            'count_requested': count,
            'count_generated': len(hidden_cases),
            'persisted': persist and bool(problem_id),
            'added_to_problem': added,
            'generator_status': generated.get('status', 'unknown'),
            'generator_model': generated.get('model', 'unknown'),
            'note': generated.get('note', ''),
            'hidden_test_cases': response_cases
        }), 200
    except Exception as e:
        logger.error(f"Hidden test generation endpoint error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/run', methods=['POST'])
def run_code_legacy():
    """
    Frontend-compatible DSA execution endpoint.
    Response schema matches codebud_frontend/src/services/dsaService.js expectations.
    """
    started_at = time.time()
    request_id = f"run_{uuid.uuid4().hex[:10]}"
    try:
        payload = request.get_json()
        logger.info(
            "[RUN] request_id=%s endpoint=/api/run language=%s code_length=%s has_problem_id=%s",
            request_id,
            _normalize_language((payload or {}).get('language', 'python')),
            len(str((payload or {}).get('code', ''))),
            bool((payload or {}).get('problem_id'))
        )

        run_request = _validate_run_request(payload)
        payload = _build_legacy_run_payload(
            run_request['problem_id'],
            run_request['code'],
            run_request['language'],
            run_request['judge_mode']
        )
        std_payload = _standard_execution_payload(
            output=payload.get('final_output') or payload.get('final_stdout') or '',
            error=payload.get('error', ''),
            return_code=0 if payload.get('is_accepted') else 1,
            execution_time=(time.time() - started_at),
            compilation_error=payload.get('verdict') == 'COMPILATION_ERROR',
            timeout_error=payload.get('verdict') == 'TIME_LIMIT_EXCEEDED'
        )
        if payload.get('verdict') == 'RUNTIME_ERROR':
            std_payload['runtime_error'] = True
        payload['request_id'] = request_id
        payload['success'] = std_payload['success']
        payload['output'] = std_payload['output']
        payload['error'] = std_payload['error']
        payload['return_code'] = std_payload['return_code']
        payload['execution_time'] = std_payload.get('execution_time')
        payload['compilation_error'] = std_payload['compilation_error']
        payload['runtime_error'] = std_payload['runtime_error']
        payload['timeout_error'] = std_payload['timeout_error']
        payload['execution_status'] = 'success' if payload.get('is_accepted') else 'failed'

        logger.info(
            "[RUN] complete request_id=%s verdict=%s passed=%s/%s duration_ms=%.2f",
            request_id,
            payload.get('verdict'),
            payload.get('passed', 0),
            payload.get('total_tests', 0),
            (time.time() - started_at) * 1000
        )
        return jsonify(payload), 200
    except ApiRequestError as e:
        logger.warning("[RUN] validation failed request_id=%s status=%s error=%s", request_id, e.status_code, e.message)
        return jsonify(_standard_execution_payload(output='', error=e.message, return_code=1)), e.status_code
    except Exception as e:
        logger.error(f"Run endpoint error [{request_id}]: {str(e)}")
        return jsonify(_standard_execution_payload(output='', error=str(e), return_code=1)), 500


@app.route('/api/run-async', methods=['POST'])
def run_code_async():
    """Queue code execution and return a job id for polling."""
    try:
        run_request = _validate_run_request(request.get_json())
        manager = _get_async_execution_manager()
        job_id = manager.submit(run_request)
        return jsonify({
            'success': True,
            'job_id': job_id,
            'status': 'queued'
        }), 202
    except ApiRequestError as e:
        return jsonify({'success': False, 'error': e.message}), e.status_code
    except Exception as e:
        logger.error(f"Async run enqueue error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Poll async job state and retrieve result once completed."""
    try:
        job = job_store.get(job_id)
        if not job:
            return jsonify({'success': False, 'error': f'Job {job_id} not found'}), 404

        payload = {
            'success': True,
            'job_id': job.job_id,
            'status': job.status,
            'created_at': job.created_at,
            'started_at': job.started_at,
            'finished_at': job.finished_at
        }

        if job.status == 'completed':
            payload['result'] = job.result
        elif job.status == 'failed':
            payload['error'] = job.error or 'Job execution failed'

        return jsonify(payload), 200
    except Exception as e:
        logger.error(f"Job status error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# COMBINED ENDPOINT
# ============================================================================

@app.route('/api/submit', methods=['POST'])
def submit_solution():
    """
    Submit and analyze a complete solution
    Runs tests, gets AI analysis, and returns comprehensive feedback
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        problem_id = data.get('problem_id')
        code = data.get('code')
        language = _normalize_language(data.get('language', 'python'))
        judge_mode = _get_judge_mode(data)
        
        # Validation
        if not problem_id:
            return jsonify({
                'success': False,
                'error': 'Problem ID is required'
            }), 400
        
        if not code or not code.strip():
            return jsonify({
                'success': False,
                'error': 'Code is required'
            }), 400
        
        if language not in SUPPORTED_LANGUAGES:
            return jsonify({
                'success': False,
                'error': f'Unsupported language. Use one of: {", ".join(sorted(SUPPORTED_LANGUAGES))}'
            }), 400
        
        # Get problem
        problem = problem_db.get_problem(problem_id)
        if not problem:
            return jsonify({
                'success': False,
                'error': f'Problem {problem_id} not found'
            }), 404

        is_template_valid, template_error = _validate_template_signature(problem, code, language)
        if not is_template_valid:
            return jsonify({
                'success': False,
                'error': template_error
            }), 400
        
        logger.info(f"Submitting solution for problem {problem_id}")
        
        # Step 1: Run tests
        test_cases = problem_db.get_judge_test_cases(problem_id)
        if language == 'python':
            execution_test_cases = copy.deepcopy(test_cases)
            test_result = python_executor.execute_with_function(
                code,
                problem.get('function_name'),
                execution_test_cases
            )
        else:
            execution_test_cases = copy.deepcopy(test_cases)
            test_result = source_executor.execute_with_test_cases(
                code,
                language,
                execution_test_cases,
                problem.get('function_name')
            )

        test_result = _apply_reference_crossmatch(problem, language, test_cases, test_result)

        ai_validation = None
        if judge_mode == 'ai':
            test_result, ai_validation = _apply_ai_judge(problem, code, language, test_result)
        elif judge_mode == 'hybrid' and not test_result.get('all_passed'):
            test_result, ai_validation = _apply_ai_judge(problem, code, language, test_result)
        
        # Step 2: Get AI analysis
        if AI_ENABLED:
            analysis = ai_analyzer.analyze_code(
                code=code,
                problem_description=problem['description'],
                language=language,
                test_results=test_result
            )
        else:
            analysis = _deterministic_analysis(code, language, test_result)
        
        status = _derive_verdict(test_result)
        test_result['verdict'] = status
        test_result['test_results'] = _redact_hidden_test_results(test_result.get('test_results', []))
        
        return jsonify({
            'success': True,
            'problem_id': problem_id,
            'language': language,
            'submission_status': status,
            'test_results': test_result,
            'analysis': analysis,
            'ai_validation': ai_validation,
            'judge_mode': judge_mode,
            'timestamp': __import__('datetime').datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Submission error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Default backend port.
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False') == 'True'
    
    logger.info(f"Starting CodeBud DSA Analyzer Server on port {port}")
    app.run(debug=debug, host='0.0.0.0', port=port)

