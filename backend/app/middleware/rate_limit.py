"""
In-memory sliding window rate limiter middleware for Flask API endpoints.
Provides IP-based throttling and protection against brute-force attacks.
"""
import time
from collections import defaultdict
from typing import Callable, Any
from flask import request, jsonify, g
import functools

# IP -> list of request timestamps
_request_log: dict[str, list[float]] = defaultdict(list)
_LAST_CLEANUP = time.time()


def _get_client_ip() -> str:
    """Extract real client IP considering reverse proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # First IP in list is original client
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def rate_limit(max_requests: int = 60, window_seconds: int = 60) -> Callable:
    """
    Decorator to rate limit an endpoint.
    Default: 60 requests per 60 seconds per IP.
    """
    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            global _LAST_CLEANUP
            now = time.time()

            # Periodic cleanup of stale IPs every 5 minutes
            if now - _LAST_CLEANUP > 300:
                _LAST_CLEANUP = now
                stale_threshold = now - 600
                stale_keys = [k for k, v in _request_log.items() if not v or v[-1] < stale_threshold]
                for k in stale_keys:
                    _request_log.pop(k, None)

            ip = _get_client_ip()
            key = f"{ip}:{request.endpoint or f.__name__}"
            timestamps = _request_log[key]

            # Filter out timestamps outside current sliding window
            cutoff = now - window_seconds
            timestamps = [t for t in timestamps if t > cutoff]
            _request_log[key] = timestamps

            if len(timestamps) >= max_requests:
                oldest = timestamps[0]
                retry_after = max(1, int(oldest + window_seconds - now))
                response = jsonify({
                    "error": {
                        "code": "RATE_LIMITED",
                        "message": f"Too many requests. Please wait {retry_after} seconds before trying again.",
                    }
                })
                response.status_code = 429
                response.headers["Retry-After"] = str(retry_after)
                return response

            timestamps.append(now)
            return f(*args, **kwargs)

        return wrapped
    return decorator
