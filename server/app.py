from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from services.mongodb_service import db_service
from services.s3_service import s3_service
from dsa_analyzer import analyze_code, get_problem, get_all_problems
from functools import wraps
import os
import jwt  # type: ignore
import json
import uuid
import re
import html
from datetime import datetime, timedelta
from bson import ObjectId  # type: ignore
from dotenv import load_dotenv  # type: ignore

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
JWT_SECRET = os.getenv('JWT_SECRET', 'codebud-jwt-secret-dev-2026')
JWT_EXPIRY_DAYS = int(os.getenv('JWT_EXPIRY_DAYS', '7'))

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Active users tracking
active_users = {}

print("=" * 50)
print("CodeBud Backend Server Starting...")
print("=" * 50)

print("[INFO] Custom JWT authentication: ENABLED")


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
    serialized = serialize_doc(user)
    if serialized is None:
        return None
    # Keep a stable `name` field for frontend/API clients while preserving legacy display_name.
    serialized['name'] = serialized.get('name') or serialized.get('display_name') or serialized.get('email', '').split('@')[0]
    return serialized


def sanitize_name(name: str) -> str:
    """Sanitize display name to mitigate script injection in downstream clients."""
    safe = html.escape(str(name or '').strip())
    return safe[:80]


def is_valid_email(email: str) -> bool:
    """Basic RFC-like email validation for auth endpoints."""
    return bool(re.match(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$', str(email or '')))


def generate_token(user):
    """Generate JWT token for a user"""
    payload = {
        'user_id': str(user['_id']),
        'email': user['email'],
        'role': user.get('role', 'student'),
        'onboarding_completed': user.get('onboarding_completed', True),
        'exp': datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS),
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
            g.auth_method = 'jwt'
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    """Decorator to require admin role (includes JWT auth check)"""
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
            g.auth_method = 'jwt'
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        # Admin check
        if g.current_user_role not in ('admin', 'super_admin'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


def require_mentor(f):
    """Decorator to require mentor role (includes auth check). Admins/super_admins also pass."""
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
            g.auth_method = 'jwt'
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        if g.current_user_role not in ('mentor', 'admin', 'super_admin'):
            return jsonify({'success': False, 'error': 'Mentor access required'}), 403
        return f(*args, **kwargs)
    return decorated


def require_super_admin(f):
    """Decorator to require super_admin role."""
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
            g.auth_method = 'jwt'
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        if g.current_user_role != 'super_admin':
            return jsonify({'success': False, 'error': 'Super admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


def require_company(f):
    """Decorator to require company role. Admins/super_admins also pass."""
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
            g.auth_method = 'jwt'
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        if g.current_user_role not in ('company', 'admin', 'super_admin'):
            return jsonify({'success': False, 'error': 'Company access required'}), 403
        return f(*args, **kwargs)
    return decorated


# ──────────── AUTH ROUTES ────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Create a new account"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'student')
    name = sanitize_name(data.get('name', data.get('displayName', '')))

    if not name:
        return jsonify({'success': False, 'error': 'Name is required'}), 400

    if not email or not password:
        return jsonify({'success': False, 'error': 'Name, email and password are required'}), 400

    if not is_valid_email(email):
        return jsonify({'success': False, 'error': 'Invalid email format'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400

    if role not in ('student', 'mentor', 'admin', 'super_admin', 'company'):
        return jsonify({'success': False, 'error': 'Invalid role'}), 400

    # ── P0 Security: Restrict privileged role creation ──
    if role in ('mentor', 'admin', 'super_admin', 'company'):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        is_privileged = False
        if token:
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                if payload.get('role') in ('admin', 'super_admin'):
                    is_privileged = True
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                pass

        # Bootstrap: allow creating the very first super_admin when none exists
        if role == 'super_admin' and not is_privileged:
            existing_sa = db_service.users.find_one({'role': 'super_admin'})
            if existing_sa is None:
                is_privileged = True  # No super_admin yet — bootstrap allowed
                print("[INFO] Bootstrap: allowing first super_admin creation")

        if not is_privileged:
            return jsonify({'success': False, 'error': 'Admin account creation requires admin authorization'}), 403

    try:
        user = db_service.create_user(email, password, role, name)
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


@app.route('/api/auth/signup', methods=['POST'])
def signup_alias():
    """Backward-compatible alias for existing frontend clients."""
    return register()


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

    if not is_valid_email(email):
        return jsonify({'success': False, 'error': 'Invalid email format'}), 400

    user = db_service.authenticate_user(email, password)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

    # Block deactivated accounts from logging in
    if user.get('status') == 'inactive':
        return jsonify({'success': False, 'error': 'Your account has been deactivated. Contact an administrator.'}), 403

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


@app.route('/api/users/<user_id>', methods=['PATCH'])
@require_admin
def update_user(user_id):
    """Update user profile (admin only). Supports: role, status, display_name"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    allowed_fields = {'role', 'status', 'display_name'}
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    if not updates:
        return jsonify({'success': False, 'error': 'No valid fields to update'}), 400

    if 'role' in updates and updates['role'] not in ('student', 'mentor', 'admin', 'super_admin'):
        return jsonify({'success': False, 'error': 'Invalid role value'}), 400

    if 'status' in updates and updates['status'] not in ('active', 'inactive'):
        return jsonify({'success': False, 'error': 'Invalid status value'}), 400

    # Prevent self-demotion
    if user_id == g.current_user_id and 'role' in updates:
        return jsonify({'success': False, 'error': 'Cannot change your own role'}), 403

    success = db_service.update_user(user_id, updates)
    if not success:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    return jsonify({'success': True, 'message': 'User updated successfully'})


@app.route('/api/users/<user_id>/deactivate', methods=['PATCH'])
@require_admin
def deactivate_user(user_id):
    """Activate or deactivate a user account (admin/super_admin only)"""
    data = request.get_json() or {}
    # Default: deactivate.  Pass {"active": true} to re-activate.
    activate = data.get('active', False)
    new_status = 'active' if activate else 'inactive'

    # Prevent self-deactivation
    if user_id == g.current_user_id and not activate:
        return jsonify({'success': False, 'error': 'Cannot deactivate your own account'}), 403

    target = db_service.get_user(user_id)
    if not target:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    # Prevent deactivating a super_admin unless caller is also super_admin
    if target.get('role') == 'super_admin' and g.current_user_role != 'super_admin':
        return jsonify({'success': False, 'error': 'Only super admins can deactivate other super admins'}), 403

    success = db_service.update_user(user_id, {
        'status': new_status,
        'deactivated_at': datetime.utcnow().isoformat() if not activate else None,
        'deactivated_by': g.current_user_id if not activate else None,
    })
    if not success:
        return jsonify({'success': False, 'error': 'Failed to update user'}), 500

    action = 'activated' if activate else 'deactivated'
    print(f'[INFO] User {user_id} {action} by {g.current_user_id}')
    return jsonify({'success': True, 'message': f'User {action} successfully', 'status': new_status})


@app.route('/api/profile', methods=['PATCH'])
@require_auth
def update_own_profile():
    """Update own profile (authenticated user). Supports: display_name, bio, phone"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    allowed_fields = {'display_name', 'bio', 'phone'}
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    if not updates:
        return jsonify({'success': False, 'error': 'No valid fields to update'}), 400

    updates['updated_at'] = datetime.utcnow().isoformat()

    success = db_service.update_user(g.current_user_id, updates)
    if not success:
        return jsonify({'success': False, 'error': 'Failed to update profile'}), 500

    # Return updated user
    user = db_service.get_user(g.current_user_id)
    return jsonify({'success': True, 'data': serialize_user(user)})


@app.route('/api/profile/avatar', methods=['POST'])
@require_auth
def upload_avatar():
    """Upload avatar image for the authenticated user"""
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'error': 'No avatar file provided'}), 400

    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400

    # Validate file type
    allowed_ext = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed_ext:
        return jsonify({'success': False, 'error': f'Invalid file type. Allowed: {", ".join(allowed_ext)}'}), 400

    # Validate file size (max 5MB)
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)  # Reset
    if size > 5 * 1024 * 1024:
        return jsonify({'success': False, 'error': 'File too large. Max 5MB.'}), 400

    # Upload via S3 service
    file_data = file.read()
    key = s3_service.upload_avatar(g.current_user_id, file_data, f'avatar.{ext}')
    if not key:
        return jsonify({'success': False, 'error': 'Upload failed'}), 500

    # Get the URL (presigned or mock)
    avatar_url = s3_service.get_avatar_url(g.current_user_id, key)

    # Save avatar URL to user doc
    db_service.update_user(g.current_user_id, {
        'avatar_url': avatar_url,
        'avatar_key': key,
        'updated_at': datetime.utcnow().isoformat()
    })

    return jsonify({
        'success': True,
        'data': {'avatar_url': avatar_url, 'avatar_key': key}
    })


@app.route('/api/profile/avatar/<user_id>', methods=['GET'])
def get_avatar(user_id):
    """Serve avatar image (mock mode serves from local storage)"""
    user = db_service.get_user(user_id)
    if not user or not user.get('avatar_key'):
        return jsonify({'success': False, 'error': 'No avatar found'}), 404

    key = user['avatar_key']

    if s3_service.use_mock:
        # Serve from local file system
        import mimetypes
        file_path = os.path.join(s3_service.mock_path, key)
        if not os.path.exists(file_path):
            return jsonify({'success': False, 'error': 'Avatar file missing'}), 404
        ext = key.rsplit('.', 1)[-1].lower()
        mime = mimetypes.types_map.get(f'.{ext}', 'image/png')
        from flask import send_file
        return send_file(file_path, mimetype=mime)
    else:
        # Redirect to presigned S3 URL
        url = s3_service.generate_presigned_url(key, expiration=3600)
        if url:
            from flask import redirect
            return redirect(url)
        return jsonify({'success': False, 'error': 'Failed to generate URL'}), 500


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
    # Users can only see their own unless admin or assigned mentor
    if user_id != g.current_user_id and g.current_user_role not in ('admin', 'super_admin'):
        # Mentors can view assigned students
        if g.current_user_role == 'mentor':
            assignment = db_service.mentor_students.find_one({
                'mentor_id': g.current_user_id,
                'student_id': user_id,
                'status': 'active'
            })
            if not assignment:
                return jsonify({'success': False, 'error': 'Access denied — student not assigned to you'}), 403
        else:
            return jsonify({'success': False, 'error': 'Access denied'}), 403

    submissions = db_service.get_user_submissions(user_id)
    return jsonify({
        'success': True,
        'data': [serialize_doc(s) for s in submissions],
        'count': len(submissions)
    })


# ──────────── APTITUDE QUESTION ROUTES ────────────

def _normalize_question_options(raw_options):
    """Normalize quiz options into a simple string array."""
    if isinstance(raw_options, list):
        return [str(option) for option in raw_options]

    if isinstance(raw_options, dict):
        return [str(raw_options[key]) for key in raw_options.keys()]

    if isinstance(raw_options, str):
        trimmed = raw_options.strip()
        if not trimmed:
            return []
        if '|' in trimmed:
            return [item.strip() for item in trimmed.split('|') if item.strip()]
        if ',' in trimmed:
            return [item.strip() for item in trimmed.split(',') if item.strip()]
        return [trimmed]

    return []


def _resolve_question_correct_index(raw_question, options, raw_options):
    """Resolve the correct option index from mixed question formats."""
    candidates = [
        raw_question.get('correct'),
        raw_question.get('correct_answer'),
        raw_question.get('answer'),
    ]

    for candidate in candidates:
        if isinstance(candidate, int):
            if 0 <= candidate < len(options):
                return candidate
            if 1 <= candidate <= len(options):
                return candidate - 1

        if isinstance(candidate, str):
            value = candidate.strip()
            if not value:
                continue

            if value.isdigit():
                number = int(value)
                if 0 <= number < len(options):
                    return number
                if 1 <= number <= len(options):
                    return number - 1

            if isinstance(raw_options, dict):
                keys = list(raw_options.keys())
                for idx, key in enumerate(keys):
                    if str(key).strip().lower() == value.lower():
                        return idx

            for idx, option in enumerate(options):
                if str(option).strip().lower() == value.lower():
                    return idx

    return -1


def _extract_questions_from_quiz_content(raw_content, section_title, lesson_id):
    """Extract normalized question objects from lesson JSON content."""
    parsed = raw_content
    if isinstance(raw_content, str):
        try:
            parsed = json.loads(raw_content)
        except Exception:
            parsed = []

    if isinstance(parsed, list):
        raw_questions = parsed
    elif isinstance(parsed, dict) and isinstance(parsed.get('questions'), list):
        raw_questions = parsed.get('questions')
    else:
        raw_questions = []

    normalized = []
    for idx, raw_question in enumerate(raw_questions):
        if not isinstance(raw_question, dict):
            continue

        options = _normalize_question_options(raw_question.get('options'))
        if not options:
            continue

        question_text = raw_question.get('question', 'Untitled question')
        if not isinstance(question_text, str):
            question_text = str(question_text)

        normalized.append({
            'id': str(raw_question.get('id', f'{lesson_id}_{idx + 1}')),
            'question': question_text,
            'options': options,
            'correct': _resolve_question_correct_index(raw_question, options, raw_question.get('options')),
            'category': raw_question.get('category', section_title),
            'hint': raw_question.get('hint', ''),
        })

    return normalized


@app.route('/api/aptitude/questions', methods=['GET'])
def get_aptitude_questions():
    """Fetch aptitude questions from DB-backed Industry Prepare course content."""
    requested_course_id = request.args.get('course_id', '').strip()
    limit = request.args.get('limit', type=int)

    course = None
    if requested_course_id:
        course = _find_course(requested_course_id)

    if not course:
        course = db_service.courses.find_one({'title': 'Industry Prepare'})

    if not course:
        for item in db_service.courses.find({}):
            title = str(item.get('title', '')).lower()
            tags = [str(tag).lower() for tag in (item.get('tags', []) or [])]
            if ('industry' in title and 'prepare' in title) or ('aptitude' in tags):
                course = item
                break

    if not course:
        return jsonify({'success': False, 'error': 'Aptitude question bank not found in database'}), 404

    questions = []
    for section in (course.get('sections', []) or []):
        section_title = section.get('title', 'General')
        for lesson in (section.get('lessons', []) or []):
            if lesson.get('type') != 'quiz':
                continue
            lesson_id = lesson.get('_id', _gen_id())
            lesson_questions = _extract_questions_from_quiz_content(
                lesson.get('content', ''),
                section_title,
                lesson_id,
            )
            questions.extend(lesson_questions)

    if not questions:
        return jsonify({'success': False, 'error': 'No aptitude quiz questions found in database'}), 404

    if isinstance(limit, int) and limit > 0:
        questions = questions[:limit]

    return jsonify({
        'success': True,
        'course_id': str(course.get('_id', '')),
        'count': len(questions),
        'questions': questions,
    })


# ──────────── MENTOR ROUTES ────────────

@app.route('/api/mentor/students', methods=['GET'])
@require_mentor
def get_mentor_students():
    """Get all students assigned to the current mentor"""
    mentor_id = g.current_user_id
    # Admins can pass ?mentor_id=... to view any mentor's students
    if g.current_user_role in ('admin', 'super_admin') and request.args.get('mentor_id'):
        mentor_id = request.args.get('mentor_id')

    assignments = list(db_service.mentor_students.find({
        'mentor_id': mentor_id,
        'status': 'active'
    }))

    student_ids = [a['student_id'] for a in assignments]
    students = []
    for sid in student_ids:
        user = db_service.get_user(sid)
        if user:
            students.append(serialize_user(user))

    return jsonify({
        'success': True,
        'data': students,
        'count': len(students)
    })


@app.route('/api/mentor/students', methods=['POST'])
@require_admin
def assign_student_to_mentor():
    """Assign a student to a mentor (admin only)"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    mentor_id = data.get('mentor_id')
    student_id = data.get('student_id')

    if not mentor_id or not student_id:
        return jsonify({'success': False, 'error': 'mentor_id and student_id required'}), 400

    # Verify mentor exists and has mentor role
    mentor = db_service.get_user(mentor_id)
    if not mentor or mentor.get('role') != 'mentor':
        return jsonify({'success': False, 'error': 'Invalid mentor'}), 404

    # Verify student exists
    student = db_service.get_user(student_id)
    if not student:
        return jsonify({'success': False, 'error': 'Student not found'}), 404

    # Check if already assigned
    existing = db_service.mentor_students.find_one({
        'mentor_id': mentor_id,
        'student_id': student_id,
        'status': 'active'
    })
    if existing:
        return jsonify({'success': False, 'error': 'Student already assigned to this mentor'}), 409

    assignment = {
        'mentor_id': mentor_id,
        'student_id': student_id,
        'assigned_by': g.current_user_id,
        'status': 'active',
        'assigned_at': datetime.utcnow()
    }
    db_service.mentor_students.insert_one(assignment)

    print(f"[INFO] Student {student_id} assigned to mentor {mentor_id} by {g.current_user_id}")
    return jsonify({'success': True, 'message': 'Student assigned successfully'}), 201


@app.route('/api/mentor/students/<student_id>', methods=['DELETE'])
@require_admin
def unassign_student_from_mentor(student_id):
    """Remove a student from a mentor (admin only)"""
    mentor_id = request.args.get('mentor_id')
    if not mentor_id:
        return jsonify({'success': False, 'error': 'mentor_id query param required'}), 400

    result = db_service.mentor_students.update_one(
        {'mentor_id': mentor_id, 'student_id': student_id, 'status': 'active'},
        {'$set': {'status': 'removed', 'removed_at': datetime.utcnow(), 'removed_by': g.current_user_id}}
    )

    if result.modified_count == 0:
        return jsonify({'success': False, 'error': 'Assignment not found'}), 404

    return jsonify({'success': True, 'message': 'Student unassigned successfully'})


@app.route('/api/mentor/students/<student_id>/analytics', methods=['GET'])
@require_mentor
def get_student_analytics(student_id):
    """Get performance analytics for an assigned student"""
    mentor_id = g.current_user_id
    if g.current_user_role in ('admin', 'super_admin'):
        mentor_id = request.args.get('mentor_id', mentor_id)
    else:
        # Verify assignment
        assignment = db_service.mentor_students.find_one({
            'mentor_id': mentor_id,
            'student_id': student_id,
            'status': 'active'
        })
        if not assignment:
            return jsonify({'success': False, 'error': 'Student not assigned to you'}), 403

    # Gather aptitude submissions
    apt_submissions = list(db_service.submissions.find({'user_id': student_id}).sort('submitted_at', -1))
    # Gather DSA code submissions
    dsa_submissions = list(db_service.code_submissions.find({'user_id': student_id}).sort('submitted_at', -1))

    # Calculate averages
    apt_scores = [s.get('score', 0) for s in apt_submissions if s.get('score') is not None]
    avg_aptitude = round(sum(apt_scores) / len(apt_scores), 2) if apt_scores else 0

    # DSA analytics
    dsa_passed = sum(1 for s in dsa_submissions if s.get('passed'))
    dsa_total = len(dsa_submissions)

    # Time analytics
    total_time = sum(s.get('time_taken', 0) for s in apt_submissions)

    # Student profile
    student = db_service.get_user(student_id)

    return jsonify({
        'success': True,
        'student': serialize_user(student) if student else None,
        'analytics': {
            'aptitude': {
                'avg_score': avg_aptitude,
                'total_attempts': len(apt_submissions),
                'scores': [{'score': s.get('score'), 'date': s.get('submitted_at').isoformat() if isinstance(s.get('submitted_at'), datetime) else s.get('submitted_at')} for s in apt_submissions[:20]],
            },
            'dsa': {
                'total_submissions': dsa_total,
                'passed': dsa_passed,
                'pass_rate': round((dsa_passed / dsa_total * 100), 1) if dsa_total > 0 else 0,
            },
            'time_spent': total_time,
            'last_active': student.get('last_active').isoformat() if student and isinstance(student.get('last_active'), datetime) else None,
        }
    })


@app.route('/api/mentor/feedback', methods=['POST'])
@require_mentor
def add_mentor_feedback():
    """Add structured feedback for a student submission"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    student_id = data.get('student_id')
    submission_id = data.get('submission_id')
    feedback_text = data.get('feedback', '').strip()
    rating = data.get('rating')  # 1-5 optional
    category = data.get('category', 'general')  # general, code_quality, approach, optimization

    if not student_id or not feedback_text:
        return jsonify({'success': False, 'error': 'student_id and feedback required'}), 400

    # Verify assignment (IDOR prevention)
    if g.current_user_role == 'mentor':
        assignment = db_service.mentor_students.find_one({
            'mentor_id': g.current_user_id,
            'student_id': student_id,
            'status': 'active'
        })
        if not assignment:
            return jsonify({'success': False, 'error': 'Student not assigned to you'}), 403

    if rating is not None and (not isinstance(rating, int) or rating < 1 or rating > 5):
        return jsonify({'success': False, 'error': 'Rating must be 1-5'}), 400

    feedback = {
        'mentor_id': g.current_user_id,
        'student_id': student_id,
        'submission_id': submission_id,
        'feedback': feedback_text,
        'rating': rating,
        'category': category,
        'created_at': datetime.utcnow()
    }
    result = db_service.mentor_feedback.insert_one(feedback)

    print(f"[INFO] Mentor {g.current_user_id} added feedback for student {student_id}")
    return jsonify({
        'success': True,
        'feedback_id': str(result.inserted_id),
        'message': 'Feedback added'
    }), 201


@app.route('/api/mentor/feedback/<student_id>', methods=['GET'])
@require_mentor
def get_student_feedback(student_id):
    """Get all feedback for an assigned student"""
    if g.current_user_role == 'mentor':
        assignment = db_service.mentor_students.find_one({
            'mentor_id': g.current_user_id,
            'student_id': student_id,
            'status': 'active'
        })
        if not assignment:
            return jsonify({'success': False, 'error': 'Student not assigned to you'}), 403

    mentor_filter = {'student_id': student_id}
    if g.current_user_role == 'mentor':
        mentor_filter['mentor_id'] = g.current_user_id

    feedbacks = list(db_service.mentor_feedback.find(mentor_filter).sort('created_at', -1))
    return jsonify({
        'success': True,
        'data': [serialize_doc(f) for f in feedbacks],
        'count': len(feedbacks)
    })


@app.route('/api/mentor/feedback/<feedback_id>', methods=['PATCH'])
@require_mentor
def update_feedback(feedback_id):
    """Edit feedback (only by the author)"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    try:
        fb = db_service.mentor_feedback.find_one({'_id': ObjectId(feedback_id)})
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid feedback ID'}), 400

    if not fb:
        return jsonify({'success': False, 'error': 'Feedback not found'}), 404

    # Only the author or admin can edit
    if g.current_user_role == 'mentor' and fb['mentor_id'] != g.current_user_id:
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    allowed = {'feedback', 'rating', 'category'}
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        return jsonify({'success': False, 'error': 'Nothing to update'}), 400

    if 'rating' in updates and updates['rating'] is not None:
        if not isinstance(updates['rating'], int) or updates['rating'] < 1 or updates['rating'] > 5:
            return jsonify({'success': False, 'error': 'Rating must be 1-5'}), 400

    updates['updated_at'] = datetime.utcnow()
    db_service.mentor_feedback.update_one(
        {'_id': ObjectId(feedback_id)},
        {'$set': updates}
    )

    return jsonify({'success': True, 'message': 'Feedback updated'})


@app.route('/api/mentor/feedback/<feedback_id>', methods=['DELETE'])
@require_mentor
def delete_feedback(feedback_id):
    """Delete feedback (only by the author or admin)"""
    try:
        fb = db_service.mentor_feedback.find_one({'_id': ObjectId(feedback_id)})
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid feedback ID'}), 400

    if not fb:
        return jsonify({'success': False, 'error': 'Feedback not found'}), 404

    if g.current_user_role == 'mentor' and fb['mentor_id'] != g.current_user_id:
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    db_service.mentor_feedback.delete_one({'_id': ObjectId(feedback_id)})

    return jsonify({'success': True, 'message': 'Feedback deleted'})


@app.route('/api/mentor/practice-sets', methods=['POST'])
@require_mentor
def create_practice_set():
    """Create a custom practice set with selected DSA problems"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    problem_ids = data.get('problem_ids', [])
    assigned_students = data.get('assigned_students', [])
    deadline = data.get('deadline')  # ISO 8601 string

    if not title or not problem_ids:
        return jsonify({'success': False, 'error': 'Title and at least one problem required'}), 400

    # Validate problem IDs exist
    all_problems = get_all_problems()
    valid_pids = [pid for pid in problem_ids if pid in all_problems]
    if not valid_pids:
        return jsonify({'success': False, 'error': 'No valid problem IDs provided'}), 400

    # Verify assigned students belong to mentor (IDOR prevention)
    if g.current_user_role == 'mentor' and assigned_students:
        my_assignments = list(db_service.mentor_students.find({
            'mentor_id': g.current_user_id,
            'status': 'active'
        }))
        my_student_ids = {a['student_id'] for a in my_assignments}
        for sid in assigned_students:
            if sid not in my_student_ids:
                return jsonify({'success': False, 'error': f'Student {sid} is not assigned to you'}), 403

    practice_set = {
        'mentor_id': g.current_user_id,
        'title': title,
        'description': description,
        'problem_ids': valid_pids,
        'assigned_students': assigned_students,
        'deadline': deadline,
        'status': 'active',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    result = db_service.practice_sets.insert_one(practice_set)

    print(f"[INFO] Practice set '{title}' created by mentor {g.current_user_id}")
    return jsonify({
        'success': True,
        'practice_set_id': str(result.inserted_id),
        'message': 'Practice set created'
    }), 201


@app.route('/api/mentor/practice-sets', methods=['GET'])
@require_mentor
def get_practice_sets():
    """Get practice sets created by the current mentor"""
    mentor_id = g.current_user_id
    if g.current_user_role in ('admin', 'super_admin') and request.args.get('mentor_id'):
        mentor_id = request.args.get('mentor_id')

    sets = list(db_service.practice_sets.find({
        'mentor_id': mentor_id,
        'status': 'active'
    }).sort('created_at', -1))

    # Enrich with completion stats
    enriched = []
    for ps in sets:
        ps_id = str(ps['_id'])
        total_assigned = len(ps.get('assigned_students', []))
        completed = db_service.practice_submissions.count_documents({
            'practice_set_id': ps_id,
            'completed': True
        }) if total_assigned > 0 else 0

        doc = serialize_doc(ps)
        doc['completion_rate'] = round((completed / total_assigned * 100), 1) if total_assigned > 0 else 0
        doc['completed_count'] = completed
        enriched.append(doc)

    return jsonify({
        'success': True,
        'data': enriched,
        'count': len(enriched)
    })


@app.route('/api/mentor/practice-sets/<set_id>', methods=['PATCH'])
@require_mentor
def update_practice_set(set_id):
    """Update a practice set (only by creator or admin)"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    ps = db_service.practice_sets.find_one({'_id': ObjectId(set_id)})
    if not ps:
        return jsonify({'success': False, 'error': 'Practice set not found'}), 404

    # Only the creator or admin can update
    if g.current_user_role == 'mentor' and ps['mentor_id'] != g.current_user_id:
        return jsonify({'success': False, 'error': 'Access denied'}), 403

    allowed = {'title', 'description', 'problem_ids', 'assigned_students', 'deadline', 'status'}
    updates = {k: v for k, v in data.items() if k in allowed}
    updates['updated_at'] = datetime.utcnow()

    db_service.practice_sets.update_one(
        {'_id': ObjectId(set_id)},
        {'$set': updates}
    )

    return jsonify({'success': True, 'message': 'Practice set updated'})


@app.route('/api/mentor/practice-sets/<set_id>/submit', methods=['POST'])
@require_auth
def submit_practice_set(set_id):
    """Student submits progress for a practice set"""
    data = request.get_json()
    student_id = g.current_user_id

    ps = db_service.practice_sets.find_one({'_id': ObjectId(set_id)})
    if not ps:
        return jsonify({'success': False, 'error': 'Practice set not found'}), 404

    # Verify student is assigned to this practice set
    if student_id not in ps.get('assigned_students', []):
        return jsonify({'success': False, 'error': 'You are not assigned to this practice set'}), 403

    solved_problems = data.get('solved_problems', [])
    submission = {
        'practice_set_id': set_id,
        'student_id': student_id,
        'solved_problems': solved_problems,
        'total_problems': len(ps.get('problem_ids', [])),
        'completed': len(solved_problems) >= len(ps.get('problem_ids', [])),
        'submitted_at': datetime.utcnow()
    }

    # Upsert — update if already submitted
    db_service.practice_submissions.update_one(
        {'practice_set_id': set_id, 'student_id': student_id},
        {'$set': submission},
        upsert=True
    )

    return jsonify({'success': True, 'message': 'Progress saved'})


@app.route('/api/mentor/dashboard-stats', methods=['GET'])
@require_mentor
def get_mentor_dashboard_stats():
    """Get aggregate stats for the mentor dashboard"""
    mentor_id = g.current_user_id
    if g.current_user_role in ('admin', 'super_admin') and request.args.get('mentor_id'):
        mentor_id = request.args.get('mentor_id')

    assignments = list(db_service.mentor_students.find({
        'mentor_id': mentor_id,
        'status': 'active'
    }))
    student_ids = [a['student_id'] for a in assignments]
    total_students = len(student_ids)

    # Aggregate scores across all assigned students
    all_apt_scores = []
    all_dsa_count = 0
    all_dsa_passed = 0
    active_today = 0

    for sid in student_ids:
        subs = list(db_service.submissions.find({'user_id': sid}))
        for s in subs:
            if s.get('score') is not None:
                all_apt_scores.append(s['score'])

        dsa_subs = list(db_service.code_submissions.find({'user_id': sid}))
        all_dsa_count += len(dsa_subs)
        all_dsa_passed += sum(1 for d in dsa_subs if d.get('passed'))

        user = db_service.get_user(sid)
        if user and isinstance(user.get('last_active'), datetime):
            if (datetime.utcnow() - user['last_active']).total_seconds() < 86400:
                active_today += 1

    avg_aptitude = round(sum(all_apt_scores) / len(all_apt_scores), 2) if all_apt_scores else 0

    practice_sets = db_service.practice_sets.count_documents({
        'mentor_id': mentor_id,
        'status': 'active'
    })

    feedbacks_given = db_service.mentor_feedback.count_documents({
        'mentor_id': mentor_id
    })

    return jsonify({
        'success': True,
        'stats': {
            'total_students': total_students,
            'active_today': active_today,
            'avg_aptitude_score': avg_aptitude,
            'dsa_submissions': all_dsa_count,
            'dsa_pass_rate': round((all_dsa_passed / all_dsa_count * 100), 1) if all_dsa_count > 0 else 0,
            'practice_sets': practice_sets,
            'feedbacks_given': feedbacks_given,
        }
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
@require_auth
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
@require_auth
def submit_code():
    """Submit DSA code for evaluation (alias for /api/run)"""
    return run_code()


# ──────────── CODE SUBMISSION ROUTES (DSA) ────────────

@app.route('/api/code-submissions/<user_id>', methods=['GET'])
@require_auth
def get_code_submissions(user_id):
    """Get code submissions for a user"""
    # Access control: own data, admin, or assigned mentor
    if user_id != g.current_user_id and g.current_user_role not in ('admin', 'super_admin'):
        if g.current_user_role == 'mentor':
            assignment = db_service.mentor_students.find_one({
                'mentor_id': g.current_user_id,
                'student_id': user_id,
                'status': 'active'
            })
            if not assignment:
                return jsonify({'success': False, 'error': 'Access denied — student not assigned to you'}), 403
        else:
            return jsonify({'success': False, 'error': 'Access denied'}), 403

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


# ══════════════════════════════════════════════════════════════
#                    COURSE API ROUTES
# ══════════════════════════════════════════════════════════════

import uuid

def _gen_id():
    """Generate a short unique ID for embedded sub-documents (sections/lessons)."""
    return uuid.uuid4().hex[:12]


@app.route('/api/courses', methods=['POST'])
@require_admin
def create_course():
    """Create a new course (admin/super_admin only)"""
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'success': False, 'error': 'Course title is required'}), 400

    course = {
        'title': title,
        'description': data.get('description', ''),
        'thumbnail_url': data.get('thumbnail_url', ''),
        'difficulty': data.get('difficulty', 'beginner'),
        'estimated_hours': data.get('estimated_hours', 0),
        'tags': data.get('tags', []),
        'instructor_name': data.get('instructor_name', ''),
        'is_published': False,
        'display_order': data.get('display_order', 0),
        'sections': [],
        'created_by': g.current_user_id,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }
    result = db_service.courses.insert_one(course)
    course['_id'] = result.inserted_id
    print(f"[INFO] Course created: {title} by {g.current_user_email}")
    return jsonify({'success': True, 'course': serialize_doc(course)}), 201


@app.route('/api/courses', methods=['GET'])
def list_courses():
    """List courses. Public: published only. Admin: all."""
    is_admin = False
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            payload = jwt.decode(auth_header[7:], JWT_SECRET, algorithms=['HS256'])
            if payload.get('role') in ('admin', 'super_admin'):
                is_admin = True
        except Exception:
            pass

    query = {} if is_admin else {'is_published': True}
    cursor = db_service.courses.find(query).sort('display_order', 1)
    courses = [serialize_doc(c) for c in cursor]

    # Attach enrollment count + avg rating per course
    for c in courses:
        cid = c.get('_id') or c.get('id')
        c['enrollment_count'] = db_service.enrollments.count_documents({'course_id': cid})
        reviews = list(db_service.course_reviews.find({'course_id': cid}))
        if reviews:
            c['avg_rating'] = round(sum(r.get('rating', 0) for r in reviews) / len(reviews), 1)
            c['review_count'] = len(reviews)
        else:
            c['avg_rating'] = 0
            c['review_count'] = 0
    return jsonify({'success': True, 'courses': courses})


@app.route('/api/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    """Get a single course with full sections/lessons."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404

    doc = serialize_doc(course)
    cid = doc.get('_id') or doc.get('id')
    doc['enrollment_count'] = db_service.enrollments.count_documents({'course_id': cid})
    reviews = list(db_service.course_reviews.find({'course_id': cid}))
    doc['avg_rating'] = round(sum(r.get('rating', 0) for r in reviews) / len(reviews), 1) if reviews else 0
    doc['review_count'] = len(reviews)
    return jsonify({'success': True, 'course': doc})


@app.route('/api/courses/<course_id>', methods=['PATCH'])
@require_admin
def update_course(course_id):
    """Update course metadata and/or sections."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404

    data = request.get_json() or {}
    allowed = ['title', 'description', 'thumbnail_url', 'difficulty', 'estimated_hours',
               'tags', 'instructor_name', 'is_published', 'display_order', 'sections']
    updates = {k: v for k, v in data.items() if k in allowed}
    updates['updated_at'] = datetime.utcnow()

    db_service.courses.update_one({'_id': course['_id']}, {'$set': updates})
    updated = _find_course(course_id)
    return jsonify({'success': True, 'course': serialize_doc(updated)})


@app.route('/api/courses/<course_id>', methods=['DELETE'])
@require_admin
def delete_course(course_id):
    """Delete a course."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    db_service.courses.delete_one({'_id': course['_id']})
    return jsonify({'success': True, 'message': 'Course deleted'})


@app.route('/api/courses/<course_id>/publish', methods=['PATCH'])
@require_admin
def toggle_publish_course(course_id):
    """Toggle publish/draft status."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    new_status = not course.get('is_published', False)
    db_service.courses.update_one(
        {'_id': course['_id']},
        {'$set': {'is_published': new_status, 'updated_at': datetime.utcnow()}}
    )
    return jsonify({'success': True, 'is_published': new_status})


# ── Course Sections & Lessons helpers ──

@app.route('/api/courses/<course_id>/sections', methods=['POST'])
@require_admin
def add_section(course_id):
    """Add a section to a course."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    data = request.get_json() or {}
    section = {
        '_id': _gen_id(),
        'title': data.get('title', 'New Section'),
        'order': len(course.get('sections', [])),
        'lessons': [],
    }
    sections = course.get('sections', [])
    sections.append(section)
    db_service.courses.update_one(
        {'_id': course['_id']},
        {'$set': {'sections': sections, 'updated_at': datetime.utcnow()}}
    )
    return jsonify({'success': True, 'section': section}), 201


@app.route('/api/courses/<course_id>/sections/<section_id>/lessons', methods=['POST'])
@require_admin
def add_lesson(course_id, section_id):
    """Add a lesson to a section."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    data = request.get_json() or {}
    lesson = {
        '_id': _gen_id(),
        'title': data.get('title', 'New Lesson'),
        'type': data.get('type', 'text'),  # text | video | code_challenge | quiz | assignment
        'content': data.get('content', ''),
        'duration_minutes': data.get('duration_minutes', 0),
        'order': 0,
    }
    sections = course.get('sections', [])
    for sec in sections:
        if sec.get('_id') == section_id:
            lesson['order'] = len(sec.get('lessons', []))
            sec.setdefault('lessons', []).append(lesson)
            break
    else:
        return jsonify({'success': False, 'error': 'Section not found'}), 404
    db_service.courses.update_one(
        {'_id': course['_id']},
        {'$set': {'sections': sections, 'updated_at': datetime.utcnow()}}
    )
    return jsonify({'success': True, 'lesson': lesson}), 201


# ── Enrollment ──

@app.route('/api/courses/<course_id>/enroll', methods=['POST'])
@require_auth
def enroll_in_course(course_id):
    """Student enrolls in a course."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    if not course.get('is_published', False):
        return jsonify({'success': False, 'error': 'Course not available'}), 400

    cid = str(course['_id'])
    existing = db_service.enrollments.find_one({'user_id': g.current_user_id, 'course_id': cid})
    if existing:
        return jsonify({'success': False, 'error': 'Already enrolled'}), 409

    enrollment = {
        'user_id': g.current_user_id,
        'course_id': cid,
        'progress': {'completed_lessons': [], 'current_lesson_id': None, 'percentage': 0},
        'started_at': datetime.utcnow(),
        'completed_at': None,
        'updated_at': datetime.utcnow(),
    }
    result = db_service.enrollments.insert_one(enrollment)
    enrollment['_id'] = result.inserted_id
    return jsonify({'success': True, 'enrollment': serialize_doc(enrollment)}), 201


@app.route('/api/enrollments/me', methods=['GET'])
@require_auth
def my_enrollments():
    """Get current user's enrolled courses with progress."""
    enrollments = list(db_service.enrollments.find({'user_id': g.current_user_id}))
    result = []
    for e in enrollments:
        doc = serialize_doc(e)
        course = _find_course(doc.get('course_id'))
        if course:
            doc['course'] = serialize_doc(course)
        result.append(doc)
    return jsonify({'success': True, 'enrollments': result})


@app.route('/api/courses/<course_id>/lessons/<lesson_id>/complete', methods=['POST'])
@require_auth
def complete_lesson(course_id, lesson_id):
    """Mark a lesson as complete for current user."""
    cid_str = course_id
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    cid_str = str(course['_id'])

    enrollment = db_service.enrollments.find_one({'user_id': g.current_user_id, 'course_id': cid_str})
    if not enrollment:
        return jsonify({'success': False, 'error': 'Not enrolled'}), 400

    progress = enrollment.get('progress', {'completed_lessons': [], 'current_lesson_id': None, 'percentage': 0})
    completed = progress.get('completed_lessons', [])
    if lesson_id not in completed:
        completed.append(lesson_id)

    # Calculate total lessons
    total_lessons = sum(len(s.get('lessons', [])) for s in course.get('sections', []))
    pct = round((len(completed) / total_lessons) * 100) if total_lessons > 0 else 0
    progress['completed_lessons'] = completed
    progress['percentage'] = pct
    progress['current_lesson_id'] = lesson_id

    updates = {'progress': progress, 'updated_at': datetime.utcnow()}
    if pct >= 100:
        updates['completed_at'] = datetime.utcnow()

    db_service.enrollments.update_one({'_id': enrollment['_id']}, {'$set': updates})
    return jsonify({'success': True, 'progress': progress})


@app.route('/api/courses/<course_id>/progress', methods=['GET'])
@require_auth
def get_course_progress(course_id):
    """Get current user's progress in a course."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    cid_str = str(course['_id'])
    enrollment = db_service.enrollments.find_one({'user_id': g.current_user_id, 'course_id': cid_str})
    if not enrollment:
        return jsonify({'success': True, 'enrolled': False, 'progress': None})
    return jsonify({'success': True, 'enrolled': True, 'progress': serialize_doc(enrollment).get('progress')})


# ── Reviews ──

@app.route('/api/courses/<course_id>/reviews', methods=['POST'])
@require_auth
def add_review(course_id):
    """Add or update a review for a course."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    data = request.get_json() or {}
    rating = data.get('rating')
    if not rating or not (1 <= rating <= 5):
        return jsonify({'success': False, 'error': 'Rating must be 1-5'}), 400

    cid_str = str(course['_id'])
    existing = db_service.course_reviews.find_one({'user_id': g.current_user_id, 'course_id': cid_str})
    if existing:
        db_service.course_reviews.update_one(
            {'_id': existing['_id']},
            {'$set': {'rating': rating, 'review_text': data.get('review_text', ''), 'updated_at': datetime.utcnow()}}
        )
        return jsonify({'success': True, 'message': 'Review updated'})

    review = {
        'user_id': g.current_user_id,
        'course_id': cid_str,
        'rating': rating,
        'review_text': data.get('review_text', ''),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }
    db_service.course_reviews.insert_one(review)
    return jsonify({'success': True, 'message': 'Review added'}), 201


@app.route('/api/courses/<course_id>/reviews', methods=['GET'])
def list_reviews(course_id):
    """List reviews for a course."""
    course = _find_course(course_id)
    if not course:
        return jsonify({'success': False, 'error': 'Course not found'}), 404
    cid_str = str(course['_id'])
    reviews = list(db_service.course_reviews.find({'course_id': cid_str}))
    result = []
    for r in reviews:
        doc = serialize_doc(r)
        user = db_service.get_user(r.get('user_id'))
        doc['user_name'] = user.get('display_name', 'Anonymous') if user else 'Anonymous'
        result.append(doc)
    return jsonify({'success': True, 'reviews': result})


# ── Admin course analytics ──

@app.route('/api/admin/course-stats', methods=['GET'])
@require_admin
def admin_course_stats():
    """Platform-wide course analytics."""
    total_courses = db_service.courses.count_documents({})
    published = db_service.courses.count_documents({'is_published': True})
    total_enrollments = db_service.enrollments.count_documents({})
    completed_enrollments = db_service.enrollments.count_documents({'completed_at': {'$ne': None}})

    return jsonify({
        'success': True,
        'stats': {
            'total_courses': total_courses,
            'published_courses': published,
            'draft_courses': total_courses - published,
            'total_enrollments': total_enrollments,
            'completed_enrollments': completed_enrollments,
            'completion_rate': round((completed_enrollments / total_enrollments * 100)) if total_enrollments > 0 else 0,
        }
    })

# ── Bulk Course Creation for Industry Prepare ──

@app.route('/api/courses/create-industry-prepare', methods=['POST'])
@require_admin
def create_industry_prepare_course():
    """Create the Industry Prepare course with all structured content."""
    try:
        data = request.get_json() or {}
        
        # Check if course already exists
        existing = db_service.courses.find_one({'title': 'Industry Prepare'})
        if existing:
            return jsonify({'success': False, 'error': 'Industry Prepare course already exists'}), 400
        
        # Create main course
        course = {
            'title': 'Industry Prepare',
            'description': 'Comprehensive industry-standard aptitude test preparation covering Quantitative Aptitude, Logical Reasoning, and Verbal Ability. Based on real patterns from TCS NQT, Infosys Infy TQ, Wipro WILP, and Accenture assessments.',
            'thumbnail_url': data.get('thumbnail_url', ''),
            'difficulty': 'intermediate',
            'estimated_hours': 8,
            'tags': ['aptitude', 'quantitative', 'logical-reasoning', 'verbal-ability', 'interview-prep', 'industry-standard'],
            'instructor_name': 'CodeBud Team',
            'is_published': False,  # Admin can publish later
            'display_order': 1000,  # High number to put at end
            'sections': [],
            'created_by': g.current_user_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }
        
        # Insert course first to get ID
        result = db_service.courses.insert_one(course)
        course_id = result.inserted_id
        
        print(f"[INFO] Created Industry Prepare course: {course_id}")
        
        return jsonify({
            'success': True, 
            'course_id': str(course_id),
            'message': 'Industry Prepare course created successfully. Add modules using /api/courses/add-industry-module endpoint.'
        }), 201
        
    except Exception as e:
        print(f"[ERROR] Failed to create Industry Prepare course: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/courses/<course_id>/add-industry-module', methods=['POST'])
@require_admin 
def add_industry_module(course_id):
    """Add a structured module (like Phase 1 questions) to Industry Prepare course."""
    try:
        course = _find_course(course_id)
        if not course:
            return jsonify({'success': False, 'error': 'Course not found'}), 404
            
        data = request.get_json() or {}
        module_data = data.get('module_data')
        
        if not module_data:
            return jsonify({'success': False, 'error': 'module_data is required'}), 400
            
        # Create section for this module
        section_id = _gen_id()
        section = {
            '_id': section_id,
            'title': module_data.get('title', 'Unnamed Module'),
            'order': len(course.get('sections', [])),
            'lessons': []
        }
        
        # Group questions by category 
        questions_by_category = {}
        for question in module_data.get('questions', []):
            category = question.get('category', 'General')
            if category not in questions_by_category:
                questions_by_category[category] = []
            questions_by_category[category].append(question)
        
        # Create lessons for each category
        lesson_order = 0
        for category, questions in questions_by_category.items():
            lesson_id = _gen_id()
            lesson = {
                '_id': lesson_id,
                'title': f'{category} Quiz',
                'type': 'quiz',
                'content': json.dumps(questions, indent=2),  # Store questions as JSON
                'duration_minutes': len(questions) * 2,  # 2 minutes per question
                'order': lesson_order
            }
            section['lessons'].append(lesson)
            lesson_order += 1
            
        # Update course with new section in a way that works for both Mongo and mock DB.
        sections = course.get('sections', [])
        sections.append(section)
        db_service.courses.update_one(
            {'_id': course['_id']},
            {
                '$set': {
                    'sections': sections,
                    'updated_at': datetime.utcnow(),
                }
            }
        )
        
        print(f"[INFO] Added module '{section['title']}' to course {course_id}")
        
        return jsonify({
            'success': True, 
            'message': f'Module "{section["title"]}" added successfully with {len(section["lessons"])} quiz sections'
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to add module to course: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


def _find_course(course_id):
    """Helper to find a course by ID (tries ObjectId then string)."""
    try:
        oid = ObjectId(course_id)
        result = db_service.courses.find_one({'_id': oid})
        if result:
            return result
    except Exception:
        pass
    return db_service.courses.find_one({'_id': course_id})


# ══════════════════════════════════════════════════════════════
#                 COMPANY / JOB API ROUTES
# ══════════════════════════════════════════════════════════════

# ── Company Profile ──

@app.route('/api/company/profile', methods=['POST'])
@require_company
def create_company_profile():
    """Create company profile for the current company user."""
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'success': False, 'error': 'Company name is required'}), 400

    existing = db_service.companies.find_one({'user_id': g.current_user_id})
    if existing:
        return jsonify({'success': False, 'error': 'Company profile already exists'}), 409

    company = {
        'user_id': g.current_user_id,
        'name': name,
        'logo_url': data.get('logo_url', ''),
        'description': data.get('description', ''),
        'website': data.get('website', ''),
        'industry': data.get('industry', ''),
        'size': data.get('size', ''),
        'location': data.get('location', ''),
        'social_links': data.get('social_links', {}),
        'verified': False,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }
    result = db_service.companies.insert_one(company)
    company['_id'] = result.inserted_id
    print(f"[INFO] Company profile created: {name}")
    return jsonify({'success': True, 'company': serialize_doc(company)}), 201


@app.route('/api/company/profile', methods=['GET'])
@require_company
def get_own_company_profile():
    """Get company profile for the current user."""
    company = db_service.companies.find_one({'user_id': g.current_user_id})
    if not company:
        return jsonify({'success': False, 'error': 'No company profile found'}), 404
    return jsonify({'success': True, 'company': serialize_doc(company)})


@app.route('/api/company/profile', methods=['PATCH'])
@require_company
def update_company_profile():
    """Update company profile."""
    company = db_service.companies.find_one({'user_id': g.current_user_id})
    if not company:
        return jsonify({'success': False, 'error': 'No company profile found'}), 404

    data = request.get_json() or {}
    allowed = ['name', 'logo_url', 'description', 'website', 'industry', 'size', 'location', 'social_links']
    updates = {k: v for k, v in data.items() if k in allowed}
    updates['updated_at'] = datetime.utcnow()
    db_service.companies.update_one({'_id': company['_id']}, {'$set': updates})
    updated = db_service.companies.find_one({'_id': company['_id']})
    return jsonify({'success': True, 'company': serialize_doc(updated)})


@app.route('/api/company/profile/<company_id>', methods=['GET'])
def get_public_company_profile(company_id):
    """Public company profile."""
    company = _find_company(company_id)
    if not company:
        return jsonify({'success': False, 'error': 'Company not found'}), 404
    return jsonify({'success': True, 'company': serialize_doc(company)})


# ── Jobs ──

@app.route('/api/jobs', methods=['POST'])
@require_company
def create_job():
    """Create a job posting."""
    company = db_service.companies.find_one({'user_id': g.current_user_id})
    if not company and g.current_user_role in ('admin', 'super_admin'):
        # Admins creating jobs need to specify company_id
        data = request.get_json() or {}
        company_id = data.get('company_id')
        if company_id:
            company = _find_company(company_id)
    elif not company:
        return jsonify({'success': False, 'error': 'Create a company profile first'}), 400

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'success': False, 'error': 'Job title is required'}), 400

    job = {
        'company_id': str(company['_id']),
        'title': title,
        'description': data.get('description', ''),
        'requirements': data.get('requirements', []),
        'skills_required': data.get('skills_required', []),
        'type': data.get('type', 'full-time'),
        'location': data.get('location', ''),
        'salary_range': data.get('salary_range', {}),
        'experience_level': data.get('experience_level', 'entry'),
        'application_deadline': data.get('application_deadline'),
        'is_active': True,
        'views_count': 0,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }
    result = db_service.jobs.insert_one(job)
    job['_id'] = result.inserted_id
    # Include company name in response
    job['company_name'] = company.get('name', '')
    print(f"[INFO] Job created: {title} by {company.get('name')}")
    return jsonify({'success': True, 'job': serialize_doc(job)}), 201


@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    """List active job postings (public). Admins see all."""
    is_admin = False
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            payload = jwt.decode(auth_header[7:], JWT_SECRET, algorithms=['HS256'])
            if payload.get('role') in ('admin', 'super_admin'):
                is_admin = True
            # Company users see their own jobs
            if payload.get('role') == 'company':
                company = db_service.companies.find_one({'user_id': payload['user_id']})
                if company:
                    own_jobs = list(db_service.jobs.find({'company_id': str(company['_id'])}))
                    for j in own_jobs:
                        j_doc = serialize_doc(j)
                        j_doc['company_name'] = company.get('name', '')
                        j_doc['application_count'] = db_service.applications.count_documents({'job_id': str(j['_id'])})
                    result = [serialize_doc(j) for j in own_jobs]
                    for r, j in zip(result, own_jobs):
                        r['company_name'] = company.get('name', '')
                        r['application_count'] = db_service.applications.count_documents({'job_id': r.get('_id') or r.get('id')})
                    return jsonify({'success': True, 'jobs': result})
        except Exception:
            pass

    query = {} if is_admin else {'is_active': True}
    jobs_cursor = db_service.jobs.find(query).sort('created_at', -1)
    result = []
    for j in jobs_cursor:
        doc = serialize_doc(j)
        company = _find_company(j.get('company_id'))
        doc['company_name'] = company.get('name', '') if company else 'Unknown'
        doc['company_logo'] = company.get('logo_url', '') if company else ''
        doc['application_count'] = db_service.applications.count_documents({'job_id': doc.get('_id') or doc.get('id')})
        result.append(doc)
    return jsonify({'success': True, 'jobs': result})


@app.route('/api/jobs/<job_id>', methods=['GET'])
def get_job(job_id):
    """Get a single job with details."""
    job = _find_job(job_id)
    if not job:
        return jsonify({'success': False, 'error': 'Job not found'}), 404
    # Increment view count
    db_service.jobs.update_one({'_id': job['_id']}, {'$set': {'views_count': job.get('views_count', 0) + 1}})
    doc = serialize_doc(job)
    company = _find_company(job.get('company_id'))
    doc['company'] = serialize_doc(company) if company else None
    doc['application_count'] = db_service.applications.count_documents({'job_id': doc.get('_id') or doc.get('id')})
    return jsonify({'success': True, 'job': doc})


@app.route('/api/jobs/<job_id>', methods=['PATCH'])
@require_company
def update_job(job_id):
    """Update a job posting."""
    job = _find_job(job_id)
    if not job:
        return jsonify({'success': False, 'error': 'Job not found'}), 404
    # Verify ownership (unless admin)
    if g.current_user_role not in ('admin', 'super_admin'):
        company = db_service.companies.find_one({'user_id': g.current_user_id})
        if not company or str(company['_id']) != job.get('company_id'):
            return jsonify({'success': False, 'error': 'Not authorized'}), 403

    data = request.get_json() or {}
    allowed = ['title', 'description', 'requirements', 'skills_required', 'type', 'location',
               'salary_range', 'experience_level', 'application_deadline', 'is_active']
    updates = {k: v for k, v in data.items() if k in allowed}
    updates['updated_at'] = datetime.utcnow()
    db_service.jobs.update_one({'_id': job['_id']}, {'$set': updates})
    updated = _find_job(job_id)
    return jsonify({'success': True, 'job': serialize_doc(updated)})


@app.route('/api/jobs/<job_id>', methods=['DELETE'])
@require_company
def delete_job(job_id):
    """Delete a job posting."""
    job = _find_job(job_id)
    if not job:
        return jsonify({'success': False, 'error': 'Job not found'}), 404
    if g.current_user_role not in ('admin', 'super_admin'):
        company = db_service.companies.find_one({'user_id': g.current_user_id})
        if not company or str(company['_id']) != job.get('company_id'):
            return jsonify({'success': False, 'error': 'Not authorized'}), 403
    db_service.jobs.delete_one({'_id': job['_id']})
    return jsonify({'success': True, 'message': 'Job deleted'})


# ── Applications ──

@app.route('/api/jobs/<job_id>/apply', methods=['POST'])
@require_auth
def apply_to_job(job_id):
    """Student applies to a job."""
    job = _find_job(job_id)
    if not job:
        return jsonify({'success': False, 'error': 'Job not found'}), 404
    if not job.get('is_active', False):
        return jsonify({'success': False, 'error': 'Job is no longer accepting applications'}), 400

    jid = str(job['_id'])
    existing = db_service.applications.find_one({'job_id': jid, 'student_id': g.current_user_id})
    if existing:
        return jsonify({'success': False, 'error': 'Already applied'}), 409

    data = request.get_json() or {}
    application = {
        'job_id': jid,
        'student_id': g.current_user_id,
        'company_id': job.get('company_id'),
        'status': 'applied',
        'cover_note': data.get('cover_note', ''),
        'status_history': [{'status': 'applied', 'changed_at': datetime.utcnow().isoformat(), 'changed_by': g.current_user_id}],
        'interview_slot': None,
        'notes': '',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }
    result = db_service.applications.insert_one(application)
    application['_id'] = result.inserted_id
    return jsonify({'success': True, 'application': serialize_doc(application)}), 201


@app.route('/api/jobs/<job_id>/applications', methods=['GET'])
@require_company
def get_job_applications(job_id):
    """Company views applications for a job."""
    job = _find_job(job_id)
    if not job:
        return jsonify({'success': False, 'error': 'Job not found'}), 404
    if g.current_user_role not in ('admin', 'super_admin'):
        company = db_service.companies.find_one({'user_id': g.current_user_id})
        if not company or str(company['_id']) != job.get('company_id'):
            return jsonify({'success': False, 'error': 'Not authorized'}), 403

    jid = str(job['_id'])
    apps = list(db_service.applications.find({'job_id': jid}))
    result = []
    for a in apps:
        doc = serialize_doc(a)
        student = db_service.get_user(a.get('student_id'))
        doc['student'] = serialize_user(student) if student else None
        result.append(doc)
    return jsonify({'success': True, 'applications': result})


@app.route('/api/applications/me', methods=['GET'])
@require_auth
def my_applications():
    """Student views own applications."""
    apps = list(db_service.applications.find({'student_id': g.current_user_id}))
    result = []
    for a in apps:
        doc = serialize_doc(a)
        job = _find_job(a.get('job_id'))
        if job:
            doc['job'] = serialize_doc(job)
            company = _find_company(job.get('company_id'))
            doc['company_name'] = company.get('name', '') if company else 'Unknown'
        result.append(doc)
    return jsonify({'success': True, 'applications': result})


@app.route('/api/applications/<app_id>/status', methods=['PATCH'])
@require_company
def update_application_status(app_id):
    """Company updates application status."""
    application = _find_application(app_id)
    if not application:
        return jsonify({'success': False, 'error': 'Application not found'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    valid_statuses = ('applied', 'screening', 'interview', 'offered', 'rejected', 'withdrawn')
    if new_status not in valid_statuses:
        return jsonify({'success': False, 'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400

    history = application.get('status_history', [])
    history.append({
        'status': new_status,
        'changed_at': datetime.utcnow().isoformat(),
        'changed_by': g.current_user_id,
    })

    db_service.applications.update_one(
        {'_id': application['_id']},
        {'$set': {'status': new_status, 'status_history': history, 'notes': data.get('notes', application.get('notes', '')), 'updated_at': datetime.utcnow()}}
    )
    return jsonify({'success': True, 'status': new_status})


@app.route('/api/applications/<app_id>/interview', methods=['POST'])
@require_company
def schedule_interview(app_id):
    """Schedule an interview for an application."""
    application = _find_application(app_id)
    if not application:
        return jsonify({'success': False, 'error': 'Application not found'}), 404

    data = request.get_json() or {}
    slot = {
        'date': data.get('date'),
        'time': data.get('time'),
        'link': data.get('link', ''),
    }

    history = application.get('status_history', [])
    history.append({
        'status': 'interview',
        'changed_at': datetime.utcnow().isoformat(),
        'changed_by': g.current_user_id,
    })

    db_service.applications.update_one(
        {'_id': application['_id']},
        {'$set': {'status': 'interview', 'interview_slot': slot, 'status_history': history, 'updated_at': datetime.utcnow()}}
    )
    return jsonify({'success': True, 'interview_slot': slot})


# ── Admin Company Management ──

@app.route('/api/admin/companies', methods=['GET'])
@require_admin
def list_companies():
    """List all company profiles (admin)."""
    companies = list(db_service.companies.find({}))
    result = []
    for c in companies:
        doc = serialize_doc(c)
        doc['job_count'] = db_service.jobs.count_documents({'company_id': doc.get('_id') or doc.get('id')})
        user = db_service.get_user(c.get('user_id'))
        doc['email'] = user.get('email', '') if user else ''
        result.append(doc)
    return jsonify({'success': True, 'companies': result})


@app.route('/api/admin/companies/<company_id>/verify', methods=['PATCH'])
@require_admin
def verify_company(company_id):
    """Verify/unverify a company."""
    company = _find_company(company_id)
    if not company:
        return jsonify({'success': False, 'error': 'Company not found'}), 404
    new_status = not company.get('verified', False)
    db_service.companies.update_one(
        {'_id': company['_id']},
        {'$set': {'verified': new_status, 'updated_at': datetime.utcnow()}}
    )
    return jsonify({'success': True, 'verified': new_status})


@app.route('/api/admin/job-stats', methods=['GET'])
@require_admin
def admin_job_stats():
    """Platform-wide job analytics."""
    total_jobs = db_service.jobs.count_documents({})
    active_jobs = db_service.jobs.count_documents({'is_active': True})
    total_applications = db_service.applications.count_documents({})
    total_companies = db_service.companies.count_documents({})
    return jsonify({
        'success': True,
        'stats': {
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'inactive_jobs': total_jobs - active_jobs,
            'total_applications': total_applications,
            'total_companies': total_companies,
        }
    })


def _find_company(company_id):
    """Helper to find a company by ID."""
    if not company_id:
        return None
    try:
        oid = ObjectId(company_id)
        result = db_service.companies.find_one({'_id': oid})
        if result:
            return result
    except Exception:
        pass
    return db_service.companies.find_one({'_id': company_id})


def _find_job(job_id):
    """Helper to find a job by ID."""
    if not job_id:
        return None
    try:
        oid = ObjectId(job_id)
        result = db_service.jobs.find_one({'_id': oid})
        if result:
            return result
    except Exception:
        pass
    return db_service.jobs.find_one({'_id': job_id})


def _find_application(app_id):
    """Helper to find an application by ID."""
    if not app_id:
        return None
    try:
        oid = ObjectId(app_id)
        result = db_service.applications.find_one({'_id': oid})
        if result:
            return result
    except Exception:
        pass
    return db_service.applications.find_one({'_id': app_id})


# ══════════════════════════════════════════════════════════════════════════════
#                    ONBOARDING & PLATFORM CONFIG API
# ══════════════════════════════════════════════════════════════════════════════

# ── Default seed data for platform_config ──
_DEFAULT_PLATFORM_CONFIG = {
    'colleges': [
        'VIT University', 'SRM Institute', 'BITS Pilani', 'NIT Trichy',
        'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIIT Hyderabad',
        'DTU Delhi', 'NSUT Delhi', 'PES University', 'RV College',
        'MIT Manipal', 'Amity University', 'LPU Punjab',
    ],
    'degrees': [
        'B.Tech', 'B.E.', 'B.Sc', 'BCA', 'MCA', 'M.Tech', 'M.Sc',
        'B.Com', 'BBA', 'MBA', 'Ph.D', 'Diploma',
    ],
    'branches': [
        'Computer Science (CSE)', 'Information Technology (IT)',
        'Electronics & Communication (ECE)', 'Electrical (EEE)',
        'Mechanical', 'Civil', 'Chemical', 'Biotechnology',
        'Data Science', 'Artificial Intelligence', 'Cyber Security',
    ],
    'programming_languages': [
        'Python', 'JavaScript', 'Java', 'C++', 'C', 'TypeScript',
        'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'C#',
        'Dart', 'R', 'SQL',
    ],
    'frameworks': [
        'React', 'Next.js', 'Angular', 'Vue.js', 'Node.js', 'Express',
        'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel',
        'Flutter', 'React Native', 'TensorFlow', 'PyTorch',
        'Docker', 'Kubernetes', 'AWS', 'Firebase', 'MongoDB',
        'PostgreSQL', 'Redis', 'GraphQL', 'Tailwind CSS',
    ],
    'interest_topics': [
        'Data Structures & Algorithms', 'Web Development', 'Mobile Development',
        'Machine Learning / AI', 'Cloud Computing', 'DevOps & CI/CD',
        'Cyber Security', 'Blockchain', 'Game Development',
        'Competitive Programming', 'System Design', 'Open Source',
        'UI/UX Design', 'Data Engineering', 'IoT',
    ],
    'career_goals': [
        'Placements / Full-time Job', 'Internship', 'Upskilling',
        'Competitive Programming', 'Higher Studies / Research',
        'Freelancing', 'Startup / Entrepreneurship', 'Teaching / Mentoring',
    ],
    'job_roles': [
        'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
        'Mobile App Developer', 'DevOps Engineer', 'Data Scientist',
        'ML Engineer', 'Cloud Architect', 'Security Engineer',
        'QA / Test Engineer', 'Product Manager', 'UI/UX Designer',
        'Data Analyst', 'Blockchain Developer', 'Game Developer',
    ],
    'dream_companies': [
        'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta',
        'Netflix', 'Uber', 'Flipkart', 'Razorpay', 'Zerodha',
        'Adobe', 'Oracle', 'Salesforce', 'Goldman Sachs', 'Morgan Stanley',
        'Atlassian', 'Stripe', 'Swiggy', 'PhonePe', 'CRED',
    ],
}


def _seed_platform_config():
    """Seed platform_config collection with defaults if empty."""
    for category, values in _DEFAULT_PLATFORM_CONFIG.items():
        existing = db_service.platform_config.find_one({'category': category})
        if not existing:
            db_service.platform_config.insert_one({
                'category': category,
                'values': [{'label': v, 'active': True} for v in values],
                'updated_at': datetime.utcnow(),
            })
    print("[INFO] Platform config seeded")


# Seed on startup
_seed_platform_config()


# ── GET /api/onboarding/config — Fetch all dropdown options for onboarding ──
@app.route('/api/onboarding/config', methods=['GET'])
@require_auth
def get_onboarding_config():
    """Return all platform_config categories (only active values)."""
    docs = list(db_service.platform_config.find({}))
    config = {}
    for doc in docs:
        config[doc['category']] = [
            v['label'] for v in doc.get('values', []) if v.get('active', True)
        ]
    return jsonify({'success': True, 'config': config})


# ── POST /api/onboarding/complete — Save all onboarding data ──
@app.route('/api/onboarding/complete', methods=['POST'])
@require_auth
def complete_onboarding():
    """Save onboarding data, mark user as onboarded, return fresh token."""
    data = request.get_json() or {}

    profile = data.get('profile', {})
    education = data.get('education', {})
    skills = data.get('skills', {})
    career = data.get('career', {})

    # Validate minimum required fields
    if not profile.get('display_name', '').strip():
        return jsonify({'success': False, 'error': 'Display name is required'}), 400
    if not education.get('college', '').strip():
        return jsonify({'success': False, 'error': 'College is required'}), 400
    if not education.get('status', '').strip():
        return jsonify({'success': False, 'error': 'Current status is required'}), 400

    updates = {
        'display_name': profile['display_name'].strip(),
        'onboarding_completed': True,
        'onboarding_completed_at': datetime.utcnow(),
        'profile': {
            'phone': profile.get('phone', ''),
            'dob': profile.get('dob', ''),
            'gender': profile.get('gender', ''),
            'city': profile.get('city', ''),
            'bio': profile.get('bio', ''),
            'linkedin': profile.get('linkedin', ''),
            'github': profile.get('github', ''),
            'portfolio': profile.get('portfolio', ''),
        },
        'education': {
            'status': education.get('status', ''),
            'college': education.get('college', ''),
            'degree': education.get('degree', ''),
            'branch': education.get('branch', ''),
            'year': education.get('year', ''),
            'graduation_year': education.get('graduation_year', ''),
            'cgpa': education.get('cgpa', ''),
        },
        'skills': {
            'languages': skills.get('languages', []),
            'frameworks': skills.get('frameworks', []),
            'interests': skills.get('interests', []),
        },
        'career': {
            'goals': career.get('goals', []),
            'dream_companies': career.get('dream_companies', []),
            'preferred_roles': career.get('preferred_roles', []),
            'weekly_hours': career.get('weekly_hours', ''),
        },
        'updated_at': datetime.utcnow(),
    }

    success = db_service.update_user(g.current_user_id, updates)
    if not success:
        return jsonify({'success': False, 'error': 'Failed to save onboarding data'}), 500

    # Return a fresh token with onboarding_completed = True
    user = db_service.get_user(g.current_user_id)
    new_token = generate_token(user)
    print(f"[INFO] Onboarding completed for user {g.current_user_id}")
    return jsonify({'success': True, 'token': new_token, 'user': serialize_user(user)})


# ── GET /api/onboarding/data — Get current onboarding data for editing ──
@app.route('/api/onboarding/data', methods=['GET'])
@require_auth
def get_onboarding_data():
    """Return the current user's onboarding data (for profile editing)."""
    user = db_service.get_user(g.current_user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    return jsonify({
        'success': True,
        'onboarding_completed': user.get('onboarding_completed', False),
        'data': {
            'profile': {
                'display_name': user.get('display_name', ''),
                'phone': (user.get('profile') or {}).get('phone', ''),
                'dob': (user.get('profile') or {}).get('dob', ''),
                'gender': (user.get('profile') or {}).get('gender', ''),
                'city': (user.get('profile') or {}).get('city', ''),
                'bio': (user.get('profile') or {}).get('bio', ''),
                'linkedin': (user.get('profile') or {}).get('linkedin', ''),
                'github': (user.get('profile') or {}).get('github', ''),
                'portfolio': (user.get('profile') or {}).get('portfolio', ''),
            },
            'education': user.get('education', {}),
            'skills': user.get('skills', {}),
            'career': user.get('career', {}),
        }
    })


# ── Super Admin: Platform Config CRUD ──

@app.route('/api/super-admin/platform-config', methods=['GET'])
@require_super_admin
def get_all_platform_config():
    """Get all config categories for the admin editor."""
    docs = list(db_service.platform_config.find({}))
    result = []
    for doc in docs:
        result.append({
            '_id': str(doc.get('_id', '')),
            'category': doc['category'],
            'values': doc.get('values', []),
            'updated_at': doc.get('updated_at', ''),
        })
    return jsonify({'success': True, 'configs': result})


@app.route('/api/super-admin/platform-config/<category>', methods=['PUT'])
@require_super_admin
def update_platform_config(category):
    """Update a config category's values."""
    data = request.get_json() or {}
    values = data.get('values', [])
    if not isinstance(values, list):
        return jsonify({'success': False, 'error': 'values must be a list'}), 400

    # Normalize: each item should be { label: str, active: bool }
    normalized = []
    for v in values:
        if isinstance(v, str):
            normalized.append({'label': v, 'active': True})
        elif isinstance(v, dict) and 'label' in v:
            normalized.append({'label': v['label'], 'active': v.get('active', True)})

    existing = db_service.platform_config.find_one({'category': category})
    if existing:
        db_service.platform_config.update_one(
            {'category': category},
            {'$set': {'values': normalized, 'updated_at': datetime.utcnow(), 'updated_by': g.current_user_id}}
        )
    else:
        db_service.platform_config.insert_one({
            'category': category,
            'values': normalized,
            'updated_at': datetime.utcnow(),
            'updated_by': g.current_user_id,
        })
    print(f"[INFO] Platform config '{category}' updated by {g.current_user_id}")
    return jsonify({'success': True})


# ── Super Admin: Reset student onboarding ──
@app.route('/api/super-admin/users/<user_id>/reset-onboarding', methods=['POST'])
@require_super_admin
def reset_student_onboarding(user_id):
    """Reset a student's onboarding so they have to redo it."""
    user = db_service.get_user(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    if user.get('role') != 'student':
        return jsonify({'success': False, 'error': 'Only student onboarding can be reset'}), 400

    db_service.update_user(user_id, {
        'onboarding_completed': False,
        'onboarding_reset_at': datetime.utcnow(),
        'onboarding_reset_by': g.current_user_id,
    })
    print(f"[INFO] Onboarding reset for user {user_id} by {g.current_user_id}")
    return jsonify({'success': True, 'message': 'Onboarding reset successfully'})


# ──────────── MAIN ────────────

if __name__ == '__main__':
    print("\n[INFO] System Status:")
    print(f"   Database: {'MongoDB' if db_service.db is not None else 'Mock (In-Memory)'}")
    print(f"   Storage: {'Mock S3 (Local Files)' if s3_service.use_mock else 'AWS S3'}")
    print(f"   Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"   JWT Secret: {'custom' if os.getenv('JWT_SECRET') else 'default (dev)'}")
    print(f"   JWT Expiry (days): {JWT_EXPIRY_DAYS}")
    print("\n[INFO] Server running on: http://localhost:5001")
    print("=" * 50 + "\n")

    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
