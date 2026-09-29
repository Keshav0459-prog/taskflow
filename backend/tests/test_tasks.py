"""
Tests for task creation, validation, and authorization.
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


def _auth_headers(token="valid.token"):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _mock_auth(mock_client, user_id="creator-uuid"):
    """Helper: make @require_auth succeed with a given user_id."""
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_user.email = f"{user_id}@test.com"
    mock_supabase = MagicMock()
    mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
    mock_client.return_value = mock_supabase


def test_create_task_missing_title_returns_400(client):
    with patch("app.middleware.auth._get_supabase_client") as mock_auth:
        _mock_auth(mock_auth)
        response = client.post(
            "/api/tasks",
            json={"description": "no title", "assigned_to": "user-uuid", "priority": "high"},
            headers=_auth_headers(),
        )
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_create_task_invalid_priority_returns_400(client):
    with patch("app.middleware.auth._get_supabase_client") as mock_auth:
        _mock_auth(mock_auth)
        response = client.post(
            "/api/tasks",
            json={"title": "Test", "assigned_to": "user-uuid", "priority": "urgent"},
            headers=_auth_headers(),
        )
    assert response.status_code == 400


def test_create_task_assignee_not_found_returns_404(client):
    with patch("app.middleware.auth._get_supabase_client") as mock_auth, \
         patch("app.routes.tasks._db") as mock_db, \
         patch("app.services.task_service._db") as mock_svc_db:

        _mock_auth(mock_auth)

        # assignee lookup returns empty
        mock_svc_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        response = client.post(
            "/api/tasks",
            json={"title": "Test Task", "assigned_to": "nonexistent-uuid", "priority": "medium"},
            headers=_auth_headers(),
        )
    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "USER_NOT_FOUND"


def test_delete_task_by_non_creator_returns_403(client):
    with patch("app.middleware.auth._get_supabase_client") as mock_auth, \
         patch("app.services.task_service._db") as mock_svc_db:

        _mock_auth(mock_auth, user_id="other-user-uuid")

        # Task exists but created_by is different user
        mock_svc_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{
                "id": "task-uuid",
                "created_by": "creator-uuid",  # NOT other-user-uuid
                "assigned_to": "other-user-uuid",
                "status": "todo",
            }]
        )

        response = client.delete("/api/tasks/task-uuid", headers=_auth_headers())

    assert response.status_code == 403
    assert response.get_json()["error"]["code"] == "FORBIDDEN"


def test_get_task_not_found_returns_404(client):
    with patch("app.middleware.auth._get_supabase_client") as mock_auth, \
         patch("app.services.task_service._db") as mock_svc_db:

        _mock_auth(mock_auth, user_id="creator-uuid")
        mock_svc_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        response = client.get("/api/tasks/nonexistent-id", headers=_auth_headers())

    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "TASK_NOT_FOUND"


def test_unauthorized_update_returns_403(client):
    with patch("app.middleware.auth._get_supabase_client") as mock_auth, \
         patch("app.services.task_service._db") as mock_svc_db:

        _mock_auth(mock_auth, user_id="random-user")

        # Task exists but neither created_by nor assigned_to is random-user
        mock_svc_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{
                "id": "task-uuid",
                "created_by": "creator-uuid",
                "assigned_to": "assignee-uuid",
                "status": "todo",
            }]
        )

        response = client.patch(
            "/api/tasks/task-uuid",
            json={"title": "Hacked Title"},
            headers=_auth_headers(),
        )

    assert response.status_code == 403
    assert response.get_json()["error"]["code"] == "FORBIDDEN"


def test_assignee_can_update_status_to_in_progress(client):
    with patch("app.middleware.auth._get_supabase_client") as mock_auth, \
         patch("app.services.task_service._db") as mock_svc_db:

        _mock_auth(mock_auth, user_id="assignee-uuid")

        # Mock get_task_by_id finding the task where user is assignee
        mock_svc_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{
                "id": "task-uuid",
                "title": "Build Feature",
                "created_by": "creator-uuid",
                "assigned_to": "assignee-uuid",
                "status": "todo",
            }]
        )
        mock_svc_db.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{
                "id": "task-uuid",
                "title": "Build Feature",
                "created_by": "creator-uuid",
                "assigned_to": "assignee-uuid",
                "status": "in_progress",
            }]
        )

        response = client.patch(
            "/api/tasks/task-uuid",
            json={"status": "in_progress"},
            headers=_auth_headers(),
        )

    assert response.status_code == 200
    assert response.get_json()["status"] == "in_progress"


def test_complete_task_succeeds(client):
    with patch("app.middleware.auth._get_supabase_client") as mock_auth, \
         patch("app.routes.tasks._db") as mock_route_db, \
         patch("app.services.task_service._db") as mock_svc_db, \
         patch("app.services.notification_service.notify_task_completed") as mock_notify:

        _mock_auth(mock_auth, user_id="assignee-uuid")

        mock_svc_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{
                "id": "task-uuid",
                "title": "Build Feature",
                "created_by": "creator-uuid",
                "assigned_to": "assignee-uuid",
                "status": "in_progress",
            }]
        )
        mock_svc_db.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{
                "id": "task-uuid",
                "title": "Build Feature",
                "created_by": "creator-uuid",
                "assigned_to": "assignee-uuid",
                "status": "completed",
                "completed_at": "2026-09-29T12:00:00Z",
            }]
        )
        mock_route_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": "creator-uuid", "name": "Creator", "email": "creator@test.com"}]
        )

        response = client.patch("/api/tasks/task-uuid/complete", headers=_auth_headers())

    assert response.status_code == 200
    assert response.get_json()["status"] == "completed"


def test_create_task_gmail_failure_does_not_rollback_task(client):
    with patch("app.middleware.auth._get_supabase_client") as mock_auth, \
         patch("app.routes.tasks._db") as mock_route_db, \
         patch("app.services.task_service._db") as mock_svc_db, \
         patch("app.services.notification_service._db") as mock_notif_db, \
         patch("app.services.notification_service.send_email", side_effect=Exception("Gmail timeout")):

        _mock_auth(mock_auth, user_id="creator-uuid")

        # Assignee exists
        mock_svc_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": "assignee-uuid"}]
        )
        # Task insert succeeds
        mock_svc_db.return_value.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{
                "id": "new-task-uuid",
                "title": "Task With Email Failure",
                "status": "todo",
                "priority": "high",
                "created_by": "creator-uuid",
                "assigned_to": "assignee-uuid",
            }]
        )
        # Profile lookup for email notification
        mock_route_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[{"id": "assignee-uuid", "name": "Assignee", "email": "assignee@test.com"}]
        )
        # Notification check & insert succeeds
        mock_notif_db.return_value.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[]
        )
        mock_notif_db.return_value.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{}])

        response = client.post(
            "/api/tasks",
            json={"title": "Task With Email Failure", "assigned_to": "assignee-uuid", "priority": "high"},
            headers=_auth_headers(),
        )

    # Email failed, but task creation STILL succeeded!
    assert response.status_code == 201
    assert response.get_json()["id"] == "new-task-uuid"

