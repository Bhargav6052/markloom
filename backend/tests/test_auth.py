from fastapi.testclient import TestClient
from app.main import app


def test_unauthenticated():
    assert TestClient(app).get("/api/me").status_code == 401


def test_unauthenticated_write():
    r = TestClient(app).post(
        "/api/organizations", json={"action": "create_org", "data": {"name": "forged"}}
    )
    assert r.status_code == 401
