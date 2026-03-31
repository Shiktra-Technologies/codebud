"""
Gunicorn configuration for production runtime.
"""

import os


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


bind = f"0.0.0.0:{_int('PORT', 5001)}"
workers = _int("GUNICORN_WORKERS", 2)
threads = _int("GUNICORN_THREADS", 2)
worker_class = os.getenv("GUNICORN_WORKER_CLASS", "gthread")
timeout = _int("GUNICORN_TIMEOUT", 60)
graceful_timeout = _int("GUNICORN_GRACEFUL_TIMEOUT", 30)
keepalive = _int("GUNICORN_KEEPALIVE", 5)
max_requests = _int("GUNICORN_MAX_REQUESTS", 1000)
max_requests_jitter = _int("GUNICORN_MAX_REQUESTS_JITTER", 100)
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")

