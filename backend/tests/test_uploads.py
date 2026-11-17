"""Real multipart parsing/decoding and REST error handling; no external requests."""

import hashlib
import io
from uuid import UUID

import httpx
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.auth import Identity, identity
from app.config import settings
from app.main import app

ORG = "00000000-0000-4000-8000-000000000021"
ACTOR = "00000000-0000-4000-8000-000000000022"
DOC = "00000000-0000-4000-8000-000000000023"


@pytest.fixture
def upload_client(monkeypatch):
    cfg = settings()
    monkeypatch.setattr(cfg, "supabase_url", "https://offline-test.invalid")
    monkeypatch.setattr(cfg, "supabase_publishable_key", "offline-publishable")
    monkeypatch.setattr(cfg, "supabase_secret_key", "offline-server-secret")
    original = httpx.AsyncClient
    calls = []
    state = {
        "conflict": False,
        "cleanup_failure": False,
        "role": "admin",
        "objects": {f"{ORG}/{ACTOR}/existing-approved.jpeg": b"approved asset bytes"},
    }

    class UserRepo:
        async def rows(self, table, **params):
            assert table == "memberships"
            assert params == {"org_id": f"eq.{ORG}", "user_id": f"eq.{ACTOR}"}
            return [{"role": state["role"]}] if state["role"] else []

    app.dependency_overrides[identity] = lambda: Identity(
        ACTOR, "test@example.test", "offline-token", UserRepo()
    )

    def respond(request):
        calls.append(request)
        if request.url.path == "/rest/v1/rpc/inkloom_finalize_upload":
            if state["conflict"]:
                return httpx.Response(
                    400,
                    json={
                        "message": "conflict: an identical asset is already registered in this workspace",
                        "code": "P0001",
                    },
                )
            return httpx.Response(200, json={"id": DOC})
        if request.method == "DELETE":
            import json

            paths = json.loads(request.content)["prefixes"]
            assert f"{ORG}/{ACTOR}/existing-approved.jpeg" not in paths
            if not state["cleanup_failure"]:
                for path in paths:
                    state["objects"].pop(path, None)
            return httpx.Response(503 if state["cleanup_failure"] else 200, json={})
        assert (
            request.method == "POST"
            and "/storage/v1/object/inkloom-private/" in request.url.path
        )
        path = request.url.path.split("/inkloom-private/", 1)[1]
        assert "x-upsert" not in request.headers
        if path in state["objects"]:
            return httpx.Response(400, json={"error": "Object already exists"})
        state["objects"][path] = request.content
        return httpx.Response(200, json={})

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda **kw: original(transport=httpx.MockTransport(respond), **kw),
    )
    with TestClient(app) as client:
        yield client, calls, state
    app.dependency_overrides.pop(identity, None)


def image_bytes(format="JPEG"):
    stream = io.BytesIO()
    Image.new("RGB", (120, 80), "red").save(stream, format=format)
    return stream.getvalue()


@pytest.mark.parametrize(
    "ext,mime,format",
    [
        ("jpg", "image/jpeg", "JPEG"),
        ("jpeg", "image/jpeg", "JPEG"),
        ("png", "image/png", "PNG"),
    ],
)
def test_successful_image_upload(upload_client, ext, mime, format):
    import json

    client, calls, _ = upload_client
    data = image_bytes(format)
    response = client.post(
        f"/api/orgs/{ORG}/uploads",
        files={"file": (f"asset.{ext}", data, mime)},
        data={"purpose": "asset", "classification": "CONFIDENTIAL"},
    )
    assert response.status_code == 200
    result = response.json()
    assert result["id"] == DOC
    assert result["mime"] == mime
    assert result["sha256"] == hashlib.sha256(data).hexdigest()
    assert (result["metadata"]["width"], result["metadata"]["height"]) == (120, 80)
    assert result["metadata"]["dominant_colors"]
    assert result["metadata"]["classification"] == "CONFIDENTIAL"
    assert calls[0].content == data
    assert calls[0].headers["Content-Type"] == mime
    rpc = json.loads(calls[1].content)
    assert rpc["p_org"] == ORG and rpc["p_actor"] == ACTOR
    assert rpc["p_data"]["sha256"] == result["sha256"]
    assert rpc["p_data"]["object_path"].startswith(f"{ORG}/{ACTOR}/")
    UUID(rpc["p_data"]["object_path"].split("/")[-1].split(".")[0])
    assert len(calls) == 2


@pytest.mark.parametrize("cleanup_failure", [False, True])
def test_duplicate_conflict_cleans_only_new_storage_object(
    upload_client, cleanup_failure
):
    import json

    client, calls, state = upload_client
    state.update(conflict=True, cleanup_failure=cleanup_failure)
    response = client.post(
        f"/api/orgs/{ORG}/uploads",
        files={"file": ("renamed.jpeg", image_bytes(), "image/jpeg")},
        data={"purpose": "asset"},
    )
    assert response.status_code == 409
    assert "already registered in this workspace" in response.json()["detail"]
    assert len(calls) == 3
    new_path = json.loads(calls[1].content)["p_data"]["object_path"]
    assert calls[2].method == "DELETE"
    assert json.loads(calls[2].content) == {"prefixes": [new_path]}
    # No read, update, delete or approval operation targets the existing document.
    assert all(DOC not in str(c.url) for c in calls)
    existing = f"{ORG}/{ACTOR}/existing-approved.jpeg"
    assert state["objects"][existing] == b"approved asset bytes"
    assert (new_path in state["objects"]) == cleanup_failure


def test_invalid_jpeg_never_reaches_storage(upload_client):
    client, calls, _ = upload_client
    response = client.post(
        f"/api/orgs/{ORG}/uploads",
        files={"file": ("broken.jpg", b"not JPEG", "image/jpeg")},
        data={"purpose": "asset"},
    )
    assert response.status_code == 422
    assert not calls


@pytest.mark.parametrize("role", ["creator", "manager", "reviewer", None])
def test_asset_membership_checked_before_any_storage_or_duplicate_signal(
    upload_client, role
):
    client, calls, state = upload_client
    state.update(role=role, conflict=True)
    response = client.post(
        f"/api/orgs/{ORG}/uploads",
        files={"file": ("asset.jpg", image_bytes(), "image/jpeg")},
        data={"purpose": "asset"},
    )
    assert response.status_code == 403
    assert not calls


def test_storage_name_collision_never_deletes_or_overwrites_existing_object(
    upload_client, monkeypatch
):
    from app import uploads

    client, calls, state = upload_client
    collision = UUID("00000000-0000-4000-8000-000000000024")
    existing = f"{ORG}/{ACTOR}/{collision}.jpeg"
    state["objects"][existing] = b"approved existing original"
    monkeypatch.setattr(uploads, "uuid4", lambda: collision)
    response = client.post(
        f"/api/orgs/{ORG}/uploads",
        files={"file": ("asset.jpeg", image_bytes(), "image/jpeg")},
        data={"purpose": "asset"},
    )
    assert response.status_code == 503
    assert len(calls) == 1 and calls[0].method == "POST"
    assert state["objects"][existing] == b"approved existing original"
