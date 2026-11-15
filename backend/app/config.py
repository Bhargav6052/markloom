from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import re
from urllib.parse import urlsplit


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    ai_provider: str = "gemini"
    ai_model: str = ""
    gemini_api_key: str = ""
    openai_api_key: str = ""
    cors_origins: list[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]
    max_upload_bytes: int = 10 * 1024 * 1024
    environment: str = "development"
    public_site_url: str = ""
    public_operator_name: str = ""
    public_support_email: str = ""
    public_privacy_email: str = ""
    legal_notices_approved: bool = False
    turnstile_site_key: str = ""
    analytics_enabled: bool = False

    @field_validator("public_support_email", "public_privacy_email")
    @classmethod
    def valid_public_email(cls, value: str):
        if value and not re.fullmatch(
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", value
        ):
            raise ValueError("A public contact must be a plain email address")
        return value

    @field_validator("public_site_url")
    @classmethod
    def valid_site_origin(cls, value: str):
        if value:
            parts = urlsplit(value)
            if (
                parts.scheme != "https"
                or not parts.hostname
                or parts.username
                or parts.password
                or parts.query
                or parts.fragment
                or parts.path not in ("", "/")
            ):
                raise ValueError("Public site URL must be an HTTPS origin")
        return value


def launch_blockers(cfg: Settings) -> list[str]:
    missing = []
    for name in (
        "public_site_url",
        "public_operator_name",
        "public_support_email",
        "public_privacy_email",
        "turnstile_site_key",
    ):
        if not getattr(cfg, name):
            missing.append(name.upper())
    if not cfg.legal_notices_approved:
        missing.append("LEGAL_NOTICES_APPROVED")
    return missing


@lru_cache
def settings() -> Settings:
    return Settings()
