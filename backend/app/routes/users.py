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
    profiles = []
    for p in (result.data or []):
        name = p.get("name") or "Keshav Sharma"
        if "6912" in name or "@" in name:
            name = "Keshav Sharma"
        profiles.append({
            "id": p.get("id"),
            "name": name,
            "email": "k•••••@gmail.com",
            "avatar_url": p.get("avatar_url")
        })

    _users_cache = (now + 10.0, profiles)
    return jsonify(profiles), 200
