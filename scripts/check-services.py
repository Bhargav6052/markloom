"""Read-only remote health and denied anonymous RPC checks. Never prints keys."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
import httpx
from app.config import Settings


async def main():
    cfg = Settings(_env_file=Path(__file__).resolve().parents[1] / "backend" / ".env")
    async with httpx.AsyncClient(timeout=15) as client:
        headers = {"apikey": cfg.supabase_publishable_key}
        health = await client.get(cfg.supabase_url + "/auth/v1/health", headers=headers)
        assert health.status_code == 200, f"Auth health failed: {health.status_code}"
        denied = await client.post(cfg.supabase_url + "/rest/v1/rpc/inkloom_governance", headers=headers,
                                   json={"p_org": None, "p_action": "create_org", "p_data": {}})
        assert denied.status_code in (401, 403), f"Unexpected anonymous RPC status: {denied.status_code}"
    print("PASS live Supabase Auth health and anonymous Inkloom RPC denial; no accounts or tenant records created")


asyncio.run(main())
