"""
Unit tests for Gmail email sending and error handling.
"""
import pytest
from unittest.mock import patch, MagicMock
from googleapiclient.errors import HttpError

from app.services.gmail_service import send_email, GmailSendError


def test_send_email_returns_message_id():
    """Successful send returns the Gmail message ID."""
    mock_service = MagicMock()
    mock_service.users.return_value.messages.return_value.send.return_value.execute.return_value = {
        "id": "gmail-message-id-abc"
    }

    with patch("app.services.gmail_service._build_gmail_service", return_value=mock_service):
        message_id = send_email(
            to="assignee@example.com",
            subject="Test Subject",
            body="Test body.",
        )

    assert message_id == "gmail-message-id-abc"


def test_send_email_raises_gmail_send_error_on_api_failure():
    """HttpError from Gmail API is wrapped in GmailSendError."""
    mock_service = MagicMock()
    mock_response = MagicMock()
    mock_response.status = 403
    mock_service.users.return_value.messages.return_value.send.return_value.execute.side_effect = HttpError(
        resp=mock_response, content=b"Forbidden"
    )

    with patch("app.services.gmail_service._build_gmail_service", return_value=mock_service):
        with pytest.raises(GmailSendError):
            send_email("test@example.com", "Subject", "Body")
