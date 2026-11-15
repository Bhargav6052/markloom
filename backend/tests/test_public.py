import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app
from app.config import settings, Settings
from app import public


def test_public_config_never_exposes_private_keys(monkeypatch):
    cfg = settings()
    monkeypatch.setattr(cfg, "supabase_secret_key", "test-server-secret")
    monkeypatch.setattr(cfg, "openai_api_key", "test-provider-secret")
    body = TestClient(app).get("/api/public/config").text
    assert "test-server-secret" not in body and "test-provider-secret" not in body
    assert "operator_name" in body


def test_analytics_unconfigured_is_unavailable(monkeypatch):
    monkeypatch.setattr(settings(), "analytics_enabled", False)
    r = TestClient(app).post(
        "/api/public/events",
        json={"event": "page_view", "path": "/", "consent_version": 1},
    )
    assert r.status_code == 503


def test_analytics_rejects_private_paths_and_identity_fields():
    for body in [
        {"event": "page_view", "path": "/app/private", "consent_version": 1},
        {
            "event": "page_view",
            "path": "/",
            "consent_version": 1,
            "email": "private@example.test",
        },
    ]:
        assert TestClient(app).post("/api/public/events", json=body).status_code == 422


def test_analytics_enforces_origin_and_privacy_signals(monkeypatch):
    monkeypatch.setattr(settings(), "analytics_enabled", True)
    monkeypatch.setattr(settings(), "supabase_secret_key", "test-server-secret")
    client = TestClient(app)
    body = {"event": "page_view", "path": "/", "consent_version": 1}
    assert (
        client.post(
            "/api/public/events",
            json=body,
            headers={"Origin": "https://unapproved.example.test"},
        ).status_code
        == 403
    )

    def never_use_repo(*args, **kwargs):
        raise AssertionError("Privacy signal must prevent persistence")

    monkeypatch.setattr(public, "Repository", never_use_repo)
    origin = settings().cors_origins[0]
    assert (
        client.post(
            "/api/public/events", json=body, headers={"Origin": origin, "Sec-GPC": "1"}
        ).status_code
        == 204
    )


def test_analytics_rate_limit_is_bounded_and_recovers():
    public._buckets.clear()
    for _ in range(30):
        public.rate_limit("test-only-address", 100)
    with pytest.raises(HTTPException) as exc:
        public.rate_limit("test-only-address", 101)
    assert exc.value.status_code == 429
    public.rate_limit("test-only-address", 161)
    assert len(public._buckets) == 1
    assert "test-only-address" not in public._buckets


def test_invalid_public_contact_and_origin_are_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, public_support_email="a@example.test?body=bad")
    with pytest.raises(ValidationError):
        Settings(_env_file=None, public_site_url="http://example.test")


def test_production_readiness_requires_legal_and_bot_setup(monkeypatch):
    monkeypatch.setattr(settings(), "environment", "production")
    monkeypatch.setattr(settings(), "public_site_url", "")
    r = TestClient(app).get("/ready")
    assert r.status_code == 503 and "PUBLIC_SITE_URL" in r.text


@pytest.mark.parametrize(
    "environment,expected", [("development", False), ("production", True)]
)
def test_auth_configuration_distinguishes_development_and_production(
    monkeypatch, environment, expected
):
    monkeypatch.setattr(settings(), "environment", environment)
    response = TestClient(app).get("/api/public/config")
    assert response.status_code == 200
    assert response.json()["deployment_environment"] == environment
    assert response.json()["bot_protection_required"] is expected
