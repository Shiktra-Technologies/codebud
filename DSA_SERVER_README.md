# CodeBud DSA Server Integration

This document explains how to set up and use the DSA (Data Structures & Algorithms) code execution server with your React webapp.

## 🏗️ Architecture

```
React Frontend (Port 3000)
    ↕️ HTTP API
Python Flask Server (Port 5001)
    ↕️ Code Execution
DSA Analyzer Engine
```

## 📦 What's Included

### Server Components
- **`server/dsa_analyzer.py`** - Core DSA analysis engine with 5 built-in problems
- **`server/server.py`** - Flask REST API server
- **`server/requirements.txt`** - Python dependencies

### Frontend Integration
- **`src/services/dsaService.js`** - React service for API communication
- **`src/components/DSATest.js`** - Test component to verify integration
- **`src/components/DSATest.css`** - Styling for test component

### Setup Scripts
- **`setup-dsa-server.sh`** - One-time setup script
- **`start-dsa-server.sh`** - Server startup script

## 🚀 Quick Start

### 1. Initial Setup (Run Once)
```bash
# In your project root directory
./setup-dsa-server.sh
```

This will:
- Create a Python virtual environment
- Install all required dependencies (Flask, Flask-CORS, psutil, pytest)

### 2. Start the DSA Server
```bash
# In your project root directory
./start-dsa-server.sh
```

The server will start on `http://localhost:5001`

### 3. Test Integration
1. Start your React app: `npm start`
2. Navigate to the DSATest component
3. You should see "🟢 Server Online" status
4. Try executing some sample code!

## 🧪 Built-in Problems

The server comes with 5 DSA problems ready to use:

1. **Two Sum** (`problem_id: "1"`)
2. **Valid Parentheses** (`problem_id: "2"`)
3. **Reverse Linked List** (`problem_id: "3"`)
4. **Binary Search** (`problem_id: "4"`)
5. **Maximum Subarray** (`problem_id: "5"`)

## 🔌 API Endpoints

### Health Check
```http
GET /api/health
```
Returns server health status.

### Get All Problems
```http
GET /api/problems
```
Returns list of available problems.

### Get Specific Problem
```http
GET /api/problem/{problem_id}
```
Returns details for a specific problem.

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

### Response Format
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

## 🛠️ Using in Your Components

### Import the Service
```javascript
import dsaService from '../services/dsaService';
```

### Execute Code
```javascript
const executeCode = async () => {
  try {
    const result = await dsaService.executeCode("1", userCode, "python");
    const formatted = dsaService.formatResult(result);
    console.log(formatted);
  } catch (error) {
    console.error('Execution failed:', error.message);
  }
};
```

### Get Problems
```javascript
const loadProblems = async () => {
  try {
    const problems = await dsaService.getProblems();
    setProblems(problems);
  } catch (error) {
    console.error('Failed to load problems:', error.message);
  }
};
```

### Check Server Health
```javascript
const checkServer = async () => {
  const isHealthy = await dsaService.checkHealth();
  setServerStatus(isHealthy);
};
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in your React app root:

```env
REACT_APP_DSA_SERVER_URL=http://localhost:5001/api
```

### Server Configuration
Edit `server/server.py` to modify:
- Port number (default: 5001)
- CORS origins
- Timeout settings
- Memory limits

## 🎯 Integration with ProblemSolver Component

To integrate with your existing `ProblemSolver` component:

1. Import the DSA service
2. Replace mock execution with real server calls
3. Handle different result formats
4. Add server health checking

Example integration:
```javascript
// In ProblemSolver.js
import dsaService from '../services/dsaService';

const handleRunCode = async () => {
  setLoading(true);
  try {
    const result = await dsaService.executeCode(problemId, code);
    const formatted = dsaService.formatResult(result);
    setResults(formatted);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

## 📊 Adding New Problems

Edit `server/dsa_analyzer.py` and add to the `problems` dictionary:

```python
problems = {
    # ... existing problems
    "6": {
        "title": "Your New Problem",
        "function_name": "your_function",
        "description": "Problem description here",
        "test_cases": [
            {"input": (param1, param2), "expected": expected_result},
            # ... more test cases
        ],
    }
}
```

## 🔒 Security Features

The analyzer includes security checks to prevent:
- Dangerous imports (`os`, `sys`, `subprocess`, etc.)
- Restricted keywords (`__builtins__`, `eval`, etc.)
- File system access
- Network operations
- Infinite loops (timeout protection)
- Memory bombs (memory limit protection)

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if virtual environment exists
ls server/venv/

# If not, run setup again
./setup-dsa-server.sh
```

### Connection Errors
- Ensure server is running on port 5001
- Check CORS configuration in `server.py`
- Verify React app is on port 3000

### Execution Timeouts
- Default timeout is 5 seconds per test case
- Modify `timeout` parameter in `DSAAnalyzer` constructor

### Memory Issues
- Default memory limit is 256MB
- Modify `memory_limit` parameter in `DSAAnalyzer` constructor

## 📈 Performance Notes

- Each code execution runs in a separate thread with timeout protection
- Memory usage is monitored using `psutil`
- Server handles concurrent requests
- Results include detailed execution metrics

## 🔄 Development Workflow

1. **Development**: Use `DSATest` component for testing
2. **Integration**: Replace mock data with real API calls
3. **Production**: Deploy server separately from React app
4. **Monitoring**: Check server health before code execution

## 🚢 Production Deployment

For production deployment:

1. **Server**: Deploy Flask server with proper WSGI server (gunicorn)
2. **Security**: Add proper authentication/authorization
3. **Rate Limiting**: Implement request rate limiting
4. **Monitoring**: Add logging and error tracking
5. **Scaling**: Consider containerization with Docker

Example production startup:
```bash
# Install gunicorn
pip install gunicorn

# Start with gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 server:app
```

---

## ✅ You're Ready!

Your DSA server is now integrated with your React webapp. Users can:
- ✅ Write Python code solutions
- ✅ Execute against multiple test cases
- ✅ Get detailed feedback and performance metrics
- ✅ See real-time results with proper error handling

Happy coding! 🎉
