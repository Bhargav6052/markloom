"""Bounded local image review; results are advisory, never approval."""

import asyncio
import csv
import hashlib
import io
import os
import re
import shutil
import subprocess
from pathlib import PurePosixPath
from urllib.parse import quote

import httpx
from PIL import Image, ImageOps

from .checks import contrast, deterministic, issue

MAX_BYTES = 10 * 1024 * 1024
MAX_ASSETS = 8
MAX_LINES = 12
MIN_CONFIDENCE = 70.0


async def original_image(repo, org, doc):
    path = doc.get("object_path", "")
    parts = PurePosixPath(path).parts
    if (
        doc.get("org_id") != org
        or len(parts) != 3
        or parts[0] != org
        or path != "/".join(parts)
        or not all(re.fullmatch(r"[0-9a-fA-F-]{36}", p) for p in parts[:2])
        or not re.fullmatch(r"[0-9a-fA-F-]{36}\\.(?:png|jpg|jpeg)", parts[2])
        or any(p in (".", "..") for p in parts)
        or doc.get("mime") not in ("image/png", "image/jpeg")
    ):
        raise ValueError("Invalid image reference")
    data = bytearray()
    async with httpx.AsyncClient(timeout=8, follow_redirects=False) as client:
        async with client.stream(
            "GET",
            repo.base + "/storage/v1/object/authenticated/inkloom-private/"
            + quote(path, safe="/"),
            headers=repo.headers,
        ) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes(chunk_size=65536):
                data.extend(chunk)
                if len(data) > MAX_BYTES:
                    raise ValueError("Image exceeds limit")
    if hashlib.sha256(data).hexdigest() != doc.get("sha256"):
        raise ValueError("Original hash mismatch")
    return bytes(data)


def working_image(data):
    if not data or len(data) > MAX_BYTES:
        raise ValueError("Image exceeds limits")
    with Image.open(io.BytesIO(data)) as opened:
        if opened.format not in ("PNG", "JPEG") or (
            opened.width * opened.height > 20_000_000
        ):
            raise ValueError("Unsupported or oversized image")
        oriented = ImageOps.exif_transpose(opened)
        oriented.thumbnail((1600, 1600))
        rgba = oriented.convert("RGBA")
        return Image.alpha_composite(
            Image.new("RGBA", rgba.size, "white"), rgba
        ).convert("RGB")


def signature(image):
    sample = list(image.convert("L").resize((9, 8), Image.Resampling.LANCZOS).getdata())
    if max(sample) - min(sample) < 45:
        return None
    bits = tuple(
        sample[y * 9 + x] > sample[y * 9 + x + 1]
        for y in range(8)
        for x in range(8)
    )
    thumb = list(image.resize((8, 8), Image.Resampling.LANCZOS).getdata())
    return image.width / image.height, bits, thumb


def similarity(first, second):
    a, b = signature(first), signature(second)
    if a is None or b is None or abs(a[0] / b[0] - 1) > 0.12:
        return None
    difference = sum(x != y for x, y in zip(a[1], b[1]))
    color_error = sum(
        abs(x - y) for p, q in zip(a[2], b[2]) for x, y in zip(p, q)
    ) / 192
    if difference > 8 or color_error > 22:
        return None
    return 100 * (1 - difference / 64)


def parse_ocr(tsv, width, height):
    groups = {}
    for row in csv.DictReader(io.StringIO(tsv), delimiter="\t"):
        if row.get("level") != "5":
            continue
        try:
            confidence = float(row["conf"])
            x, y, w, h = (int(row[k]) for k in ("left", "top", "width", "height"))
            text = " ".join(row["text"].split())[:140]
        except (ValueError, TypeError, KeyError, AttributeError):
            continue
        if not text or not (0 <= confidence <= 100):
            continue
        if not (0 <= x < x + w <= width and 0 <= y < y + h <= height):
            continue
        key = tuple(row.get(k) for k in ("page_num", "block_num", "par_num", "line_num"))
        if key not in groups and len(groups) >= MAX_LINES:
            continue
        words = groups.setdefault(key, [])
        if len(words) < 20:
            words.append((text, confidence, (x, y, x + w, y + h)))
    lines = []
    for words in groups.values():
        boxes = [word[2] for word in words]
        lines.append({
            "text": " ".join(word[0] for word in words)[:400],
            "confidence": min(word[1] for word in words),
            "box": (
                min(b[0] for b in boxes), min(b[1] for b in boxes),
                max(b[2] for b in boxes), max(b[3] for b in boxes),
            ),
        })
    return lines


