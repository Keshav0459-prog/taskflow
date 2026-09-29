"""
Unit tests for the @require_auth decorator.
"""
import pytest
from unittest.mock import patch, MagicMock

from app import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def reset_caches():
    from app.middleware.auth import _token_cache
    _token_cache.clear()
    yield
    _token_cache.clear()


def test_missing_auth_header_returns_401(client):
    """No Authorization header → 401."""
    response = client.get("/api/me")
    assert response.status_code == 401
    data = response.get_json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_malformed_auth_header_returns_401(client):
    """Authorization header without 'Bearer ' prefix → 401."""
    response = client.get("/api/me", headers={"Authorization": "Token abc123"})
    assert response.status_code == 401
    data = response.get_json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_invalid_token_returns_401(client):
    """Invalid JWT → Supabase raises exception → 401."""
    with patch("app.middleware.auth._get_supabase_client") as mock_client:
        mock_supabase = MagicMock()
        mock_supabase.auth.get_user.side_effect = Exception("invalid JWT")
        mock_client.return_value = mock_supabase

        response = client.get("/api/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert response.status_code == 401


def test_valid_token_passes_through(client):
    """Valid token → user is stored in g → route executes."""
    with patch("app.middleware.auth._get_supabase_client") as mock_auth_client, \
         patch("app.routes.auth._supabase") as mock_route_client:

        # Mock auth verification
        mock_user = MagicMock()
        mock_user.id = "user-uuid-123"
        mock_user.email = "test@example.com"
        mock_supabase = MagicMock()
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
        mock_auth_client.return_value = mock_supabase

        # Mock DB call in auth route
        mock_auth_user = MagicMock()
        mock_auth_user.email = "test@example.com"
        mock_auth_user.user_metadata = {"full_name": "Test User", "avatar_url": ""}
        mock_db = MagicMock()
        mock_db.auth.admin.get_user_by_id.return_value = MagicMock(user=mock_auth_user)
        mock_db.table.return_value.upsert.return_value.execute.return_value = MagicMock(
            data=[{"id": "user-uuid-123", "email": "test@example.com", "name": "Test User"}]
        )
        mock_route_client.return_value = mock_db

        response = client.get("/api/me", headers={"Authorization": "Bearer valid.token.here"})
        assert response.status_code == 200
