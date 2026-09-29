"""
Gmail API client for sending transactional notifications via OAuth 2.0.
"""
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import Config


class GmailSendError(Exception):
    """Raised when the Gmail API fails to send an email."""
    pass


def _build_gmail_service():
    """
    Build an authenticated Gmail API service using the stored OAuth refresh token.

    The refresh_token was generated once (via OAuth consent screen) and stored
    in the environment. Google's library handles silently refreshing the access token.
    """
    credentials = Credentials(
        token=None,  # No current access token — will be obtained from refresh_token
        refresh_token=Config.GOOGLE_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/gmail.send"],
    )
    return build("gmail", "v1", credentials=credentials, cache_discovery=False)


def _encode_message(message: MIMEMultipart) -> dict:
    """Encode an email message to the base64url format required by the Gmail API."""
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    return {"raw": raw}


def send_email(to: str, subject: str, body: str) -> str:
    """
    Send a plain-text email via the Gmail API.

    Args:
        to:      Recipient email address
        subject: Email subject line
        body:    Plain-text email body

    Returns:
        The Gmail message ID (stored in notification_logs for audit).

    Raises:
        GmailSendError: If the Gmail API returns an error.
    """
    message = MIMEMultipart()
    message["to"] = to
    message["from"] = Config.GMAIL_SENDER_EMAIL
    message["subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        service = _build_gmail_service()
        sent = (
            service.users()
            .messages()
            .send(userId="me", body=_encode_message(message))
            .execute()
        )
        return sent["id"]

    except HttpError as exc:
        # Surface a clean error — do not expose raw Google API error details
        raise GmailSendError(f"Gmail API error: {exc.status_code}") from exc
    except Exception as exc:
        raise GmailSendError(f"Unexpected error sending email: {type(exc).__name__}") from exc
