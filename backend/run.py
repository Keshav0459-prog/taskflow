"""
Flask application runner for local development and WSGI entry point.
"""
from app import create_app
from app.config import Config

app = create_app()

if __name__ == "__main__":
    Config.validate()  # Fail fast on startup if env vars are missing
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=5000)
