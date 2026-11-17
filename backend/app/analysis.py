"""Queue requests are short; a separate durable worker performs all analyses."""

from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from .auth import identity, membership, Identity
from .repository import Repository
from .config import settings
from .schemas import AnalysisOutput
from .ai import (
    provider_analysis,
    validate_evidence,
    ProviderUnavailable,
    InvalidEvidence,
)
from .checks import retrieve, deterministic
from .privacy import preflight
from .visual import advanced_findings

router = APIRouter(prefix="/api/orgs/{org_id}")


class ReviewInput(BaseModel):
    version_id: UUID
    idempotency_key: UUID
    external_consent: bool = False


@router.post("/analyze", status_code=202)
async def analyze(org_id: UUID, body: ReviewInput, user: Identity = Depends(identity)):
    await membership(user, org_id, ("admin", "creator"))
    return await Repository(user.token, privileged=True).rpc(
        "enqueue_analysis",
        p_org=str(org_id),
        p_actor=user.id,
        p_version=str(body.version_id),
        p_key=str(body.idempotency_key),
        p_consent=body.external_consent,
    )


async def process_analysis(job: dict, repo: Repository) -> dict:
    org, actor, version_id = job["org_id"], job["actor"], job["content_version_id"]
    cfg = settings()
    run = await repo.rpc(
        "begin_analysis",
        p_org=org,
        p_actor=actor,
        p_version=version_id,
        p_provider="local",
        p_model="deterministic-v1",
    )
    try:
        versions = await repo.rows(
            "content_versions", id=f"eq.{version_id}", org_id=f"eq.{org}"
        )
        if not versions:
            raise InvalidEvidence("Content revision no longer available")
        version = versions[0]
        metadata = version["metadata"].copy()
        image_doc = None
        approved_docs = []
        if version.get("document_id"):
            docs = await repo.rows(
                "documents", id=f"eq.{version['document_id']}", org_id=f"eq.{org}"
            )
            if docs:
                metadata = {**docs[0]["metadata"], **metadata}
                if "width" in metadata:
                    if docs[0].get("mime") in ("image/png", "image/jpeg"):
                        image_doc = docs[0]
                    assets = await repo.rows(
                        "assets", org_id=f"eq.{org}", approved="eq.true"
                    )
                    ids = [asset["document_id"] for asset in assets]
                    approved_docs = (
                        await repo.rows(
                            "documents",
                            org_id=f"eq.{org}",
                            id="in.(" + ",".join(ids) + ")",
                        )
                        if ids
                        else []
                    )
                    metadata["approved_asset_match"] = any(
                        d["sha256"] == docs[0]["sha256"] for d in approved_docs
                    )
        exact_issues, exact_deps = deterministic(
            version["body"], run["source_snapshot"], metadata
        )
        selected = retrieve(version["body"], run["source_snapshot"])
        decision = await preflight(repo, org, version, selected)
        semantic = AnalysisOutput(issues=[], dependencies=[])
        coverage = "Local deterministic checks only; semantic AI did not run. Independent human review required."
        external = bool(
            job["external_consent"]
            and decision["allowed"]
            and len(version["body"]) <= 30000
        )
        if external:
            event = await repo.rpc(
                "authorize_ai_transfer",
                p_org=org,
                p_actor=actor,
                p_version=version_id,
                p_provider=cfg.ai_provider,
                p_model=cfg.ai_model,
                p_categories=decision["categories"],
            )
            try:
                semantic = await provider_analysis(version["body"], selected)
                validate_evidence(semantic, version["body"], selected)
            except Exception:
                await repo.request(
                    "PATCH",
                    f"/rest/v1/processing_events?id=eq.{event}&org_id=eq.{org}",
                    json={"status": "failed", "completed_at": now()},
                )
                raise
            await repo.request(
                "PATCH",
                f"/rest/v1/processing_events?id=eq.{event}&org_id=eq.{org}",
                json={"status": "succeeded", "completed_at": now()},
            )
            coverage = f"Local deterministic checks and {cfg.ai_provider}/{cfg.ai_model}; independent human review required."
            await repo.request(
                "PATCH",
                f"/rest/v1/analysis_runs?id=eq.{run['id']}&org_id=eq.{org}",
                json={"provider": cfg.ai_provider, "model": cfg.ai_model},
            )
        visual_issues = []
        if image_doc:
            coverage += " Local image advisory checks attempted; see findings for coverage and limitations."
            visual_issues = await advanced_findings(
                repo, org, image_doc, approved_docs, run["source_snapshot"]
            )
        remaining = max(0, 100 - len(semantic.issues) - len(exact_issues))
        output = AnalysisOutput(
            issues=semantic.issues + exact_issues + visual_issues[:remaining],
            dependencies=semantic.dependencies + exact_deps,
        )
        validate_evidence(output, version["body"], run["source_snapshot"])
        result = await repo.rpc(
            "finish_analysis",
            p_org=org,
            p_actor=actor,
            p_run=run["id"],
            p_status="complete",
            p_output=output.model_dump(mode="json"),
        )
        return {
            **result,
            "coverage": coverage,
            "external_processing": external,
            "privacy_reasons": decision["reasons"],
        }
    except Exception as exc:
        message = (
            str(exc)
            if isinstance(exc, (ProviderUnavailable, InvalidEvidence))
            else "Analysis failed safely; check provider, evidence and worker configuration"
        )
        await repo.rpc(
            "finish_analysis",
            p_org=org,
            p_actor=actor,
            p_run=run["id"],
            p_status="error",
            p_output={},
            p_error=message,
        )
        raise ProviderUnavailable(message) from exc


def now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()
