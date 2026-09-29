"""
API error helpers and status code constants.
"""
from flask import Flask, jsonify
from typing import Tuple


UNAUTHORIZED = "UNAUTHORIZED"
FORBIDDEN = "FORBIDDEN"
VALIDATION_ERROR = "VALIDATION_ERROR"
TASK_NOT_FOUND = "TASK_NOT_FOUND"
USER_NOT_FOUND = "USER_NOT_FOUND"
EMAIL_SEND_FAILED = "EMAIL_SEND_FAILED"
INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"


def error_response(code: str, message: str, status: int) -> Tuple:
    """Build a consistent error JSON response."""
    return jsonify({"error": {"code": code, "message": message}}), status


def register_error_handlers(app: Flask) -> None:
    """
    Register Flask global error handlers.
    These catch unhandled exceptions so they don't return HTML error pages.
    """

    @app.errorhandler(404)
    def not_found(e):
        return error_response("NOT_FOUND", "The requested resource was not found.", 404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response("METHOD_NOT_ALLOWED", "Method not allowed.", 405)

    @app.errorhandler(500)
    def internal_error(e):
        # Don't leak raw exception traces to the client
        return error_response(
            INTERNAL_SERVER_ERROR,
            "An unexpected error occurred. Please try again.",
            500,
        )
