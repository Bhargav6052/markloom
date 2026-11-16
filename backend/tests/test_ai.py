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


class GeminiClient:
    """In-memory HTTP stub; no real Google requests are sent."""

    def __init__(self, outcomes):
        self.outcomes = iter(outcomes)
        self.attempts = 0

    async def post(self, url, *, headers, json):
        import httpx

        self.attempts += 1
        result = next(self.outcomes)
        if isinstance(result, Exception):
            raise result
        return httpx.Response(
            status_code=result,
            request=httpx.Request("POST", url),
            json={"candidates": []},
        )


async def test_gemini_retries_503_then_succeeds(monkeypatch):
    from app import ai

    delays = []

    async def fast_sleep(seconds):
        delays.append(seconds)

    monkeypatch.setattr(ai.asyncio, "sleep", fast_sleep)
    client = GeminiClient([503, 503, 200])
    result = await ai._gemini_request(
        client, "https://generativelanguage.googleapis.com/test", "test-key", {}
    )
    assert result.status_code == 200
    assert client.attempts == 3
    assert delays == [2, 4]


async def test_gemini_exhausts_retries_and_raises(monkeypatch):
    import httpx
    from app import ai

    delays = []

    async def fast_sleep(seconds):
        delays.append(seconds)

    monkeypatch.setattr(ai.asyncio, "sleep", fast_sleep)
    client = GeminiClient([503, 503, 503])
    with pytest.raises(httpx.HTTPStatusError) as err:
        await ai._gemini_request(client, "https://example.test/gemini", "key", {})
    assert err.value.response.status_code == 503
    assert client.attempts == 3
    assert delays == [2, 4]


async def test_gemini_does_not_retry_bad_request(monkeypatch):
    import httpx
    from app import ai

    async def no_sleep(_):
        raise AssertionError("Bad requests must not be retried")

    monkeypatch.setattr(ai.asyncio, "sleep", no_sleep)
    client = GeminiClient([400])
    with pytest.raises(httpx.HTTPStatusError) as err:
        await ai._gemini_request(client, "https://example.test/gemini", "key", {})
    assert err.value.response.status_code == 400
    assert client.attempts == 1


async def test_gemini_retries_transient_timeout(monkeypatch):
    import httpx
    from app import ai

    delays = []

    async def fast_sleep(seconds):
        delays.append(seconds)

    monkeypatch.setattr(ai.asyncio, "sleep", fast_sleep)
    client = GeminiClient([httpx.ConnectTimeout("temporary timeout"), 200])
    result = await ai._gemini_request(client, "https://example.test/gemini", "key", {})
    assert result.status_code == 200
    assert client.attempts == 2
    assert delays == [2]
