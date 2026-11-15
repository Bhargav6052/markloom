from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from .auth import identity, membership, Identity
from .schemas import Command

router = APIRouter(prefix="/api")


@router.get("/me")
async def me(user: Identity = Depends(identity)):
    memberships = await user.repo.rows("memberships", user_id=f"eq.{user.id}")
    orgs = await user.repo.rows("organizations")
    roles = {m["org_id"]: m["role"] for m in memberships}
    return {
        "id": user.id,
        "email": user.email,
        "organizations": [
            {**o, "role": roles[o["id"]]} for o in orgs if o["id"] in roles
        ],
    }


@router.post("/organizations")
async def create_org(command: Command, user: Identity = Depends(identity)):
    if command.action not in ("create_org", "accept_invite"):
        raise HTTPException(400, "Invalid onboarding action")
    return await user.repo.rpc(
        "governance", p_org=None, p_action=command.action, p_data=command.data
    )


TABLES = {
    "memberships",
    "invites",
    "documents",
    "assets",
    "sources",
    "source_versions",
    "content",
    "content_versions",
    "analysis_runs",
    "issues",
    "dependencies",
    "review_requests",
    "comments",
    "decisions",
    "passports",
    "fact_changes",
    "impacts",
    "notifications",
    "audit_log",
    "correction_decisions",
    "ai_policies",
    "processing_events",
    "privacy_requests",
    "analysis_jobs",
}


@router.get("/orgs/{org_id}/{table}")
async def records(org_id: UUID, table: str, user: Identity = Depends(identity)):
    await membership(user, org_id)
    if table not in TABLES:
        raise HTTPException(404, "Unknown resource")
    params = {"org_id": f"eq.{org_id}", "order": "created_at.desc", "limit": "1000"}
    return await user.repo.rows(table, **params)


@router.post("/orgs/{org_id}/command")
async def command(org_id: UUID, command: Command, user: Identity = Depends(identity)):
    await membership(user, org_id)
    return await user.repo.rpc(
        "governance", p_org=str(org_id), p_action=command.action, p_data=command.data
    )
