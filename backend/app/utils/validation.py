"""
Request validation schemas using Pydantic.
"""
from datetime import date
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator


VALID_STATUSES = {"todo", "in_progress", "completed"}
VALID_PRIORITIES = {"low", "medium", "high"}


class CreateTaskSchema(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: str
    priority: str
    due_date: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty.")
        if len(v) > 255:
            raise ValueError("Title cannot exceed 255 characters.")
        return v

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v: str) -> str:
        if v not in VALID_PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(VALID_PRIORITIES)}.")
        return v

    @field_validator("assigned_to")
    @classmethod
    def assigned_to_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("assigned_to cannot be empty.")
        return v

    @field_validator("due_date")
    @classmethod
    def valid_due_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("due_date must be a valid date in YYYY-MM-DD format.")
        return v


class UpdateTaskSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title cannot be empty.")
        return v

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(VALID_PRIORITIES)}.")
        return v

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(VALID_STATUSES)}.")
        return v

    @field_validator("due_date")
    @classmethod
    def valid_due_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("due_date must be a valid date in YYYY-MM-DD format.")
        return v
