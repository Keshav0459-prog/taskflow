"""
Authentication middleware and JWT token verification.
"""
import functools
from typing import Callable, Any

from flask import request, g, jsonify

from app.config import Config
from supabase import create_client, Client


import time

_supabase_client: Client | None = None
# Cache verified tokens: token -> (expiry_timestamp, user_id, user_email)
_token_cache: dict[str, tuple[float, str, str]] = {}

def get_supabase_client() -> Client:
    """Return a shared singleton Supabase admin client to reuse HTTP connections."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client


_get_supabase_client = get_supabase_client


def require_auth(f: Callable) -> Callable:
    """
    Decorator that protects a route by requiring a valid Supabase JWT.
    Uses a 60-second in-memory cache to avoid redundant external network verification calls.
    """
    @functools.wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Missing or malformed Authorization header.",
                }
            }), 401

        token = auth_header.split(" ", 1)[1]
        now = time.time()

        # Check in-memory cache first (<0.1ms)
        cached = _token_cache.get(token)
        if cached and cached[0] > now:
            g.user_id = cached[1]
            g.user_email = cached[2]
            return f(*args, **kwargs)

        try:
            supabase: Client = _get_supabase_client()
            # Validate token against Supabase
            response = supabase.auth.get_user(token)
            user = response.user

            if not user:
                raise ValueError("No user returned from Supabase token verification.")

            # Store in cache for 60 seconds
            _token_cache[token] = (now + 60.0, user.id, user.email or "")

            # Evict stale entries if cache grows
            if len(_token_cache) > 200:
                for k, v in list(_token_cache.items()):
                    if v[0] <= now:
                        _token_cache.pop(k, None)

            g.user_id = user.id
            g.user_email = user.email

        except Exception as exc:
            return jsonify({
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Invalid or expired authentication token.",
                }
            }), 401

        return f(*args, **kwargs)

    return decorated
