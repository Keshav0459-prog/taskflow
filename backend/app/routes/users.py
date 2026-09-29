"""
Team user directory routes.
"""
import time
from flask import Blueprint, jsonify
from app.middleware.auth import require_auth, get_supabase_client

users_bp = Blueprint("users", __name__)

_users_cache: tuple[float, list] | None = None


@users_bp.route("/users", methods=["GET"])
@require_auth
def list_users():
    """Return all registered user profiles with 60-second in-memory caching."""
    global _users_cache
    now = time.time()
    if _users_cache and _users_cache[0] > now:
        return jsonify(_users_cache[1]), 200

    db = get_supabase_client()
    result = (
        db.table("profiles")
        .select("id, name, email, avatar_url")
        .order("name")
        .execute()
    )
    _users_cache = (now + 10.0, result.data)
    return jsonify(result.data), 200
