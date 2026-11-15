"""Run: python -m app.worker. No in-memory queue or user bearer tokens persisted."""

import asyncio
import logging
from uuid import uuid4
from .repository import Repository
from .analysis import process_analysis

log = logging.getLogger("inkloom.worker")


async def run_once(repo: Repository) -> bool:
    job = await repo.rpc("claim_analysis_job")
    if not job:
        return False
    try:
        result = await asyncio.wait_for(process_analysis(job, repo), timeout=240)
        await repo.rpc(
            "finish_analysis_job",
            p_id=job["id"],
            p_lease=job["lease_token"],
            p_result=result,
        )
    except Exception:
        log.warning("Analysis job failed", extra={"job_id": job["id"]})
        await repo.rpc(
            "finish_analysis_job",
            p_id=job["id"],
            p_lease=job["lease_token"],
            p_result={},
            p_error="Analysis failed. Inspect the analysis history and retry; no approval was created.",
        )
    return True


async def main():
    logging.basicConfig(level=logging.INFO)
    repo = Repository("", privileged=True)
    worker_id = str(uuid4())
    while True:
        try:
            from .analysis import now

            await repo.request(
                "POST",
                "/rest/v1/worker_heartbeats?on_conflict=id",
                json={"id": worker_id, "last_seen": now()},
                headers={"Prefer": "resolution=merge-duplicates"},
            )
            worked = await run_once(repo)
        except Exception:
            log.warning("Queue unavailable; retrying without private content in logs")
            worked = False
        if not worked:
            await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(main())
