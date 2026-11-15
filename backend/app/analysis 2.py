from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
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

router = APIRouter(prefix="/api/orgs/{org_id}")


class ReviewInput(BaseModel):
    version_id: UUID


@router.post("/analyze")
async def analyze(org_id: UUID, body: ReviewInput, user: Identity = Depends(identity)):
    await membership(user, org_id, ("admin", "creator"))
    cfg = settings()
    repo = Repository(user.token, privileged=True)
    versions = await user.repo.rows(
        "content_versions", id=f"eq.{body.version_id}", org_id=f"eq.{org_id}"
    )
    if not versions:
        raise HTTPException(404, "Content revision not found")
    version = versions[0]
    run = await repo.rpc(
        "begin_analysis",
        p_org=str(org_id),
        p_actor=user.id,
        p_version=str(body.version_id),
        p_provider=cfg.ai_provider,
        p_model=cfg.ai_model,
    )
    try:
        metadata = version["metadata"].copy()
        if version["document_id"]:
            documents = await user.repo.rows(
                "documents", id=f"eq.{version['document_id']}", org_id=f"eq.{org_id}"
            )
            if documents:
                metadata = {**documents[0]["metadata"], **metadata}
                if "width" in metadata:
                    assets = await user.repo.rows(
                        "assets", org_id=f"eq.{org_id}", approved="eq.true"
                    )
                    approved_ids = {asset["document_id"] for asset in assets}
                    org_docs = await user.repo.rows("documents", org_id=f"eq.{org_id}")
                    metadata["approved_asset_match"] = any(
                        d["id"] in approved_ids
                        and d["sha256"] == documents[0]["sha256"]
                        for d in org_docs
                    )

        if len(version["body"]) > 30000:
            raise ProviderUnavailable(
                "Semantic review supports at most 30,000 characters per revision. Shorten the content before reviewing."
            )
        selected = retrieve(version["body"], run["source_snapshot"])
        output = await provider_analysis(version["body"], selected)
        validate_evidence(output, version["body"], selected)
        exact_issues, exact_deps = deterministic(
            version["body"], run["source_snapshot"], metadata
        )
        output = AnalysisOutput(
            issues=output.issues + exact_issues,
            dependencies=output.dependencies + exact_deps,
        )
        validate_evidence(output, version["body"], run["source_snapshot"])
        return await repo.rpc(
            "finish_analysis",
            p_org=str(org_id),
            p_actor=user.id,
            p_run=run["id"],
            p_status="complete",
            p_output=output.model_dump(mode="json"),
        )
    except (ProviderUnavailable, InvalidEvidence) as exc:
        state = (
            "blocked"
            if isinstance(exc, ProviderUnavailable) and "not configured" in str(exc)
            else "error"
        )
        await repo.rpc(
            "finish_analysis",
            p_org=str(org_id),
            p_actor=user.id,
            p_run=run["id"],
            p_status=state,
            p_output={},
            p_error=str(exc),
        )
        raise HTTPException(
            503 if isinstance(exc, ProviderUnavailable) else 502, str(exc)
        ) from exc
    except HTTPException:
        await repo.rpc(
            "finish_analysis",
            p_org=str(org_id),
            p_actor=user.id,
            p_run=run["id"],
            p_status="error",
            p_output={},
            p_error="Content or evidence changed, or database persistence failed. Retry after reloading.",
        )
        raise

    except Exception as exc:
        await repo.rpc(
            "finish_analysis",
            p_org=str(org_id),
            p_actor=user.id,
            p_run=run["id"],
            p_status="error",
            p_output={},
            p_error="Analysis could not be completed safely. Review server configuration and retry.",
        )
        raise HTTPException(502, "Analysis could not be completed safely") from exc
