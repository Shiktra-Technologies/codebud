# CodeBud DSA Server

A Python Flask server for executing and analyzing Data Structures & Algorithms code submissions.

## 🚀 Quick Start

### Local Development
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
python server.py
```

Server runs on `http://localhost:5001`

## 📊 Built-in Problems

- **Two Sum** (ID: 1)
- **Valid Parentheses** (ID: 2) 
- **Reverse Linked List** (ID: 3)
- **Binary Search** (ID: 4)
- **Maximum Subarray** (ID: 5)

## 🔌 API Endpoints

### Health Check
```http
GET /api/health
```

### Get All Problems  
```http
GET /api/problems
```

### Execute Code
```http
POST /api/run
Content-Type: application/json

{
  "problem_id": "1",
  "code": "def two_sum(nums, target): return [0, 1]",
  "language": "python"
}
```

## 🚢 Deployment

### Railway (Recommended)
1. Fork/clone this repo
2. Connect to [Railway](https://railway.app)  
3. Deploy - auto-detects Python!

### Render
1. Connect repo to [Render](https://render.com)
2. Use the included `render.yaml` config

### Manual
```bash
# Production with Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:$PORT server:app
```

## 🔧 Environment Variables

```env
PORT=5001                    # Server port
FLASK_ENV=production        # Production mode
PYTHONPATH=/app            # Python path
```

## 🛡️ Security Features

- Syntax validation
- Import restrictions  
- Timeout protection (5s per test)
- Memory monitoring
- Sandboxed execution

## 🎯 Frontend Integration

Your React app should connect to:
```javascript
const API_URL = 'https://your-server.railway.app/api';
```

## 📈 Response Format

```json
{
  "status": "Accepted",
  "is_accepted": true,
  "total_tests": 5,
  "passed": 5,
  "failed": 0,
  "errors": 0,
  "total_execution_time_ms": 1.23,
  "max_memory_used_mb": 0.05,
  "final_output": [0, 1],
  "final_stdout": "",
  "message": "Accepted! All test cases passed ✓",
  "results": [...]
}
```

## 🔄 Adding New Problems

Edit the `problems` dictionary in `dsa_analyzer.py`:

```python
problems = {
    "6": {
        "title": "Your Problem",
        "function_name": "your_function", 
        "description": "Problem description",
        "test_cases": [
            {"input": (param1, param2), "expected": result},
        ]
    }
}
```

## 🐛 Development

```bash
# Run tests
python -m pytest

# Check code style
flake8 *.py

# Format code  
black *.py
```

## 📝 License

MIT License - Feel free to use in your projects!

---

Built with ❤️ for CodeBud Platform
