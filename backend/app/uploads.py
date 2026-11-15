from uuid import UUID, uuid4
from pathlib import PurePath
from typing import Literal
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Response
from .auth import Identity, identity, membership
from .config import settings
from .repository import Repository
from .files import extract

router = APIRouter(prefix="/api/orgs/{org_id}")


@router.post("/uploads")
async def upload(
    org_id: UUID,
    file: UploadFile = File(...),
    purpose: Literal["knowledge", "asset", "content"] = Form(...),
    classification: Literal["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"] = Form(
        "CONFIDENTIAL"
    ),
    user: Identity = Depends(identity),
):
    await membership(
        user, org_id, ("admin",) if purpose != "content" else ("admin", "creator")
    )
    cfg = settings()
    privileged = Repository(user.token, privileged=True)
    data = await file.read(cfg.max_upload_bytes + 1)
    name = PurePath((file.filename or "upload").replace("\\", "/")).name[:200]
    parsed = extract(data, name, file.content_type or "", cfg.max_upload_bytes)
    parsed["metadata"]["classification"] = classification
    if purpose == "asset" and not parsed["mime"].startswith("image/"):
        raise HTTPException(415, "Approved assets must be PNG or JPEG")
    object_path = f"{org_id}/{user.id}/{uuid4()}{PurePath(name).suffix.lower()}"
    # Upload with server credentials after validation; private object has no client write policy.
    import httpx

    try:
        async with httpx.AsyncClient(timeout=40) as client:
            res = await client.post(
                privileged.base + "/storage/v1/object/inkloom-private/" + object_path,
                headers={**privileged.headers, "Content-Type": parsed["mime"]},
                content=data,
            )
            res.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(503, "Private file storage is unavailable") from exc
    try:
        registered = await privileged.rpc(
            "finalize_upload",
            p_org=str(org_id),
            p_actor=user.id,
            p_data={
                **parsed,
                "purpose": purpose,
                "name": name,
                "object_path": object_path,
            },
        )
    except Exception:
        # Best-effort cleanup; never return successful registration when database persistence fails.
        try:
            await privileged.request(
                "DELETE",
                "/storage/v1/object/inkloom-private",
                json={"prefixes": [object_path]},
            )
        except HTTPException:
            pass
        raise
    return {**registered, **parsed, "name": name}


@router.get("/documents/{document_id}/download")
async def download(org_id: UUID, document_id: UUID, user: Identity = Depends(identity)):
    await membership(user, org_id)
    rows = await user.repo.rows(
        "documents", id=f"eq.{document_id}", org_id=f"eq.{org_id}"
    )
    if not rows:
        raise HTTPException(404, "Document not found")
    doc = rows[0]
    import httpx

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.get(
                user.repo.base
                + "/storage/v1/object/authenticated/inkloom-private/"
                + doc["object_path"],
                headers=user.repo.headers,
            )
            res.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(503, "Document download failed") from exc
    return Response(
        res.content,
        media_type=doc["mime"],
        headers={
            "Content-Disposition": 'attachment; filename="document'
            + PurePath(doc["name"]).suffix
            + '"',
            "X-Content-Type-Options": "nosniff",
        },
    )
