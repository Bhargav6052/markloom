import re
from math import sqrt
from .schemas import Issue, Dependency


def issue(
    category,
    quote,
    explanation,
    source,
    correction="",
    status="CONTRADICTED",
    severity="warning",
):
    return Issue(
        category=category,
        severity=severity,
        quote=quote,
        explanation=explanation,
        source_id=source["id"] if source else None,
        evidence_quote=source["body"][:4000] if source else "",
        evidence_status=status,
        correction=correction,
    )


def contrast(a: str, b: str) -> float:
    def luminance(c):
        channels = [int(c[i : i + 2], 16) / 255 for i in (1, 3, 5)]
        channels = [
            v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
            for v in channels
        ]
        return sum(v * w for v, w in zip(channels, (0.2126, 0.7152, 0.0722)))

    l1, l2 = sorted((luminance(a), luminance(b)))
    return (l2 + 0.05) / (l1 + 0.05)


def deterministic(
    text: str, sources: list[dict], metadata: dict
) -> tuple[list[Issue], list[Dependency]]:
    issues = []
    deps = []
    for source in sources:
        kind = source["rule_type"]
        cfg = source.get("config", {})
        if kind == "forbidden_term":
            term = cfg.get("term", "")
            if term:
                for match in re.finditer(
                    r"(?<!\w)" + re.escape(term) + r"(?!\w)", text, re.IGNORECASE
                ):
                    issues.append(
                        issue(
                            "terminology",
                            match.group(),
                            f"Approved terminology rule prohibits “{term}”.",
                            source,
                            cfg.get("replacement", ""),
                        )
                    )
        elif kind == "required_disclaimer":
            required = cfg.get("text", source["body"])
            if required and required.casefold() not in text.casefold():
                issues.append(
                    issue(
                        "disclaimer",
                        "",
                        f"Required disclaimer is missing: {required}",
                        source,
                        required,
                    )
                )
        elif kind == "fact" and cfg.get("subject") and cfg.get("value"):
            subject = cfg["subject"]
            expected = cfg["value"]
            pattern = (
                re.escape(subject)
                + r"\s*(?:is|:|=)?\s*((?:₹|Rs\.?|INR|\$|USD|€|EUR)?\s*\d[\d,.]*(?:\s*(?:days?|years?|months?|%))?)"
            )
            for match in re.finditer(pattern, text, re.IGNORECASE):
                actual = match.group(1).strip()
                deps.append(
                    Dependency(
                        quote=match.group(),
                        fact_version_id=source["id"],
                        evidence_quote=source["body"][:4000],
                    )
                )
                if (
                    re.sub(r"\s|,", "", actual).casefold()
                    != re.sub(r"\s|,", "", expected).casefold()
                ):
                    issues.append(
                        issue(
                            "fact",
                            match.group(),
                            f"Approved value for {subject} is {expected}; this passage says {actual}.",
                            source,
                            match.group().replace(match.group(1), expected),
                        )
                    )
        elif kind == "fact" and source["body"] in text:
            deps.append(
                Dependency(
                    quote=source["body"][:4000],
                    fact_version_id=source["id"],
                    evidence_quote=source["body"][:4000],
                )
            )
        elif kind == "dimensions" and "width" in metadata:
            if (metadata["width"], metadata["height"]) != (
                cfg.get("width"),
                cfg.get("height"),
            ):
                issues.append(
                    issue(
                        "visual",
                        "",
                        f"Image is {metadata['width']}×{metadata['height']}; approved dimensions are {cfg.get('width')}×{cfg.get('height')}.",
                        source,
                    )
                )
        elif kind == "palette" and metadata.get("dominant_colors"):

            def rgb(c):
                return tuple(int(c[i : i + 2], 16) for i in (1, 3, 5))

            allowed = cfg.get("colors", [])
            tolerance = cfg.get("tolerance", 45)
            outside = []
            for color in metadata["dominant_colors"]:
                if (
                    allowed
                    and min(
                        sqrt(sum((a - b) ** 2 for a, b in zip(rgb(color), rgb(v))))
                        for v in allowed
                    )
                    > tolerance
                ):
                    outside.append(color)
            if outside:
                issues.append(
                    issue(
                        "visual",
                        "",
                        f"Dominant sampled colors outside palette tolerance: {', '.join(outside)}. Photograph content may require a human exception.",
                        source,
                    )
                )
        elif (
            kind == "contrast"
            and metadata.get("foreground")
            and metadata.get("background")
        ):
            ratio = contrast(metadata["foreground"], metadata["background"])
            threshold = cfg.get("minimum", 4.5)
            if ratio < threshold:
                issues.append(
                    issue(
                        "accessibility",
                        "",
                        f"Declared color pair contrast {ratio:.2f}:1 is below {threshold}:1. This does not measure raster text contrast.",
                        source,
                    )
                )
    if "width" in metadata:
        if metadata.get("approved_asset_match"):
            issues.append(
                issue(
                    "visual",
                    "",
                    "Original binary exactly matches an approved asset SHA-256 hash. This does not approve surrounding content.",
                    None,
                    status="NOT_APPLICABLE",
                    severity="info",
                )
            )
        if not metadata.get("alt_text", "").strip():
            issues.append(
                issue(
                    "accessibility",
                    "",
                    "Alt text has not been supplied.",
                    None,
                    status="NOT_APPLICABLE",
                )
            )
        issues.append(
            issue(
                "visual",
                "",
                "Raster text, logo transformations, and legal compliance require manual review. Pixel palette and dimensions are bounded checks only.",
                None,
                status="NOT_APPLICABLE",
                severity="info",
            )
        )
    return issues, deps


def retrieve(text: str, sources: list[dict], max_chars: int = 40000) -> list[dict]:
    tokens = set(re.findall(r"\w+", text.casefold()))
    ranked = sorted(
        sources,
        key=lambda s: (
            s["rule_type"] != "fact",
            len(tokens & set(re.findall(r"\w+", s["body"].casefold()))),
        ),
        reverse=True,
    )
    selected = []
    size = 0
    for s in ranked:
        # Exact rules are enforced locally even if omitted from the provider context.
        if s["rule_type"] == "fact" and not tokens.intersection(
            re.findall(r"\w+", s["body"].casefold())
        ):
            continue
        if size + len(s["body"]) > max_chars:
            continue
        selected.append(s)
        size += len(s["body"])
    return selected
