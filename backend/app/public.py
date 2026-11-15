"""Public configuration and opt-in, non-identifying website analytics."""

import hashlib
import secrets
import time
from collections import OrderedDict
from typing import Literal
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict
from .config import settings
from .repository import Repository

router = APIRouter(prefix="/api/public")
_buckets: OrderedDict[str, tuple[float, int]] = OrderedDict()
_salt = secrets.token_hex(32)


def rate_limit(address: str, now: float | None = None):
    """Bounded in-memory abuse control; nginx is the shared ingress limit."""
    now = time.monotonic() if now is None else now
    key = hashlib.sha256((_salt + address).encode()).hexdigest()
    start, count = _buckets.pop(key, (now, 0))
    if now - start >= 60:
        start, count = now, 0
    _buckets[key] = (start, count + 1)
    while len(_buckets) > 4096:
        _buckets.popitem(last=False)
    if count >= 30:
        raise HTTPException(
            429, "Too many requests; try again later", headers={"Retry-After": "60"}
        )


@router.get("/config")
def public_config():
    cfg = settings()
    return {
        "deployment_environment": "development"
        if cfg.environment == "development"
        else "production",
        "analytics_available": cfg.analytics_enabled and bool(cfg.supabase_secret_key),
        "turnstile_site_key": cfg.turnstile_site_key or None,
        "bot_protection_required": cfg.environment == "production",
        "operator_name": cfg.public_operator_name or None,
        "support_email": cfg.public_support_email or None,
        "privacy_email": cfg.public_privacy_email or None,
        "legal_notices_approved": cfg.legal_notices_approved,
    }


class WebsiteEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    event: Literal["page_view", "cta_click"]
    path: Literal["/", "/privacy", "/terms", "/contact"]
    consent_version: Literal[1]


@router.post("/events", status_code=204)
async def website_event(body: WebsiteEvent, request: Request):
    cfg = settings()
    if not cfg.analytics_enabled or not cfg.supabase_secret_key:
        raise HTTPException(503, "Optional analytics is not configured")
    if request.headers.get("origin") not in cfg.cors_origins:
        raise HTTPException(403, "This origin is not allowed")
    if request.headers.get("dnt") == "1" or request.headers.get("sec-gpc") == "1":
        return Response(status_code=204)
    rate_limit(request.client.host if request.client else "unknown")
    await Repository("", privileged=True).request(
        "POST", "/rest/v1/website_events", json=body.model_dump()
    )
    return Response(status_code=204)