def local_ocr(image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    executable = shutil.which("tesseract")
    if not executable:
        raise RuntimeError("Local OCR engine unavailable")
    result = subprocess.run(
        [executable, "stdin", "stdout", "-l", "eng", "--psm", "11", "tsv"],
        input=buffer.getvalue(),
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        timeout=12,
        check=True,
        env={"PATH": os.environ.get("PATH", os.defpath), "LANG": "C.UTF-8", "OMP_THREAD_LIMIT": "1"},
    )
    if len(result.stdout) > 512_000:
        raise ValueError("OCR output limit")
    return parse_ocr(result.stdout.decode("utf-8", errors="replace"), *image.size)


def contrast_estimate(image, box):
    """Approximate region contrast, not a WCAG conformance test."""
    crop = image.crop(box)
    crop.thumbnail((160, 160))
    pixels = list(crop.getdata())
    if len(pixels) < 20:
        return None

    def lum(pixel):
        values = [v / 255 for v in pixel]
        linear = [
            v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
            for v in values
        ]
        return sum(v * w for v, w in zip(linear, (0.2126, 0.7152, 0.0722)))

    ordered = sorted(pixels, key=lum)
    low = ordered[int(0.05 * (len(ordered) - 1))]
    high = ordered[int(0.95 * (len(ordered) - 1))]
    return contrast("#%02x%02x%02x" % low, "#%02x%02x%02x" % high)


def advisory(category, explanation, source=None, severity="info"):
    # OCR is not a creator-body quote. Never emit edits or dependencies.
    return issue(
        category, "", explanation[:4000], source,
        status="INSUFFICIENT_EVIDENCE" if source else "NOT_APPLICABLE",
        severity=severity,
    )


def ocr_findings(image, lines, sources):
    findings = []
    reliable = [line for line in lines if line["confidence"] >= MIN_CONFIDENCE]
    if not lines:
        return [advisory("visual", "Local OCR detected no text; absence is not proven. Inspect the image manually.")]
    details = " | ".join(
        f'{line["text"]} (min confidence {line["confidence"]:.0f}%; box {line["box"]})'
        for line in lines
    )
    findings.append(advisory(
        "visual", f"Local OCR, English, working image {image.width}×{image.height}; "
        "coordinates are left/top/right/bottom after orientation and scaling. "
        f"Unverified image-derived text: {details[:3400]}. Review manually.",
    ))
    if len(reliable) < len(lines):
        findings.append(advisory(
            "visual", "Low-confidence OCR text was excluded from factual and terminology checks.",
            severity="warning",
        ))
    policies = [s for s in sources if s["rule_type"] in ("fact", "forbidden_term")]
    for line in reliable:
        matches, _ = deterministic(line["text"], policies, {})
        for match in matches[:3]:
            source = next(s for s in policies if str(s["id"]) == str(match.source_id))
            if len(findings) >= 9:
                break
            findings.append(advisory(
                match.category,
                f'Potential image-text issue (OCR {line["confidence"]:.0f}%, '
                f'box {line["box"]}): {match.explanation} Verify the image before correcting it.',
                source, "warning",
            ))
        if len(findings) >= 9:
            break
    recognized = re.sub(r"\s+", " ", " ".join(line["text"] for line in reliable).casefold()).strip()
    for source in sources:
        if source["rule_type"] != "required_disclaimer" or len(findings) >= 12:
            continue
        required = source.get("config", {}).get("text", source["body"])
        required = re.sub(r"\s+", " ", required.casefold()).strip()
        if required and required not in recognized:
            findings.append(advisory(
                "disclaimer", "Required disclaimer was not confirmed in recognized image text. "
                "OCR may miss text; manually check the original image.",
                source, "warning",
            ))
    contrast_rules = [s for s in sources if s["rule_type"] == "contrast"]
    for line in reliable:
        if len(findings) >= 15:
            break
        estimate = contrast_estimate(image, line["box"])
        if estimate is None:
            continue
        for source in contrast_rules:
            if len(findings) >= 15:
                break
            minimum = source.get("config", {}).get("minimum", 4.5)
            if isinstance(minimum, (int, float)) and estimate < minimum:
                findings.append(advisory(
                    "accessibility",
                    f"Estimated raster region contrast {estimate:.2f}:1 is below {minimum}:1 "
                    f'at OCR box {line["box"]}. Sampling may be affected by backgrounds; '
                    "this is not a WCAG measurement. Verify manually.",
                    source, "warning",
                ))
    return findings


async def advanced_findings(repo, org, doc, approved_docs, sources):
    findings = []
    try:
        data = await asyncio.wait_for(original_image(repo, org, doc), timeout=10)
        image = await asyncio.to_thread(working_image, data)
    except Exception:
        return [advisory("visual", "Advanced image checks unavailable: original could not be verified or decoded. Manual review required.", severity="warning")]
    try:
        lines = await asyncio.to_thread(local_ocr, image)
        findings.extend(await asyncio.to_thread(ocr_findings, image, lines, sources))
    except Exception:
        findings.append(advisory("visual", "Local OCR unavailable or exceeded its limits. Manual text and raster contrast review required.", severity="warning"))
    candidates = sorted(
        (d for d in approved_docs if d.get("sha256") != doc.get("sha256")),
        key=lambda d: str(d.get("id", "")),
    )
    hits = []
    incomplete = len(candidates) > MAX_ASSETS

    async def compare():
        nonlocal incomplete
        for candidate in candidates[:MAX_ASSETS]:
            try:
                raw = await asyncio.wait_for(original_image(repo, org, candidate), timeout=8)
                other = await asyncio.to_thread(working_image, raw)
                score = await asyncio.to_thread(similarity, image, other)
                if score is not None:
                    hits.append((score, str(candidate["id"])))
            except Exception:
                incomplete = True

    try:
        await asyncio.wait_for(compare(), timeout=25)
    except TimeoutError:
        incomplete = True
    for score, doc_id in sorted(hits, reverse=True)[:3]:
        findings.append(advisory(
            "visual", f"Possible visually similar approved asset (document {doc_id}); "
            f"perceptual edge agreement {score:.1f}%. This is not an identity probability. "
            "Resize/re-encoding candidates require human confirmation.",
        ))
    if incomplete:
        findings.append(advisory("visual", "Similarity search was limited or incomplete; manually review other approved assets."))
    return findings[:18]
