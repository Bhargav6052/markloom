import io
import pytest
from PIL import Image
from docx import Document
import fitz
from fastapi import HTTPException
from app.files import extract


def test_image_validation_and_dimensions():
    stream = io.BytesIO()
    Image.new("RGB", (120, 80), "red").save(stream, format="PNG")
    result = extract(stream.getvalue(), "ad.png", "image/png", 10000)
    assert result["metadata"]["width"] == 120
    assert len(result["sha256"]) == 64
    with pytest.raises(HTTPException):
        extract(stream.getvalue(), "ad.jpg", "image/jpeg", 10000)


def test_bad_type_and_size():
    with pytest.raises(HTTPException) as err:
        extract(b"abc", "x.html", "text/html", 100)
    assert err.value.status_code == 415
    with pytest.raises(HTTPException) as err:
        extract(b"abc", "x.png", "image/png", 2)
    assert err.value.status_code == 413


def test_docx_provenance():
    doc = Document()
    doc.add_paragraph("Approved price is ₹1,999")
    s = io.BytesIO()
    doc.save(s)
    r = extract(
        s.getvalue(),
        "guidelines.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        100000,
    )
    assert r["text"] == "Approved price is ₹1,999"
    assert r["provenance"][0]["start"] == 0


def test_pdf_provenance_and_scan():
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((20, 30), "Approved price 1999")
    r = extract(doc.tobytes(), "a.pdf", "application/pdf", 100000)
    assert r["provenance"][0]["page"] == 1
    assert r["provenance"][0]["text"] == "Approved price 1999"
    blank = fitz.open()
    blank.new_page()
    with pytest.raises(HTTPException, match="No selectable text"):
        extract(blank.tobytes(), "scan.pdf", "application/pdf", 100000)


@pytest.mark.parametrize("suffix", [".jpg", ".jpeg", ".JPEG"])
def test_real_jpeg_metadata_palette_and_original_hash(suffix):
    import hashlib

    stream = io.BytesIO()
    Image.new("RGB", (120, 80), (255, 0, 0)).save(stream, format="JPEG", quality=95)
    data = stream.getvalue()
    result = extract(data, "asset" + suffix, "image/jpeg", 10000)
    assert result["mime"] == "image/jpeg"
    assert result["sha256"] == hashlib.sha256(data).hexdigest()
    assert (result["metadata"]["width"], result["metadata"]["height"]) == (120, 80)
    assert result["text"] == "" and result["provenance"] == []  # no raster OCR claim
    colors = result["metadata"]["dominant_colors"]
    assert colors and len(colors) <= 5
    channels = tuple(int(colors[0][i : i + 2], 16) for i in (1, 3, 5))
    assert channels[0] >= 250 and channels[1] <= 3 and channels[2] <= 3


@pytest.mark.parametrize(
    "invalid", ["header", "truncated", "png-disguised", "junk", "wrong-mime"]
)
def test_invalid_jpeg_rejected(invalid):
    stream = io.BytesIO()
    Image.new("RGB", (120, 80), "blue").save(stream, format="JPEG")
    data, mime = stream.getvalue(), "image/jpeg"
    if invalid == "header":
        data = data[:20]
    elif invalid == "truncated":
        data = data[:-100]
    elif invalid == "png-disguised":
        stream = io.BytesIO()
        Image.new("RGB", (2, 2), "blue").save(stream, format="PNG")
        data = stream.getvalue()
    elif invalid == "junk":
        data = b"not a JPEG"
    else:
        mime = "image/png"
    with pytest.raises(HTTPException) as error:
        extract(data, "asset.jpg", mime, 10000)
    assert error.value.status_code == (415 if invalid == "wrong-mime" else 422)
