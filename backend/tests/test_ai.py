from uuid import uuid4
import pytest
from app.schemas import AnalysisOutput, Issue, Dependency
from app.ai import (
    validate_evidence,
    InvalidEvidence,
    provider_analysis,
    ProviderUnavailable,
)
from app.checks import deterministic, contrast, retrieve
from app.config import settings

S = {
    "id": str(uuid4()),
    "body": "Demo product price is ₹1,999",
    "rule_type": "fact",
    "config": {},
}


def finding(
    source=None, quote="Demo product", evidence="", status="INSUFFICIENT_EVIDENCE"
):
    return Issue(
        category="claim",
        severity="warning",
        quote=quote,
        explanation="Test fixture",
        source_id=source,
        evidence_quote=evidence,
        evidence_status=status,
        correction="",
    )


def test_unknown_citation_rejected():
    with pytest.raises(InvalidEvidence):
        validate_evidence(
            AnalysisOutput(
                issues=[finding(uuid4(), evidence="invented", status="CONTRADICTED")],
                dependencies=[],
            ),
            S["body"],
            [S],
        )


def test_unsubstantiated_not_false():
    validate_evidence(
        AnalysisOutput(issues=[finding()], dependencies=[]), S["body"], [S]
    )
    with pytest.raises(InvalidEvidence):
        validate_evidence(
            AnalysisOutput(issues=[finding(status="CONTRADICTED")], dependencies=[]),
            S["body"],
            [S],
        )


def test_grounded_dependency():
    output = AnalysisOutput(
        issues=[],
        dependencies=[
            Dependency(
                quote=S["body"], fact_version_id=S["id"], evidence_quote=S["body"]
            )
        ],
    )
    validate_evidence(output, S["body"], [S])
    with pytest.raises(InvalidEvidence):
        validate_evidence(output, "unrelated", [S])


def test_exact_rules_and_contrast():
    rule = {
        **S,
        "rule_type": "forbidden_term",
        "config": {"term": "best", "replacement": "helpful"},
    }
    issues, deps = deterministic("The BEST product. " + S["body"], [S, rule], {})
    assert issues[0].quote == "BEST" and issues[0].correction == "helpful"
    assert len(deps) == 1
    assert contrast("#000000", "#ffffff") == 21
    assert retrieve("unrelated", [S]) == []


async def test_missing_provider_is_blocked(monkeypatch):
    monkeypatch.setattr(settings(), "ai_model", "")
    with pytest.raises(ProviderUnavailable, match="not configured"):
        await provider_analysis("content", [])
