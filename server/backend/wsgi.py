"""
WSGI entrypoint for production servers (Gunicorn/uWSGI).
"""

from app import app


if __name__ == "__main__":
    app.run()

