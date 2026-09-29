from flask import Flask
from flask_cors import CORS

from app.config import Config


def create_app() -> Flask:
    """Initialize and configure the Flask application instance."""
    app = Flask(__name__)

    # Configure CORS for authorized frontend origins with preflight caching
    CORS(
        app,
        resources={r"/api/*": {"origins": Config.FRONTEND_URL}},
        supports_credentials=True,
        max_age=86400,
    )

    # Register route blueprints — each file owns a specific domain
    from app.routes.auth import auth_bp
    from app.routes.tasks import tasks_bp
    from app.routes.users import users_bp

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(tasks_bp, url_prefix="/api")
    app.register_blueprint(users_bp, url_prefix="/api")

    # Health check endpoints for deployment (Railway / Render / Docker)
    @app.route("/health", methods=["GET"])
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return {"status": "ok"}, 200

    # Register global error handlers
    from app.utils.errors import register_error_handlers
    register_error_handlers(app)

    return app
