"""Fail-closed external processing decisions, including source document sensitivity."""

from typing import Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from .auth import Identity, identity, membership
from .config import settings
from .repository import Repository

CLASSES = ("PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED")
router = APIRouter(prefix="/api/orgs/{org_id}/privacy")


def classification(metadata: dict) -> str:
    value = metadata.get("classification", "CONFIDENTIAL")
    return value if value in CLASSES else "RESTRICTED"


def transfer_decision(categories: list[str], policy: dict, configured: bool) -> dict:
    reasons = []
    if not configured:
        reasons.append("AI provider/model/key is not configured")
    if not categories:
        reasons.append("Classification is unavailable")
    for category in set(categories):
        if category not in ("PUBLIC", "INTERNAL"):
            reasons.append(f"{category} data cannot leave this application")
        elif not policy.get("allow_" + category.lower(), False):
            reasons.append(f"Organization has not allowed external AI for {category}")
    return {
        "allowed": not reasons,
        "reasons": reasons,
        "categories": sorted(set(categories)),
    }


def provider_configured() -> bool:
    cfg = settings()
    return bool(
        cfg.ai_model
        and (
            (cfg.ai_provider == "gemini" and cfg.gemini_api_key)
            or (cfg.ai_provider == "openai" and cfg.openai_api_key)
        )
    )


async def preflight(
    repo: Repository, org: str, version: dict, sources: list[dict]
) -> dict:
    policies = await repo.rows("ai_policies", org_id=f"eq.{org}")
    categories = [classification(version.get("metadata", {}))]
    # Attached originals can contain more information than extracted text. Include their class.
    doc_ids = {s.get("document_id") for s in sources} | {version.get("document_id")}
    categories.extend(classification(s.get("config", {})) for s in sources)
    if any(doc_ids):
        docs = await repo.rows("documents", org_id=f"eq.{org}")
        by_id = {d["id"]: d for d in docs}
        categories.extend(
            classification(by_id.get(d, {}).get("metadata", {})) for d in doc_ids if d
        )
    decision = transfer_decision(
        categories, policies[0] if policies else {}, provider_configured()
    )
    if len(version["body"]) > 30000:
        decision["allowed"] = False
        decision["reasons"].append(
            "External semantic review supports at most 30,000 characters per saved revision"
        )
    cfg = settings()
    return {
        **decision,
        "provider": cfg.ai_provider,
        "model": cfg.ai_model or None,
        "source_count": len(sources),
        "data": ["Draft text", "Selected approved source passages"],
        "binary_files_sent": False,
        "policy_revision": policies[0]["revision"] if policies else 0,
        "provider_terms": "Not verified for your account/tier",
        "checked_at": __import__("datetime")
        .datetime.now(__import__("datetime").timezone.utc)
        .isoformat(),
    }


class Preview(BaseModel):
    version_id: UUID


@router.post("/preflight")
async def preview(org_id: UUID, body: Preview, user: Identity = Depends(identity)):
    await membership(user, org_id)
    versions = await user.repo.rows(
        "content_versions", id=f"eq.{body.version_id}", org_id=f"eq.{org_id}"
    )
    if not versions:
        raise HTTPException(404, "Content version not found")
    from .checks import retrieve
    from datetime import datetime, timezone

    sources = await user.repo.rows(
        "source_versions", org_id=f"eq.{org_id}", status="eq.approved"
    )
    current = await user.repo.rows("sources", org_id=f"eq.{org_id}")
    ids = {s["current_version_id"] for s in current}
    now = datetime.now(timezone.utc)
    effective = [
        s
        for s in sources
        if s["id"] in ids
        and datetime.fromisoformat(s["valid_from"].replace("Z", "+00:00")) <= now
        and (
            not s.get("expires_at")
            or datetime.fromisoformat(s["expires_at"].replace("Z", "+00:00")) > now
        )
    ]
    return await preflight(
        user.repo, str(org_id), versions[0], retrieve(versions[0]["body"], effective)
    )


@router.get("/status")
async def status(org_id: UUID, user: Identity = Depends(identity)):
    await membership(user, org_id)
    policies = await user.repo.rows("ai_policies", org_id=f"eq.{org_id}")
    return {
        "policy": policies[0]
        if policies
        else {"allow_public": False, "allow_internal": False, "revision": 0},
        "provider": settings().ai_provider,
        "model": settings().ai_model or None,
        "configured": provider_configured(),
        "provider_terms": "Not verified for your account/tier",
        "retention": {
            "automatic_purge": False,
            "status": "Not configured; records retained until reviewed manual deletion",
        },
        "notice": {"version": "2026-11-15-draft", "published": False},
        "inventory": [
            {
                "category": "Identity",
                "store": "Supabase Auth",
                "data": "Verified email and account ID",
            },
            {
                "category": "Brand/content",
                "store": "Supabase Postgres + private Storage",
                "data": "Drafts, originals, source versions and approval history",
            },
            {
                "category": "AI attempts",
                "store": "Supabase Postgres",
                "data": "Provider/model, classes, actor, policy revision, time and outcome; no raw text in event rows",
            },
        ],
    }


class Policy(BaseModel):
    allow_public: bool
    allow_internal: bool


@router.post("/policy")
async def set_policy(org_id: UUID, body: Policy, user: Identity = Depends(identity)):
    await membership(user, org_id, ("admin",))
    return await Repository(user.token, privileged=True).rpc(
        "set_ai_policy",
        p_org=str(org_id),
        p_actor=user.id,
        p_public=body.allow_public,
        p_internal=body.allow_internal,
    )


class PrivacyRequest(BaseModel):
    kind: Literal["export", "deletion"]


@router.post("/requests")
async def request(
    org_id: UUID, body: PrivacyRequest, user: Identity = Depends(identity)
):
    await membership(user, org_id)
    repo = Repository(user.token, privileged=True)
    rows = await repo.request(
        "POST",
        "/rest/v1/privacy_requests",
        json={"org_id": str(org_id), "requested_by": user.id, "kind": body.kind},
        headers={**repo.headers, "Prefer": "return=representation"},
    )
    return rows[0]
