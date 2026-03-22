# DSA Analyzer Backend

Deterministic DSA judge backend for C, C++, Python, Java, and JavaScript.

## Current Behavior (Important)

- Frontend is typically served at `http://localhost:3000` (for example with `python -m http.server 3000` from `frontend`).
- Backend runs on `http://localhost:5000`.
- API base URL is `http://localhost:5000/api`.
- Judge mode is deterministic by default (`ENABLE_AI=False`, `JUDGE_MODE=test`).
- No Gemini/OpenAI keys are required for normal judge flow.

## What Works Without Any LLM

These endpoints work fully without AI keys:

- `GET /api/health`
- `GET /api/status`
- `GET /api/problems`
- `GET /api/problem/<id>`
- `GET /api/problems/<id>/template?language=python|c|cpp|java|javascript`
- `POST /api/run`
- `POST /api/run-async`
- `GET /api/jobs/<job_id>`
- `POST /api/test`
- `POST /api/submit`

When AI is disabled, analysis-related endpoints still respond using deterministic fallback logic:

- `POST /api/analyze`
- `POST /api/validate-semantic`
- `POST /api/optimize`
- `POST /api/generate-hidden-tests`

## Run Locally

### 1. Backend

```powershell
cd C:\Bimal\Project\dsaanalyzer\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Backend should be available at:

- `http://localhost:5000/api/health`

### Production-style backend run (Gunicorn)

```powershell
cd C:\Bimal\Project\dsaanalyzer\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
gunicorn -c gunicorn.conf.py wsgi:app
```

If `gunicorn` command is not found:

```powershell
python -m gunicorn -c gunicorn.conf.py wsgi:app
```

### Docker run

```powershell
cd C:\Bimal\Project\dsaanalyzer\backend
docker build -t dsaanalyzer-backend .
docker run --rm -p 5000:5000 --env-file .env dsaanalyzer-backend
```

### 2. Frontend (static)

```powershell
cd C:\Bimal\Project\dsaanalyzer\frontend
python -m http.server 3000
```

Open:

- `http://localhost:3000`

## Configuration (`.env`)

Recommended deterministic setup:

```env
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000

CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5500,null

ENABLE_AI=False
JUDGE_MODE=test

MAX_EXECUTION_TIME=10
MAX_MEMORY_MB=512
ENABLE_C_SUPPORT=True
ENABLE_PYTHON_SUPPORT=True
```

With this setup, you can remove OpenAI/Gemini keys and the judge still works.

For production settings, copy `.env.example` to `.env` and tune Gunicorn and queue variables.

## Async Queue Usage

Submit job:

```http
POST /api/run-async
Content-Type: application/json

{
  "problem_id": "1",
  "language": "python",
  "code": "def two_sum(nums, target): return [0,1]"
}
```

Poll status:

```http
GET /api/jobs/<job_id>
```

States: `queued`, `running`, `completed`, `failed`.

## Judge Notes

- Test cases are stored on backend in `problems/database.py`.
- Execution and verdict happen server-side.
- Frontend only sends code/problem/language and renders returned results.
- Function name matching supports common variants (for example `two_sum`, `twoSum`, `TwoSum`).

## Quick Troubleshooting

### `Failed to fetch` in frontend

Check backend first:

```powershell
Invoke-WebRequest http://localhost:5000/api/health -UseBasicParsing
```

If this fails, backend is not running or wrong port is configured.

### CORS errors

Ensure the frontend origin is included in `CORS_ORIGINS`.

### Port mismatch

- Frontend API should target `http://localhost:5000/api`
- Backend `PORT` should be `5000`
