from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from services.mongodb_service import db_service
from services.s3_service import s3_service
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Active users tracking
active_users = {}

print("=" * 50)
print("CodeBud Backend Server Starting...")
print("=" * 50)

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
            del active_users[user_id]
            print(f'[INFO] User {user_id} left')

@socketio.on('join_analysis_room')
def handle_join_room(data):
    user_id = data.get('user_id', 'anonymous')
    room = f"user_{user_id}"
    join_room(room)
    active_users[user_id] = request.sid
    print(f'[INFO] User {user_id} joined room: {room}')
    emit('joined_room', {'room': room, 'user_id': user_id})

@socketio.on('analyze_code')
def handle_code_analysis(data):
    user_id = data.get('user_id', 'test_user')
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    print(f'[INFO] Analyzing code for user: {user_id}')
    
    # Step 1: Started
    emit('analysis_progress', {
        'status': 'started',
        'progress': 10,
        'message': 'Analysis initiated...'
    })
    
    # Step 2: Save submission
    try:
        # Decide: MongoDB or S3
        code_size = len(code.encode('utf-8'))
        s3_key = None
        
        if code_size > 100 * 1024:  # > 100KB
            emit('analysis_progress', {
                'status': 'uploading',
                'progress': 30,
                'message': 'Uploading large file to storage...'
            })
            filename = f"{language}_code.txt"
            s3_key = s3_service.upload_code_file(user_id, code, filename)
            code_to_save = None
        else:
            code_to_save = code
        
        submission = db_service.save_code_submission(
            user_id=user_id,
            code=code_to_save,
            language=language,
            s3_key=s3_key
        )
        submission_id = submission.inserted_id
        
        emit('analysis_progress', {
            'status': 'analyzing',
            'progress': 60,
            'message': 'Running DSA analysis...'
        })
        
        # Step 3: Perform analysis (simplified for testing)
        analysis_result = {
            'complexity': {
                'time_complexity': 'O(n)',
                'space_complexity': 'O(1)',
                'cyclomatic_complexity': 5
            },
            'code_quality': {
                'score': 85,
                'readability_score': 90,
                'maintainability_index': 80
            },
            'suggestions': [
                {
                    'category': 'performance',
                    'description': 'Consider using list comprehension',
                    'priority': 'medium'
                },
                {
                    'category': 'style',
                    'description': 'Add type hints for better code clarity',
                    'priority': 'low'
                }
            ],
            'issues': [
                {
                    'type': 'warning',
                    'line': 10,
                    'message': 'Variable name could be more descriptive',
                    'severity': 'low'
                }
            ]
        }
        
        # Step 4: Save analysis
        db_service.save_analysis(submission_id, analysis_result)
        
        emit('analysis_progress', {
            'status': 'complete',
            'progress': 100,
            'message': 'Analysis complete'
        })
        
        # Step 5: Send final results
        emit('analysis_complete', {
            'submission_id': str(submission_id),
            's3_key': s3_key,
            'analysis': analysis_result,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        print(f'[INFO] Analysis complete for submission: {submission_id}')
        
    except Exception as e:
        print(f'[ERROR] Analysis error: {e}')
        emit('analysis_error', {
            'error': str(e),
            'message': 'Analysis failed. Please try again.'
        })

# REST API Endpoints
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'CodeBud Backend API',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'submissions': '/api/submissions/<user_id>',
            'code': '/api/submission/<submission_id>/code'
        },
        'websocket': {
            'url': 'ws://localhost:5001',
            'events': ['analyze_code', 'join_analysis_room']
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'mongodb': 'connected' if db_service.db else 'mock',
        's3': 'mock' if s3_service.use_mock else 'connected',
        'environment': os.getenv('FLASK_ENV', 'development')
    })

@app.route('/api/submissions/<user_id>', methods=['GET'])
def get_submissions(user_id):
    try:
        submissions = db_service.get_user_submissions(user_id)
        result = []
        
        for sub in submissions:
            # Get code content
            if sub.get('s3_key'):
                code = s3_service.get_code_file(sub['s3_key'])
            else:
                code = sub.get('code', '')
            
            # Get analysis
            analysis = db_service.get_analysis(sub['_id'])
            
            result.append({
                'id': str(sub['_id']),
                'code': code[:500] + '...' if len(code) > 500 else code,
                'language': sub['language'],
                'submitted_at': sub['submitted_at'].isoformat(),
                's3_key': sub.get('s3_key'),
                'analysis': analysis if analysis else None
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submission/<submission_id>/code', methods=['GET'])
def get_submission_code(submission_id):
    """Get full code for a submission"""
    try:
        submission = db_service.code_submissions.find_one({'_id': int(submission_id)})
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404
        
        if submission.get('s3_key'):
            code = s3_service.get_code_file(submission['s3_key'])
        else:
            code = submission.get('code', '')
        
        return jsonify({'code': code, 'language': submission['language']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n[INFO] System Status:")
    print(f"   Database: {'MongoDB' if db_service.db else 'Mock (In-Memory)'}")
    print(f"   Storage: {'Mock S3 (Local Files)' if s3_service.use_mock else 'AWS S3'}")
    print(f"   Environment: {os.getenv('FLASK_ENV', 'development')}")
    print("\n[INFO] Server running on: http://localhost:5001")
    print("=" * 50 + "\n")
    
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
