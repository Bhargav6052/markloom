"""User-scoped Supabase REST transport. Never uses a shared mutable auth session."""

import httpx
from fastapi import HTTPException
from .config import settings


class Repository:
    def __init__(self, token: str, privileged: bool = False):
        cfg = settings()
        if not cfg.supabase_url or not cfg.supabase_publishable_key:
            raise HTTPException(503, "Supabase is not configured")
        key = cfg.supabase_secret_key if privileged else cfg.supabase_publishable_key
        if not key:
            raise HTTPException(
                503,
                "Backend SUPABASE_SECRET_KEY is required for trusted analysis persistence",
            )
        self.base = cfg.supabase_url.rstrip("/")
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key if privileged else token}",
        }
        # New sb_secret keys belong in apikey, not in a JWT bearer header.
        if privileged and key.startswith("sb_secret_"):
            self.headers.pop("Authorization")

    async def request(self, method: str, path: str, **kwargs):
        # Existing project hosts another app. All Inkloom REST resources are isolated.
        if path.startswith("/rest/v1/rpc/"):
            path = path.replace("/rest/v1/rpc/", "/rest/v1/rpc/inkloom_", 1)
        elif path.startswith("/rest/v1/"):
            path = path.replace("/rest/v1/", "/rest/v1/inkloom_", 1)
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                headers = {**self.headers, **kwargs.pop("headers", {})}
                response = await client.request(
                    method, self.base + path, headers=headers, **kwargs
                )
        except httpx.HTTPError as exc:
            raise HTTPException(503, "Supabase is unavailable") from exc
        if response.is_error:
            # Do not return raw upstream responses, which may include sensitive data.
            if response.status_code in (401, 403):
                raise HTTPException(
                    response.status_code, "Authentication or permission denied"
                )
            if response.status_code == 400:
                try:
                    message = response.json().get("message", "")
                except ValueError:
                    message = ""
                if message.startswith(("denied:", "conflict:", "invalid:")):
                    raise HTTPException(
                        409 if message.startswith("conflict:") else 400, message
                    )
            raise HTTPException(
                502,
                "Database operation failed; check migrations and server configuration",
            )
        return response.json() if response.content else None

    async def rows(self, table: str, **params):
        return await self.request(
            "GET", "/rest/v1/" + table, params={"select": "*", **params}
        )

    async def rpc(self, name: str, **params):
        return await self.request("POST", "/rest/v1/rpc/" + name, json=params)
