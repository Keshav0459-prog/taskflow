"""
User profile and authentication routes.
"""
from flask import Blueprint, jsonify, g

import time
from app.middleware.auth import require_auth, get_supabase_client

auth_bp = Blueprint("auth", __name__)

# In-memory cache: user_id -> (expiry_time, profile_dict)
_profile_cache: dict[str, tuple[float, dict]] = {}
_supabase = get_supabase_client


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    """
    Return the current user's profile with high-speed in-memory caching.
    Only queries/upserts Supabase if profile is not cached.
    """
    user_id = g.user_id
    now = time.time()

    # Fast cache hit (<0.1ms)
    cached = _profile_cache.get(user_id)
    if cached and cached[0] > now:
        return jsonify(cached[1]), 200

    db = _supabase()

    # Try fetching existing profile from database first (1 fast read)
    existing = db.table("profiles").select("*").eq("id", user_id).execute()
    if existing.data and len(existing.data) > 0:
        profile = existing.data[0]
        _profile_cache[user_id] = (now + 15.0, profile)
        return jsonify(profile), 200

    # If first login ever, fetch from auth admin and upsert
    auth_user = db.auth.admin.get_user_by_id(user_id).user
    profile_data = {
        "id": user_id,
        "email": auth_user.email,
        "name": (
            auth_user.user_metadata.get("full_name")
            or auth_user.user_metadata.get("name")
            or auth_user.email.split("@")[0]
        ),
        "avatar_url": auth_user.user_metadata.get("avatar_url") or auth_user.user_metadata.get("picture"),
    }

    result = (
        db.table("profiles")
        .upsert(profile_data, on_conflict="id")
        .execute()
    )

    profile = result.data[0]
    _profile_cache[user_id] = (now + 15.0, profile)
    return jsonify(profile), 200
