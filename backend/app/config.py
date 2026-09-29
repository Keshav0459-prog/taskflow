import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Supabase credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Gmail service credentials (OAuth 2.0 refresh flow)
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REFRESH_TOKEN: str = os.getenv("GOOGLE_REFRESH_TOKEN", "")
    GMAIL_SENDER_EMAIL: str = os.getenv("GMAIL_SENDER_EMAIL", "")

    # Allowed frontend origin for CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    DEBUG: bool = os.getenv("FLASK_DEBUG", "0") == "1"

    @classmethod
    def validate(cls) -> None:
        """Sanity check critical environment variables on startup."""
        required = [
            ("SUPABASE_URL", cls.SUPABASE_URL),
            ("SUPABASE_SERVICE_ROLE_KEY", cls.SUPABASE_SERVICE_ROLE_KEY),
        ]
        missing = [name for name, value in required if not value]
        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}\n"
                "Copy .env.example to .env and fill in real values."
            )
