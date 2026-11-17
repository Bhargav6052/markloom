import hashlib
import io
import shutil
from uuid import uuid4

import httpx
import pytest
from PIL import Image, ImageDraw, ImageFont

from app.visual import (
    advanced_findings, contrast_estimate, local_ocr, ocr_findings,
    original_image, parse_ocr, similarity, working_image,
)


def fixture():
    image = Image.new("RGB", (480, 160), "white")
    draw = ImageDraw.Draw(image)
    draw.rectangle((12, 12, 122, 148), fill="#223355")
    draw.ellipse((30, 32, 102, 104), fill="#ffa030")
    draw.text((145, 53), "MARKLOOM", font=ImageFont.load_default(size=34), fill="black")
    return image


def encode(image, fmt):
    buf = io.BytesIO()
    image.save(buf, format=fmt)
    return buf.getvalue()


def test_similarity_resized_jpeg_and_unrelated():
    original = working_image(encode(fixture(), "PNG"))
    transformed = working_image(encode(fixture().resize((240, 80)), "JPEG"))
    assert similarity(original, transformed) is not None
    assert similarity(original, Image.new("RGB", original.size, "white")) is None
    assert similarity(original, original.rotate(90, expand=True)) is None


def test_ocr_bounding_and_confidence():
    header = "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n"
    rows = "5\t1\t1\t1\t1\t1\t1\t2\t20\t15\t93\tForbidden\n"
    rows += "5\t1\t1\t1\t1\t2\t24\t2\t30\t15\t30\tclaim\n"
    rows += "5\t1\t1\t1\t2\t1\t200\t2\t20\t15\t99\toutside\n"
    assert parse_ocr(header + rows, 100, 50) == [
        {"text": "Forbidden claim", "confidence": 30.0, "box": (1, 2, 54, 17)}
    ]


def test_ocr_findings_never_edit_creator_body():
    source = {
        "id": str(uuid4()), "rule_type": "forbidden_term",
        "body": "Never use Forbidden.", "config": {"term": "Forbidden", "replacement": "Allowed"},
    }
    lines = [{"text": "Forbidden", "confidence": 90, "box": (1, 2, 54, 17)}]
    result = ocr_findings(fixture(), lines, [source])
    assert any(i.category == "terminology" and str(i.source_id) == source["id"] for i in result)
    assert all(not i.quote and not i.correction for i in result)
    lines[0]["confidence"] = 40
    assert not any(i.category == "terminology" for i in ocr_findings(fixture(), lines, [source]))


def test_contrast_estimate_low_and_high():
    img = Image.new("RGB", (100, 100), "#eeeeee")
    ImageDraw.Draw(img).rectangle((10, 10, 50, 80), fill="#ffffff")
    assert 1 < contrast_estimate(img, (0, 0, 100, 100)) < 4.5
    ImageDraw.Draw(img).rectangle((10, 10, 50, 80), fill="#000000")
    assert contrast_estimate(img, (0, 0, 100, 100)) > 4.5


@pytest.mark.skipif(not shutil.which("tesseract"), reason="local OCR engine not installed")
def test_real_local_ocr():
    assert any("MARKLOOM" in line["text"].upper() for line in local_ocr(fixture()))


@pytest.mark.asyncio
async def test_private_image_rejects_cross_workspace_and_bad_paths():
    org = str(uuid4())
    doc = {"org_id": str(uuid4()), "object_path": f"{org}/{uuid4()}/{uuid4()}.png",
           "mime": "image/png"}
    with pytest.raises(ValueError, match="Invalid image reference"):
        await original_image(None, org, doc)
    doc["org_id"] = org
    doc["object_path"] = f"{org}/{uuid4()}/../outside.png"
    with pytest.raises(ValueError, match="Invalid image reference"):
        await original_image(None, org, doc)


@pytest.mark.asyncio
async def test_authenticated_storage_hash_and_limits(monkeypatch):
    from app import visual
    org = str(uuid4())
    raw = encode(fixture(), "PNG")
    path = f"{org}/{uuid4()}/{uuid4()}.png"
    headers = {"apikey": "test-only"}
    doc = {"org_id": org, "object_path": path, "mime": "image/png",
           "sha256": hashlib.sha256(raw).hexdigest()}

    class Repo:
        base = "https://storage.invalid"
    repo = Repo()
    repo.headers = headers
    original_client = httpx.AsyncClient

    def handler(request):
        assert request.url.path == "/storage/v1/object/authenticated/inkloom-private/" + path
        assert request.headers["apikey"] == "test-only"
        return httpx.Response(200, content=raw)

    monkeypatch.setattr(visual.httpx, "AsyncClient", lambda **kwargs: original_client(
        transport=httpx.MockTransport(handler), **kwargs))
    assert await original_image(repo, org, doc) == raw
    with pytest.raises(ValueError, match="hash mismatch"):
        await original_image(repo, org, {**doc, "sha256": "0" * 64})
    monkeypatch.setattr(visual, "MAX_BYTES", 5)
    with pytest.raises(ValueError, match="exceeds limit"):
        await original_image(repo, org, doc)


@pytest.mark.asyncio
async def test_local_ocr_failure_is_advisory(monkeypatch):
    from app import visual

    async def load(repo, org, doc):
        return encode(fixture(), "PNG")

    def unavailable(image):
        raise RuntimeError("unavailable")

    monkeypatch.setattr(visual, "original_image", load)
    monkeypatch.setattr(visual, "local_ocr", unavailable)
    result = await advanced_findings(None, "test-org", {"sha256": "a"}, [], [])
    assert len(result) == 1
    assert "OCR unavailable" in result[0].explanation
    assert result[0].severity == "warning"
    assert not result[0].quote and not result[0].correction


def test_ocr_disclaimer_fact_and_contrast_are_advisory():
    image = Image.new("RGB", (100, 100), "#eeeeee")
    ImageDraw.Draw(image).rectangle((10, 10, 50, 80), fill="white")
    sources = [
        {"id": str(uuid4()), "rule_type": "fact", "body": "Price is 10",
         "config": {"subject": "Price", "value": "10"}},
        {"id": str(uuid4()), "rule_type": "required_disclaimer", "body": "Check terms",
         "config": {"text": "Check terms"}},
        {"id": str(uuid4()), "rule_type": "contrast", "body": "Minimum 4.5",
         "config": {"minimum": 4.5}},
    ]
    findings = ocr_findings(
        image, [{"text": "Price is 15", "confidence": 95, "box": (0, 0, 100, 100)}],
        sources,
    )
    assert {"fact", "disclaimer", "accessibility"}.issubset({i.category for i in findings})
    assert all(not i.quote and not i.correction for i in findings)
    assert all(i.evidence_status == "INSUFFICIENT_EVIDENCE" for i in findings if i.source_id)
