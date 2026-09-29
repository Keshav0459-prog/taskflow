"""
Task domain logic and persistence service.
"""
from datetime import datetime, timezone
from typing import Optional, Any

from app.middleware.auth import get_supabase_client


def _db():
    return get_supabase_client()


class TaskNotFoundError(Exception):
    pass


class ForbiddenError(Exception):
    pass


class UserNotFoundError(Exception):
    pass


def _verify_user_exists(user_id: str) -> None:
    """Confirm assignee exists in profiles before creating/updating a task."""
    db = _db()
    result = db.table("profiles").select("id").eq("id", user_id).execute()
    if not result.data:
        raise UserNotFoundError(f"User {user_id} not found.")


def get_tasks_for_user(user_id: str) -> list[dict]:
    """
    Return tasks where the current user is either creator or assignee.
    Includes profile data for created_by and assigned_to (joined as nested objects).
    """
    db = _db()
    result = (
        db.table("tasks")
        .select(
            "*, "
            "creator:profiles!tasks_created_by_fkey(id, name, email, avatar_url), "
            "assignee:profiles!tasks_assigned_to_fkey(id, name, email, avatar_url)"
        )
        .or_(f"created_by.eq.{user_id},assigned_to.eq.{user_id}")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_task_by_id(task_id: str, user_id: str) -> dict:
    """
    Return a single task.
    Only accessible if the user created it or is assigned to it.
    """
    db = _db()
    result = (
        db.table("tasks")
        .select(
            "*, "
            "creator:profiles!tasks_created_by_fkey(id, name, email, avatar_url), "
            "assignee:profiles!tasks_assigned_to_fkey(id, name, email, avatar_url)"
        )
        .eq("id", task_id)
        .execute()
    )

    if not result.data:
        raise TaskNotFoundError(f"Task {task_id} not found.")

    task = result.data[0]

    # Authorization: only creator or assignee can see the task
    if task["created_by"] != user_id and task["assigned_to"] != user_id:
        raise ForbiddenError("You do not have access to this task.")

    return task


def create_task(data: dict, created_by: str) -> dict:
    """
    Insert a new task and return the created record.
    Verifies that the assigned_to user exists.
    """
    _verify_user_exists(data["assigned_to"])

    db = _db()
    insert_data = {
        "title": data["title"],
        "description": data.get("description"),
        "status": "todo",
        "priority": data["priority"],
        "created_by": created_by,
        "assigned_to": data["assigned_to"],
        "due_date": data.get("due_date"),
    }
    result = db.table("tasks").insert(insert_data).execute()
    return result.data[0]


def update_task(task_id: str, data: dict, user_id: str) -> dict:
    """
    Update allowed task fields.
    Creator can manage/update all task fields.
    Assignee can update permitted status actions (e.g. status changes).
    """
    task = get_task_by_id(task_id, user_id)
    is_creator = task["created_by"] == user_id
    is_assignee = task["assigned_to"] == user_id

    if not is_creator and not is_assignee:
        raise ForbiddenError("You do not have access to update this task.")

    if not is_creator:
        # Assignee can only update status
        disallowed = set(data.keys()) - {"status"}
        if disallowed:
            raise ForbiddenError("Assignees can only update task status.")

    if "assigned_to" in data and data["assigned_to"]:
        _verify_user_exists(data["assigned_to"])

    # Only pass fields that are actually provided (avoid overwriting with None)
    allowed_fields = {"title", "description", "assigned_to", "priority", "status", "due_date"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields and v is not None}

    # If status is being set to completed, set completed_at
    if update_data.get("status") == "completed" and task.get("status") != "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    elif update_data.get("status") in ("todo", "in_progress"):
        update_data["completed_at"] = None

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    db = _db()
    result = (
        db.table("tasks")
        .update(update_data)
        .eq("id", task_id)
        .execute()
    )
    return result.data[0]


def complete_task(task_id: str, user_id: str) -> dict:
    """
    Mark a task as completed.
    Both creator and assignee can mark a task complete.
    Sets completed_at timestamp.
    """
    task = get_task_by_id(task_id, user_id)

    if task["status"] == "completed":
        return task  # idempotent — already completed, no-op

    db = _db()
    now = datetime.now(timezone.utc).isoformat()
    result = (
        db.table("tasks")
        .update({"status": "completed", "completed_at": now, "updated_at": now})
        .eq("id", task_id)
        .execute()
    )
    return result.data[0]


def delete_task(task_id: str, user_id: str) -> None:
    """
    Delete a task.
    Only the task creator can delete it.
    """
    task = get_task_by_id(task_id, user_id)

    if task["created_by"] != user_id:
        raise ForbiddenError("Only the task creator can delete this task.")

    db = _db()
    db.table("tasks").delete().eq("id", task_id).execute()
