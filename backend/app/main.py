import logging
from uuid import uuid4
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .config import settings, launch_blockers
from .routes import router
from .uploads import router as uploads_router
from .analysis import router as analysis_router
from .privacy import router as privacy_router
from .public import router as public_router

app = FastAPI(
    title="Inkloom Brand Governance API",
    version="0.2.0",
    docs_url=None if settings().environment == "production" else "/docs",
    redoc_url=None,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings().cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = str(uuid4())
    size = request.headers.get("content-length", "0")
    if not size.isdigit() or int(size) > settings().max_upload_bytes + 1024 * 1024:
        return JSONResponse(
            {"detail": "Request exceeds the supported size", "request_id": request_id},
            status_code=413,
        )
    try:
        response = await call_next(request)
    except Exception:
        logging.getLogger("inkloom.api").error(
            "Unhandled request failure", extra={"request_id": request_id}
        )
        response = JSONResponse(
            {
                "detail": "An internal error occurred; retry or contact your administrator",
                "request_id": request_id,
            },
            status_code=500,
        )
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/ready")
async def ready():
    cfg = settings()
    if cfg.environment == "production" and launch_blockers(cfg):
        raise HTTPException(
            503,
            "Production configuration incomplete: " + ", ".join(launch_blockers(cfg)),
        )
    if not (
        cfg.supabase_url and cfg.supabase_publishable_key and cfg.supabase_secret_key
    ):
        raise HTTPException(503, "Backend Supabase configuration is incomplete")
    from .repository import Repository

    repo = Repository("", privileged=True)
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(
                cfg.supabase_url.rstrip("/") + "/auth/v1/health",
                headers={"apikey": cfg.supabase_publishable_key},
            )
            response.raise_for_status()
        await repo.rows("organizations", limit="1", select="id")
        workers = await repo.rows(
            "worker_heartbeats", order="last_seen.desc", limit="1"
        )
        from datetime import datetime, timezone

        if (
            not workers
            or (
                datetime.now(timezone.utc)
                - datetime.fromisoformat(workers[0]["last_seen"].replace("Z", "+00:00"))
            ).total_seconds()
            > 300
        ):
            raise HTTPException(503, "Analysis worker has no recent heartbeat")
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            503, "A required backend dependency is unavailable"
        ) from exc
    return {
        "status": "ready",
        "checks": {
            "auth": "reachable",
            "database": "reachable",
            "worker": "recent heartbeat",
        },
        "ai_required": False,
    }


@app.get("/health")
def health():
    cfg = settings()
    return {
        "status": "ok",
        "supabase_configured": bool(cfg.supabase_url and cfg.supabase_publishable_key),
        "ai_configured": bool(
            cfg.ai_model
            and (
                cfg.gemini_api_key
                if cfg.ai_provider == "gemini"
                else cfg.openai_api_key
            )
        ),
        "ai_provider": cfg.ai_provider,
        "ai_model": cfg.ai_model or None,
        "trusted_persistence_configured": bool(cfg.supabase_secret_key),
        "note": "Configuration presence only; not a live dependency readiness check",
    }


app.include_router(router)
app.include_router(uploads_router)
app.include_router(analysis_router)
app.include_router(privacy_router)
app.include_router(public_router)
