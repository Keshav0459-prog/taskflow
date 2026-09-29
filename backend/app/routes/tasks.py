"""
Task management endpoints for creating, retrieving, updating, and deleting tasks.
"""
from flask import Blueprint, jsonify, request, g
from pydantic import ValidationError

from app.middleware.auth import require_auth, get_supabase_client
from app.services import task_service, notification_service
from app.services.task_service import TaskNotFoundError, ForbiddenError, UserNotFoundError
from app.utils.validation import CreateTaskSchema, UpdateTaskSchema
from app.utils.errors import error_response, TASK_NOT_FOUND, FORBIDDEN, USER_NOT_FOUND, VALIDATION_ERROR

tasks_bp = Blueprint("tasks", __name__)


def _db():
    return get_supabase_client()


def _get_profile(user_id: str) -> dict:
    """Fetch a single profile by ID (used for email notifications)."""
    result = _db().table("profiles").select("id, name, email").eq("id", user_id).execute()
    return result.data[0] if result.data else {}


@tasks_bp.route("/tasks", methods=["GET"])
@require_auth
def list_tasks():
    """Return all tasks where current user is creator or assignee."""
    tasks = task_service.get_tasks_for_user(g.user_id)
    return jsonify(tasks), 200


@tasks_bp.route("/tasks/<task_id>", methods=["GET"])
@require_auth
def get_task(task_id: str):
    """Return a single task by ID."""
    try:
        task = task_service.get_task_by_id(task_id, g.user_id)
        return jsonify(task), 200
    except TaskNotFoundError:
        return error_response(TASK_NOT_FOUND, "Task not found.", 404)
    except ForbiddenError:
        return error_response(FORBIDDEN, "You do not have access to this task.", 403)


@tasks_bp.route("/tasks", methods=["POST"])
@require_auth
def create_task():
    """
    Create a new task and trigger a TASK_CREATED email notification.
    Email failure does NOT block task creation.
    """
    try:
        payload = CreateTaskSchema(**request.get_json(force=True))
    except ValidationError as exc:
        messages = [e["msg"] for e in exc.errors()]
        return error_response(VALIDATION_ERROR, "; ".join(messages), 400)

    try:
        task = task_service.create_task(payload.model_dump(), created_by=g.user_id)
    except UserNotFoundError:
        return error_response(USER_NOT_FOUND, "Assigned user does not exist.", 404)

    # Notify the assigned member
    assignee = _get_profile(task["assigned_to"])
    if assignee:
        notification_service.notify_task_created(task, assignee)

    return jsonify(task), 201


@tasks_bp.route("/tasks/<task_id>", methods=["PATCH"])
@require_auth
def update_task(task_id: str):
    """Update task fields. Creator can update all fields, assignee can update status."""
    try:
        payload = UpdateTaskSchema(**request.get_json(force=True))
    except ValidationError as exc:
        messages = [e["msg"] for e in exc.errors()]
        return error_response(VALIDATION_ERROR, "; ".join(messages), 400)

    try:
        # Check existing state to know if it transitioned to completed
        existing = task_service.get_task_by_id(task_id, g.user_id)
        was_completed = existing.get("status") == "completed"

        task = task_service.update_task(task_id, payload.model_dump(exclude_none=True), g.user_id)

        # Notify creator if task just transitioned to completed
        if task.get("status") == "completed" and not was_completed:
            creator = _get_profile(task["created_by"])
            completer = _get_profile(g.user_id)
            if creator and completer:
                notification_service.notify_task_completed(task, completed_by=completer, recipient=creator)

        return jsonify(task), 200
    except TaskNotFoundError:
        return error_response(TASK_NOT_FOUND, "Task not found.", 404)
    except ForbiddenError as exc:
        return error_response(FORBIDDEN, str(exc), 403)
    except UserNotFoundError:
        return error_response(USER_NOT_FOUND, "Assigned user does not exist.", 404)


@tasks_bp.route("/tasks/<task_id>/complete", methods=["PATCH"])
@require_auth
def complete_task(task_id: str):
    """
    Mark a task as completed.
    Triggers a TASK_COMPLETED notification to the task creator.
    """
    try:
        task = task_service.complete_task(task_id, g.user_id)
    except TaskNotFoundError:
        return error_response(TASK_NOT_FOUND, "Task not found.", 404)
    except ForbiddenError as exc:
        return error_response(FORBIDDEN, str(exc), 403)

    # Notify the task creator (if they're not the one completing it)
    creator = _get_profile(task["created_by"])
    completer = _get_profile(g.user_id)
    if creator and completer:
        notification_service.notify_task_completed(task, completed_by=completer, recipient=creator)

    return jsonify(task), 200


@tasks_bp.route("/tasks/<task_id>", methods=["DELETE"])
@require_auth
def delete_task(task_id: str):
    """Delete a task. Only the creator can delete."""
    try:
        task_service.delete_task(task_id, g.user_id)
        return jsonify({"message": "Task deleted successfully."}), 200
    except TaskNotFoundError:
        return error_response(TASK_NOT_FOUND, "Task not found.", 404)
    except ForbiddenError as exc:
        return error_response(FORBIDDEN, str(exc), 403)


@tasks_bp.route("/notifications", methods=["GET"])
@require_auth
def list_notifications():
    """Return notification logs for tasks the current user created."""
    db = _db()
    result = (
        db.table("notification_logs")
        .select("*, task:tasks(id, title, created_by)")
        .execute()
    )
    # Only return logs for tasks this user created
    user_logs = [
        log for log in result.data
        if log.get("task") and log["task"]["created_by"] == g.user_id
    ]
    return jsonify(user_logs), 200
