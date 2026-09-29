"""
Notification orchestration service with audit logging and deduplication.
"""
from datetime import datetime, timezone
from typing import Optional

from app.config import Config
from app.services.gmail_service import send_email, GmailSendError
from app.middleware.auth import get_supabase_client


def _db():
    return get_supabase_client()


TASK_CREATED_SUBJECT = "New Task Assigned: {task_title}"
TASK_CREATED_BODY = """\
Hi {assignee_name},

You have been assigned a new task.

Task:
{task_title}

Description:
{description}

Priority:
{priority}

Due Date:
{due_date}

Please open TaskFlow to view the task.

Thanks,
TaskFlow
"""

TASK_COMPLETED_SUBJECT = "Task Completed: {task_title}"
TASK_COMPLETED_BODY = """\
Hi {recipient_name},

The following task has been completed:

{task_title}

Completed by:
{completed_by_name}

Completed at:
{completed_at}

Thanks,
TaskFlow
"""


def _already_sent(task_id: str, notification_type: str) -> bool:
    """Check if a SENT notification log already exists for this task + type."""
    db = _db()
    result = (
        db.table("notification_logs")
        .select("id")
        .eq("task_id", task_id)
        .eq("notification_type", notification_type)
        .eq("status", "SENT")
        .execute()
    )
    return len(result.data) > 0


def _log_notification(
    task_id: str,
    recipient_email: str,
    notification_type: str,
    status: str,
    message_id: Optional[str] = None,
    error_message: Optional[str] = None,
) -> None:
    """Insert a record into notification_logs regardless of success/failure."""
    db = _db()
    db.table("notification_logs").insert({
        "task_id": task_id,
        "recipient_email": recipient_email,
        "notification_type": notification_type,
        "status": status,
        "message_id": message_id,
        "error_message": error_message,
        "sent_at": datetime.now(timezone.utc).isoformat() if status == "SENT" else None,
    }).execute()


def notify_task_created(task: dict, assignee: dict) -> None:
    """
    Send a TASK_CREATED email to the assignee.
    Silently logs failure — does not raise; task creation must not be blocked.
    """
    task_id = task["id"]
    notification_type = "TASK_CREATED"

    if _already_sent(task_id, notification_type):
        return  # Deduplication guard

    subject = TASK_CREATED_SUBJECT.format(task_title=task["title"])
    body = TASK_CREATED_BODY.format(
        assignee_name=assignee.get("name", assignee["email"]),
        task_title=task["title"],
        description=task.get("description") or "No description provided.",
        priority=task["priority"].capitalize(),
        due_date=task.get("due_date") or "No due date set.",
    )

    try:
        message_id = send_email(to=assignee["email"], subject=subject, body=body)
        _log_notification(task_id, assignee["email"], notification_type, "SENT", message_id=message_id)
    except (GmailSendError, Exception) as exc:
        _log_notification(task_id, assignee["email"], notification_type, "FAILED", error_message=str(exc))


def notify_task_completed(task: dict, completed_by: dict, recipient: dict) -> None:
    """
    Send a TASK_COMPLETED email to the task creator.
    Silently logs failure — does not raise.
    """
    task_id = task["id"]
    notification_type = "TASK_COMPLETED"

    if _already_sent(task_id, notification_type):
        return

    subject = TASK_COMPLETED_SUBJECT.format(task_title=task["title"])
    body = TASK_COMPLETED_BODY.format(
        recipient_name=recipient.get("name", recipient["email"]),
        task_title=task["title"],
        completed_by_name=completed_by.get("name", completed_by["email"]),
        completed_at=task.get("completed_at", "Unknown"),
    )

    try:
        message_id = send_email(to=recipient["email"], subject=subject, body=body)
        _log_notification(task_id, recipient["email"], notification_type, "SENT", message_id=message_id)
    except (GmailSendError, Exception) as exc:
        _log_notification(task_id, recipient["email"], notification_type, "FAILED", error_message=str(exc))
