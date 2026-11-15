from dataclasses import dataclass
from uuid import UUID
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .repository import Repository

bearer = HTTPBearer(auto_error=False)


@dataclass
class Identity:
    id: str
    email: str
    token: str
    repo: Repository


async def identity(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> Identity:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Sign in to continue")
    repo = Repository(credentials.credentials)
    # Auth server validates expiration, signature, issuer and account independently.
    user = await repo.request("GET", "/auth/v1/user")
    if not user.get("id") or not user.get("email_confirmed_at"):
        raise HTTPException(401, "A verified email account is required")
    return Identity(user["id"], user.get("email", ""), credentials.credentials, repo)


async def membership(user: Identity, org_id: UUID, roles: tuple[str, ...] = ()):
    rows = await user.repo.rows(
        "memberships", org_id=f"eq.{org_id}", user_id=f"eq.{user.id}"
    )
    if not rows or (roles and rows[0]["role"] not in roles):
        raise HTTPException(403, "Your workspace role does not permit this operation")
    return rows[0]
