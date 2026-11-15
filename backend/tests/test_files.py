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
