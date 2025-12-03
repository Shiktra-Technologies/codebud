from flask import Flask, request, jsonify
from flask_cors import CORS
from dsa_analyzer import analyze_code, get_problem, get_all_problems
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000",  # Development
    "https://your-netlify-app.netlify.app",  # Production - UPDATE THIS
    "https://*.netlify.app"  # All Netlify domains
])

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'CodeBud DSA Server is running'}), 200

@app.route('/api/problems', methods=['GET'])
def get_problems():
    """Get all available DSA problems"""
    try:
        problems = get_all_problems()
        # Transform for frontend consumption
        problem_list = []
        for pid, problem in problems.items():
            problem_list.append({
                'id': pid,
                'title': problem['title'],
                'description': problem['description'],
                'function_name': problem['function_name'],
                'test_count': len(problem['test_cases'])
            })
        
        return jsonify({
            'success': True,
            'problems': problem_list
        }), 200
    except Exception as e:
        logger.error(f"Error fetching problems: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/problem/<problem_id>', methods=['GET'])
def get_problem_details(problem_id):
    """Get specific problem details"""
    try:
        problem = get_problem(problem_id)
        if not problem:
            return jsonify({
                'success': False, 
                'error': f'Problem {problem_id} not found'
            }), 404
        
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
        logger.error(f"Error fetching problem {problem_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/run', methods=['POST'])
def run_code():
    """Execute DSA code submission"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        problem_id = data.get('problem_id')
        code = data.get('code')
        language = data.get('language', 'python')
        
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
        
        logger.info(f"Running code for problem {problem_id} in language {language}")
        
        # Execute the analysis
        result = analyze_code(problem_id, code, language)
        
        # Add success flag for consistency
        result['success'] = True
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error running code: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/submit', methods=['POST'])
def submit_code():
    """Submit DSA code for evaluation (alias for /api/run)"""
    return run_code()

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    import os
    
    # Railway provides PORT environment variable
    port = int(os.environ.get('PORT', 5001))
    
    # Disable debug mode for production (Railway)
    debug = os.environ.get('RAILWAY_ENVIRONMENT') != 'production'
    
    logger.info("Starting CodeBud DSA Server...")
    logger.info(f"Environment: {os.environ.get('RAILWAY_ENVIRONMENT', 'local')}")
    logger.info(f"Port: {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info("CORS enabled for development and production domains")
    
    # Explicitly bind to all interfaces for Railway
    app.run(debug=debug, port=port, host='0.0.0.0', threaded=True)
