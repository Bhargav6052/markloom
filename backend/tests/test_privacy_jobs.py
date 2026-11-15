from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.privacy import classification, transfer_decision
from app.worker import run_once


def test_unknown_and_missing_classification_fail_closed():
    assert classification({}) == "CONFIDENTIAL"
    assert classification({"classification": "unknown"}) == "RESTRICTED"
    policy = {"allow_public": True, "allow_internal": True}
    for classes in [[], ["PUBLIC", "CONFIDENTIAL"], ["RESTRICTED"], ["unknown"]]:
        assert not transfer_decision(classes, policy, True)["allowed"]
    assert transfer_decision(["PUBLIC", "INTERNAL"], policy, True)["allowed"]
    assert not transfer_decision(["PUBLIC"], {}, True)["allowed"]
    assert not transfer_decision(["PUBLIC"], policy, False)["allowed"]


def test_ready_does_not_claim_unconfigured_backend(monkeypatch):
    monkeypatch.setattr(settings(), "supabase_secret_key", "")
    response = TestClient(app).get("/ready")
    assert response.status_code == 503
    assert response.headers["x-request-id"]
    assert response.headers["cache-control"] == "no-store"


def test_privacy_and_queue_require_authentication():
    org = uuid4()
    client = TestClient(app)
    assert client.get(f"/api/orgs/{org}/privacy/status").status_code == 401
    assert (
        client.post(
            f"/api/orgs/{org}/analyze",
            json={"version_id": str(uuid4()), "idempotency_key": str(uuid4())},
        ).status_code
        == 401
    )
    assert (
        client.post(
            f"/api/orgs/{org}/privacy/policy",
            json={"allow_public": True, "allow_internal": True},
        ).status_code
        == 401
    )


async def test_worker_completes_with_claim_lease(monkeypatch):
    from app import worker

    calls = []

    class Queue:
        async def rpc(self, name, **params):
            calls.append((name, params))
            return (
                {"id": "job", "lease_token": "lease"}
                if name == "claim_analysis_job"
                else True
            )

    async def process(job, repo):
        return {"status": "complete", "coverage": "local"}

    monkeypatch.setattr(worker, "process_analysis", process)
    assert await run_once(Queue())
    assert calls[-1] == (
        "finish_analysis_job",
        {
            "p_id": "job",
            "p_lease": "lease",
            "p_result": {"status": "complete", "coverage": "local"},
        },
    )


async def test_worker_failure_is_persisted_without_private_error(monkeypatch):
    from app import worker

    calls = []

    class Queue:
        async def rpc(self, name, **params):
            calls.append((name, params))
            return (
                {"id": "job", "lease_token": "lease"}
                if name == "claim_analysis_job"
                else True
            )

    async def process(job, repo):
        raise ValueError("private provider response must not leak")

    monkeypatch.setattr(worker, "process_analysis", process)
    assert await run_once(Queue())
    assert "private" not in calls[-1][1]["p_error"]
    assert calls[-1][1]["p_result"] == {}
