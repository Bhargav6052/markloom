import io
import shutil
from uuid import uuid4

import pytest
from PIL import Image, ImageDraw, ImageFont

from app.visual import (
    contrast_estimate, local_ocr, ocr_findings, parse_ocr, similarity, working_image,
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
