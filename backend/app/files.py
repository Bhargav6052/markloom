"""Bounded parsers. Returned provenance is extraction evidence, never approved knowledge."""

import hashlib
import io
import zipfile
from pathlib import PurePath
import fitz
from docx import Document
from PIL import Image, UnidentifiedImageError
from fastapi import HTTPException

Image.MAX_IMAGE_PIXELS = 20_000_000
MIMES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def extract(data: bytes, filename: str, mime: str, limit: int):
    suffix = PurePath(filename).suffix.lower()
    if not data or len(data) > limit:
        raise HTTPException(413, "File is empty or exceeds the 10 MB limit")
    if suffix not in MIMES or mime != MIMES[suffix]:
        raise HTTPException(
            415, "Supported files: text PDF, DOCX, PNG and JPEG with matching MIME type"
        )
    result = {
        "text": "",
        "provenance": [],
        "metadata": {},
        "sha256": hashlib.sha256(data).hexdigest(),
        "mime": mime,
    }
    try:
        if suffix == ".pdf":
            if not data.startswith(b"%PDF-"):
                raise ValueError("Invalid PDF signature")
            with fitz.open(stream=data, filetype="pdf") as doc:
                if doc.is_encrypted or len(doc) > 100:
                    raise ValueError(
                        "Encrypted PDFs and PDFs over 100 pages are unsupported"
                    )
                texts = []
                for page_no, page in enumerate(doc, 1):
                    blocks = page.get_text("blocks")
                    for block in blocks:
                        text = block[4].strip()
                        if text:
                            start = sum(len(t) + 1 for t in texts)
                            texts.append(text)
                            result["provenance"].append(
                                {
                                    "page": page_no,
                                    "bbox": list(block[:4]),
                                    "start": start,
                                    "end": start + len(text),
                                    "text": text,
                                }
                            )
                    if sum(len(t) for t in texts) > 100000:
                        raise ValueError("Extracted text exceeds 100,000 characters")
                result["text"] = "\n".join(texts)
                if not result["text"].strip():
                    raise ValueError(
                        "No selectable text found. Scanned PDFs require manual review; OCR is not supported"
                    )
        elif suffix == ".docx":
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                if (
                    len(archive.infolist()) > 1000
                    or sum(i.file_size for i in archive.infolist()) > 30_000_000
                ):
                    raise ValueError("DOCX expanded size exceeds safe limits")
                if "word/document.xml" not in archive.namelist():
                    raise ValueError("Invalid DOCX document")
            doc = Document(io.BytesIO(data))
            texts = []
            paragraphs = [p.text for p in doc.paragraphs] + [
                cell.text
                for table in doc.tables
                for row in table.rows
                for cell in row.cells
            ]
            for index, text in enumerate(paragraphs):
                if text:
                    start = sum(len(t) + 1 for t in texts)
                    texts.append(text)
                    result["provenance"].append(
                        {
                            "paragraph": index,
                            "start": start,
                            "end": start + len(text),
                            "text": text,
                        }
                    )
            result["text"] = "\n".join(texts)
            if not result["text"].strip() or len(result["text"]) > 100000:
                raise ValueError(
                    "DOCX has no supported text or exceeds 100,000 characters"
                )
        else:
            with Image.open(io.BytesIO(data)) as image:
                if image.format not in ("PNG", "JPEG") or (image.format == "PNG") != (
                    suffix == ".png"
                ):
                    raise ValueError("Image signature does not match extension")
                image.verify()
            with Image.open(io.BytesIO(data)) as image:
                if image.width * image.height > 20_000_000:
                    raise ValueError("Image exceeds 20 megapixels")
                rgb = image.convert("RGB")
                rgb.thumbnail((64, 64))
                colors = rgb.quantize(colors=5).convert("RGB").getcolors(4096) or []
                result["metadata"] = {
                    "width": image.width,
                    "height": image.height,
                    "dominant_colors": [
                        "#%02x%02x%02x" % c for _, c in sorted(colors, reverse=True)[:5]
                    ],
                    "visual_note": "Pixel palette only. Text, logo transformations and raster contrast require manual review.",
                }
    except (
        ValueError,
        zipfile.BadZipFile,
        fitz.FileDataError,
        UnidentifiedImageError,
        OSError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ) as exc:
        raise HTTPException(422, str(exc)) from exc
    return result
