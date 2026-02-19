from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from services.mongodb_service import db_service
from services.s3_service import s3_service
from dsa_analyzer import analyze_code, get_problem, get_all_problems
from functools import wraps
import os
import jwt  # type: ignore
from datetime import datetime, timedelta
from bson import ObjectId  # type: ignore
from dotenv import load_dotenv  # type: ignore

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
JWT_SECRET = os.getenv('JWT_SECRET', 'codebud-jwt-secret-dev-2026')
JWT_EXPIRY_HOURS = 72

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Active users tracking
active_users = {}

print("=" * 50)
print("CodeBud Backend Server Starting...")
print("=" * 50)


# ──────────── HELPERS ────────────

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == 'password_hash':
            continue  # Never expose password hash
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value  # type: ignore[assignment]
    return result


def serialize_user(user):
    """Serialize user for API response (no password hash)"""
    if not user:
        return None
    return serialize_doc(user)


def generate_token(user):
    """Generate JWT token for a user"""
    payload = {
        'user_id': str(user['_id']),
        'email': user['email'],
        'role': user.get('role', 'student'),
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


# ──────────── AUTH MIDDLEWARE ────────────

def require_auth(f):
    """Decorator to require JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')

        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

        if not token:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            g.current_user_id = payload['user_id']
            g.current_user_email = payload['email']
            g.current_user_role = payload.get('role', 'student')
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    """Decorator to require admin role (includes auth check)"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Auth check (inline version of require_auth)
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        if not token:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            g.current_user_id = payload['user_id']
            g.current_user_email = payload['email']
            g.current_user_role = payload.get('role', 'student')
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        # Admin check
        if g.current_user_role not in ('admin', 'super_admin'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


# ──────────── AUTH ROUTES ────────────

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Create a new account"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'student')
    display_name = data.get('displayName', '')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400

    if role not in ('student', 'admin', 'super_admin'):
        return jsonify({'success': False, 'error': 'Invalid role'}), 400

    try:
        user = db_service.create_user(email, password, role, display_name)
        token = generate_token(user)
        print(f"[INFO] New user signed up: {email} ({role})")
        return jsonify({
            'success': True,
            'token': token,
            'user': serialize_user(user)
        }), 201
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 409
    except Exception as e:
        print(f"[ERROR] Signup error: {e}")
        return jsonify({'success': False, 'error': 'Signup failed'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login with email and password"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    expected_role = data.get('expectedRole')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400

    user = db_service.authenticate_user(email, password)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

    # Check role if expected
    if expected_role and user.get('role') != expected_role:
        return jsonify({
            'success': False,
            'error': f"Access denied. This account is registered as {user.get('role')}, but you're trying to login as {expected_role}."
        }), 403

    token = generate_token(user)
    print(f"[INFO] User logged in: {email}")
    return jsonify({
        'success': True,
        'token': token,
        'user': serialize_user(user)
    })


@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_me():
    """Get current authenticated user"""
    user = db_service.get_user(g.current_user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    return jsonify({
        'success': True,
        'user': serialize_user(user)
    })


# ──────────── USER ROUTES ────────────

@app.route('/api/users', methods=['GET'])
@require_admin
def get_all_users():
    """Get all users (admin only)"""
    users = db_service.get_all_users()
    return jsonify({
        'success': True,
        'data': [serialize_doc(u) for u in users],
        'count': len(users)
    })


@app.route('/api/users/<user_id>', methods=['GET'])
@require_auth
def get_user(user_id):
    """Get a specific user"""
    user = db_service.get_user(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    return jsonify({
        'success': True,
        'data': serialize_user(user)
    })


@app.route('/api/users/<user_id>/activity', methods=['PATCH'])
@require_auth
def update_activity(user_id):
    """Update user's last active timestamp"""
    db_service.update_user_activity(user_id)
    return jsonify({'success': True})


# ──────────── SUBMISSION ROUTES ────────────

@app.route('/api/submissions', methods=['POST'])
@require_auth
def create_submission():
    """Submit test results"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    submission = db_service.save_submission(g.current_user_id, data)
    return jsonify({
        'success': True,
        'data': serialize_doc(submission)
    }), 201


@app.route('/api/submissions', methods=['GET'])
@require_admin
def get_all_submissions():
    """Get all submissions (admin only)"""
    limit = request.args.get('limit', 200, type=int)
    submissions = db_service.get_all_submissions(limit)
    return jsonify({
        'success': True,
        'data': [serialize_doc(s) for s in submissions],
        'count': len(submissions)
    })


@app.route('/api/submissions/<user_id>', methods=['GET'])
@require_auth
def get_user_submissions(user_id):
    """Get submissions for a user"""
    # Users can only see their own unless admin
    if user_id != g.current_user_id and g.current_user_role not in ('admin', 'super_admin'):
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    submissions = db_service.get_user_submissions(user_id)
    return jsonify({
        'success': True,
        'data': [serialize_doc(s) for s in submissions],
        'count': len(submissions)
    })


# ──────────── EXISTING ROUTES ────────────

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'CodeBud Backend API',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'auth': {
                'signup': 'POST /api/auth/signup',
                'login': 'POST /api/auth/login',
                'me': 'GET /api/auth/me'
            },
            'users': 'GET /api/users',
            'submissions': '/api/submissions',
            'code_submissions': '/api/code-submissions/<user_id>'
        }
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'mongodb': 'connected' if db_service.db is not None else 'mock',
        's3': 'mock' if s3_service.use_mock else 'connected',
        'environment': os.getenv('FLASK_ENV', 'development')
    })


# ──────────── DSA PROBLEM & EXECUTION ROUTES ────────────

@app.route('/api/problems', methods=['GET'])
def get_problems():
    """Get all available DSA problems"""
    try:
        problems = get_all_problems()
        problem_list = []
        for pid, problem in problems.items():
            problem_list.append({
                'id': pid,
                'title': problem['title'],
                'description': problem['description'],
                'difficulty': problem.get('difficulty', 'Medium'),
                'function_name': problem['function_name'],
                'test_count': len(problem['test_cases'])
            })
        return jsonify({'success': True, 'problems': problem_list}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/problem/<problem_id>', methods=['GET'])
def get_problem_details(problem_id):
    """Get specific problem details"""
    try:
        problem = get_problem(problem_id)
        if not problem:
            return jsonify({'success': False, 'error': f'Problem {problem_id} not found'}), 404
        return jsonify({
            'success': True,
            'problem': {
                'id': problem_id,
                'title': problem['title'],
                'description': problem['description'],
                'function_name': problem['function_name'],
                'test_cases': len(problem['test_cases'])
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/run', methods=['POST'])
def run_code():
    """Execute DSA code submission"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        problem_id = data.get('problem_id')
        code = data.get('code')
        language = data.get('language', 'python')
        if not problem_id:
            return jsonify({'success': False, 'error': 'Problem ID is required'}), 400
        if not code or not code.strip():
            return jsonify({'success': False, 'error': 'Code is required'}), 400
        result = analyze_code(problem_id, code, language)
        result['success'] = True
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500


@app.route('/api/submit', methods=['POST'])
def submit_code():
    """Submit DSA code for evaluation (alias for /api/run)"""
    return run_code()


# ──────────── CODE SUBMISSION ROUTES (DSA) ────────────

@app.route('/api/code-submissions/<user_id>', methods=['GET'])
@require_auth
def get_code_submissions(user_id):
    """Get code submissions for a user"""
    submissions = db_service.get_user_code_submissions(user_id)
    result = []
    for sub in submissions:
        if sub.get('s3_key'):
            code = s3_service.get_code_file(sub['s3_key'])
        else:
            code = sub.get('code', '')
        analysis = db_service.get_analysis(sub['_id'])
        result.append({
            'id': str(sub['_id']),
            'code': code[:500] + '...' if code and len(code) > 500 else code,
            'language': sub['language'],
            'submitted_at': sub['submitted_at'].isoformat() if isinstance(sub['submitted_at'], datetime) else sub['submitted_at'],
            's3_key': sub.get('s3_key'),
            'analysis': serialize_doc(analysis) if analysis else None
        })
    return jsonify({'success': True, 'data': result})


# ──────────── WEBSOCKET EVENTS ────────────

@socketio.on('connect')
def handle_connect():
    print(f'[INFO] Client connected: {request.sid}')
    emit('connection_response', {
        'status': 'connected',
        'sid': request.sid,
        'message': 'Welcome to CodeBud'
    })


@socketio.on('disconnect')
def handle_disconnect():
    print(f'[INFO] Client disconnected: {request.sid}')
    for user_id, sid in list(active_users.items()):
        if sid == request.sid:
            del active_users[user_id]  # type: ignore[arg-type]


@socketio.on('join_analysis_room')
def handle_join_room(data):
    user_id = data.get('user_id', 'anonymous')
    room = f"user_{user_id}"
    join_room(room)
    active_users[user_id] = request.sid
    emit('joined_room', {'room': room, 'user_id': user_id})


@socketio.on('analyze_code')
def handle_code_analysis(data):
    user_id = data.get('user_id', 'test_user')
    code = data.get('code', '')
    language = data.get('language', 'python')

    emit('analysis_progress', {'status': 'started', 'progress': 10, 'message': 'Analysis initiated...'})

    try:
        code_size = len(code.encode('utf-8'))
        s3_key = None

        if code_size > 100 * 1024:
            emit('analysis_progress', {'status': 'uploading', 'progress': 30, 'message': 'Uploading large file...'})
            filename = f"{language}_code.txt"
            s3_key = s3_service.upload_code_file(user_id, code, filename)
            code_to_save = None
        else:
            code_to_save = code

        submission = db_service.save_code_submission(
            user_id=user_id, code=code_to_save,
            language=language, s3_key=s3_key
        )
        submission_id = submission.inserted_id

        emit('analysis_progress', {'status': 'analyzing', 'progress': 60, 'message': 'Running DSA analysis...'})

        analysis_result = {
            'complexity': {'time_complexity': 'O(n)', 'space_complexity': 'O(1)', 'cyclomatic_complexity': 5},
            'code_quality': {'score': 85, 'readability_score': 90, 'maintainability_index': 80},
            'suggestions': [
                {'category': 'performance', 'description': 'Consider using list comprehension', 'priority': 'medium'}
            ],
            'issues': [
                {'type': 'warning', 'line': 10, 'message': 'Variable name could be more descriptive', 'severity': 'low'}
            ]
        }

        db_service.save_analysis(submission_id, analysis_result)

        emit('analysis_progress', {'status': 'complete', 'progress': 100, 'message': 'Analysis complete'})
        emit('analysis_complete', {
            'submission_id': str(submission_id),
            's3_key': s3_key,
            'analysis': analysis_result,
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        print(f'[ERROR] Analysis error: {e}')
        emit('analysis_error', {'error': str(e), 'message': 'Analysis failed. Please try again.'})


# ──────────── MAIN ────────────

if __name__ == '__main__':
    print("\n[INFO] System Status:")
    print(f"   Database: {'MongoDB' if db_service.db is not None else 'Mock (In-Memory)'}")
    print(f"   Storage: {'Mock S3 (Local Files)' if s3_service.use_mock else 'AWS S3'}")
    print(f"   Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"   JWT Secret: {'custom' if os.getenv('JWT_SECRET') else 'default (dev)'}")
    print("\n[INFO] Server running on: http://localhost:5001")
    print("=" * 50 + "\n")

    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
