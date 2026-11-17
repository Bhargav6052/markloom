"""Synthetic, offline dependency fixtures. No provider or production DB access."""

import json
from copy import deepcopy

import httpx
import pytest
from pydantic import ValidationError

from app import ai, analysis
from app.config import settings
from app.schemas import AnalysisOutput, Dependency, Issue

FACT_ID = "00000000-0000-4000-8000-000000000011"
PARENT_ID = "00000000-0000-4000-8000-000000000012"
OTHER_ID = "00000000-0000-4000-8000-000000000013"
TEXT = "The platform has 4 stages."
EVIDENCE = "The platform has four stages."
FACT = {
    "id": FACT_ID,
    "source_id": PARENT_ID,
    "body": EVIDENCE,
    "rule_type": "fact",
    "config": {"classification": "PUBLIC"},
}


def result(**changes):
    return {
        "issues": [],
        "dependencies": [
            {
                "quote": TEXT,
                "fact_version_id": FACT_ID,
                "evidence_quote": EVIDENCE,
                **changes,
            }
        ],
    }


@pytest.mark.parametrize(
    "changes,source,reason",
    [
        ({"fact_version_id": PARENT_ID}, FACT, ai.DependencyReason.UNKNOWN_VERSION),
        ({"fact_version_id": OTHER_ID}, FACT, ai.DependencyReason.UNKNOWN_VERSION),
        ({}, {**FACT, "rule_type": "tone"}, ai.DependencyReason.NOT_FACT),
        ({"quote": EVIDENCE}, FACT, ai.DependencyReason.CONTENT_QUOTE),
        (
            {"quote": "The platform offers 4 stages."},
            FACT,
            ai.DependencyReason.CONTENT_QUOTE,
        ),
        (
            {"quote": "the platform has 4 stages."},
            FACT,
            ai.DependencyReason.CONTENT_QUOTE,
        ),
        (
            {"quote": "The platform has 4 stages!"},
            FACT,
            ai.DependencyReason.CONTENT_QUOTE,
        ),
        (
            {"quote": "The platform has  4 stages."},
            FACT,
            ai.DependencyReason.CONTENT_QUOTE,
        ),
        ({"evidence_quote": TEXT}, FACT, ai.DependencyReason.EVIDENCE_QUOTE),
        (
            {"evidence_quote": "Invented evidence."},
            FACT,
            ai.DependencyReason.EVIDENCE_QUOTE,
        ),
    ],
)
def test_dependency_reasons(changes, source, reason, caplog):
    with pytest.raises(ai.InvalidFactDependency) as failure:
        ai.validate_evidence(
            AnalysisOutput.model_validate(result(**changes)), TEXT, [source]
        )
    assert failure.value.reason == reason
    assert failure.value.index == 0
    assert reason.value in caplog.text
    for private in (TEXT, EVIDENCE, FACT_ID, PARENT_ID, OTHER_ID):
        assert private not in caplog.text
        assert private not in str(failure.value)


def test_verbatim_distinct_number_spellings_are_valid():
    ai.validate_evidence(AnalysisOutput.model_validate(result()), TEXT, [FACT])


@pytest.mark.parametrize(
    "field,value",
    [("quote", ""), ("evidence_quote", ""), ("fact_version_id", "not-a-uuid")],
)
def test_pydantic_rejects_malformed_dependency(field, value):
    with pytest.raises(ValidationError):
        AnalysisOutput.model_validate(result(**{field: value}))


def test_validator_rejects_empty_quotes_even_if_model_construction_bypassed():
    for field, reason in [
        ("quote", ai.DependencyReason.CONTENT_QUOTE),
        ("evidence_quote", ai.DependencyReason.EVIDENCE_QUOTE),
    ]:
        dep = Dependency.model_construct(**result(**{field: ""})["dependencies"][0])
        with pytest.raises(ai.InvalidFactDependency) as failure:
            ai.validate_evidence(
                AnalysisOutput(issues=[], dependencies=[dep]), TEXT, [FACT]
            )
        assert failure.value.reason == reason


def test_source_in_snapshot_but_not_selection_is_rejected():
    snapshot = [FACT, {**FACT, "id": OTHER_ID}]
    with pytest.raises(ai.InvalidFactDependency):
        ai.validate_evidence(
            AnalysisOutput.model_validate(result()), TEXT, snapshot[1:]
        )


def test_schema_keeps_previous_compatible_shape_for_all_source_selections():
    sources = [FACT, {**FACT, "id": OTHER_ID, "rule_type": "tone"}]
    original = deepcopy(sources)
    baseline = deepcopy(ai.GEMINI_JSON_SCHEMA)
    for selection in (sources, [], sources[1:], [FACT]):
        schema = ai.gemini_schema(selection)
        assert schema == baseline
        deps = schema["properties"]["dependencies"]
        assert "maxItems" not in deps
        assert "enum" not in deps["items"]["properties"]["fact_version_id"]
        assert set(deps["items"]["required"]) == {
            "quote",
            "fact_version_id",
            "evidence_quote",
        }
    assert sources == original


@pytest.fixture
def provider(monkeypatch):
    cfg = settings()
    monkeypatch.setattr(cfg, "ai_provider", "gemini")
    monkeypatch.setattr(cfg, "ai_model", "offline-test-model")
    monkeypatch.setattr(cfg, "gemini_api_key", "offline-test-secret")
    original_client = httpx.AsyncClient
    calls = []

    async def no_delay(_):
        pass

    monkeypatch.setattr(ai.asyncio, "sleep", no_delay)

    def install(responses, hook=None):
        def respond(request):
            calls.append(request)
            if hook:
                hook(len(calls))
            value = responses[min(len(calls) - 1, len(responses) - 1)]
            if isinstance(value, int):
                return httpx.Response(
                    value, json={"error": {"message": "private upstream text"}}
                )
            return httpx.Response(
                200,
                json={
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {
                                        "text": value
                                        if isinstance(value, str)
                                        else json.dumps(value)
                                    }
                                ]
                            }
                        }
                    ]
                },
            )

        transport = httpx.MockTransport(respond)
        monkeypatch.setattr(
            ai.httpx,
            "AsyncClient",
            lambda **kw: original_client(transport=transport, **kw),
        )
        return calls

    return install


async def test_first_valid_response_is_not_retried(provider):
    calls = provider([result()])
    output = await ai.provider_analysis(TEXT, [FACT])
    assert len(calls) == 1
    assert len(output.dependencies) == 1


async def test_one_retry_keeps_context_model_and_schema(provider, monkeypatch, caplog):
    sources = deepcopy([FACT])

    def mutate_after_request(number):
        if number == 1:
            monkeypatch.setattr(settings(), "ai_model", "must-not-be-used")
            sources[0]["body"] = "must-not-be-sent"

    calls = provider([result(evidence_quote=TEXT), result()], mutate_after_request)
    output = await ai.provider_analysis(TEXT, sources)
    assert len(calls) == 2
    assert output.dependencies[0].evidence_quote == EVIDENCE
    first, second = [json.loads(c.content) for c in calls]
    assert calls[0].url == calls[1].url
    assert "offline-test-model" in str(calls[1].url)
    assert first["contents"] == second["contents"]
    assert first["generationConfig"] == second["generationConfig"]
    instructions = second["systemInstruction"]["parts"][0]["text"]
    assert ai.DependencyReason.EVIDENCE_QUOTE.value in instructions
    assert "exact contiguous substring" in instructions
    assert "do not normalize or paraphrase" in instructions
    for private in (TEXT, EVIDENCE, FACT_ID, "offline-test-secret", "must-not-be-sent"):
        assert private not in caplog.text
    assert caplog.records
    assert all(r.exc_info is None for r in caplog.records)


@pytest.mark.parametrize(
    "changes",
    [
        {"evidence_quote": TEXT},
        {"quote": EVIDENCE},
        {"fact_version_id": PARENT_ID},
        {"fact_version_id": OTHER_ID},
    ],
)
async def test_retry_failure_is_not_discarded_or_retried_again(provider, changes):
    calls = provider([result(**changes)])
    with pytest.raises(ai.InvalidFactDependency):
        await ai.provider_analysis(TEXT, [FACT])
    assert len(calls) == 2


@pytest.mark.parametrize(
    "response", [400, 503, "{not json", json.dumps(result(quote=""))]
)
async def test_non_dependency_transport_or_structure_failures_do_not_regenerate(
    provider, response
):
    calls = provider([response])
    with pytest.raises(ai.ProviderUnavailable):
        await ai.provider_analysis(TEXT, [FACT])
    assert len(calls) == (3 if response == 503 else 1)


async def test_issue_evidence_failure_is_not_retried(provider):
    output = result()
    output["issues"] = [
        Issue(
            category="fact",
            severity="warning",
            quote="invented",
            explanation="test",
            source_id=None,
            evidence_quote="",
            evidence_status="INSUFFICIENT_EVIDENCE",
            correction="",
        ).model_dump(mode="json")
    ]
    calls = provider([output])
    with pytest.raises(ai.InvalidEvidence, match="passage absent"):
        await ai.provider_analysis(TEXT, [FACT])
    assert len(calls) == 1


class Repo:
    def __init__(self):
        self.calls = []

    async def rpc(self, name, **params):
        self.calls.append((name, params))
        if name == "begin_analysis":
            return {"id": "run", "source_snapshot": [FACT]}
        if name == "authorize_ai_transfer":
            return "event"
        return {"status": params.get("p_status")}

    async def rows(self, name, **params):
        assert name == "content_versions"
        return [{"body": TEXT, "metadata": {"classification": "PUBLIC"}}]

    async def request(self, method, path, **params):
        self.calls.append((path, params))


@pytest.fixture
def preflight(monkeypatch):
    async def allowed(*args):
        return {"allowed": True, "categories": ["PUBLIC"], "reasons": []}

    monkeypatch.setattr(analysis, "preflight", allowed)


JOB = {
    "org_id": "org",
    "actor": "actor",
    "content_version_id": "version",
    "external_consent": True,
}


@pytest.mark.parametrize("success", [True, False])
async def test_process_only_persists_valid_complete_output(
    provider, preflight, success
):
    calls = provider(
        [
            result(evidence_quote=TEXT),
            result() if success else result(evidence_quote=TEXT),
        ]
    )
    repo = Repo()
    if success:
        output = await analysis.process_analysis(JOB, repo)
        assert output["status"] == "complete"
    else:
        with pytest.raises(
            ai.ProviderUnavailable, match="DEPENDENCY_EVIDENCE_QUOTE_MISMATCH"
        ):
            await analysis.process_analysis(JOB, repo)
    assert len(calls) == 2
    assert sum(name == "authorize_ai_transfer" for name, _ in repo.calls) == 1
    finishes = [p for name, p in repo.calls if name == "finish_analysis"]
    assert len(finishes) == 1
    assert finishes[0]["p_status"] == ("complete" if success else "error")
    if success:
        assert len(finishes[0]["p_output"]["dependencies"]) == 1
    else:
        assert finishes[0]["p_output"] == {}
        assert any(p.get("json", {}).get("status") == "failed" for _, p in repo.calls)
    assert not any(
        name in ("decide", "submit", "activate_source") for name, _ in repo.calls
    )


@pytest.mark.parametrize("consent,allowed", [(False, True), (True, False)])
async def test_no_provider_attempt_without_privacy_authorization(
    provider, monkeypatch, consent, allowed
):
    async def decision(*args):
        return {"allowed": allowed, "categories": ["CONFIDENTIAL"], "reasons": []}

    monkeypatch.setattr(analysis, "preflight", decision)
    calls = provider([result()])
    repo = Repo()
    await analysis.process_analysis({**JOB, "external_consent": consent}, repo)
    assert not calls
    assert not any(name == "authorize_ai_transfer" for name, _ in repo.calls)


async def test_merged_deterministic_dependency_still_validated(
    provider, preflight, monkeypatch
):
    provider([{"issues": [], "dependencies": []}])
    invalid = AnalysisOutput.model_validate(
        result(fact_version_id=OTHER_ID)
    ).dependencies
    monkeypatch.setattr(analysis, "deterministic", lambda *args: ([], invalid))
    repo = Repo()
    with pytest.raises(ai.ProviderUnavailable, match="DEPENDENCY_UNKNOWN_FACT_VERSION"):
        await analysis.process_analysis(JOB, repo)
    assert [p["p_status"] for name, p in repo.calls if name == "finish_analysis"] == [
        "error"
    ]


def test_numeric_comparison_limitations_do_not_relax_quote_validation():
    from app.checks import deterministic

    cases = [
        (FACT, TEXT, 0, 0),
        (
            {**FACT, "config": {"subject": "The platform has", "value": "four"}},
            TEXT,
            1,
            1,
        ),
        (
            {
                **FACT,
                "body": TEXT,
                "config": {"subject": "The platform has", "value": "4"},
            },
            EVIDENCE,
            0,
            0,
        ),
    ]
    for source, text, issue_count, dep_count in cases:
        issues, deps = deterministic(text, [source], {})
        assert (len(issues), len(deps)) == (issue_count, dep_count)
        ai.validate_evidence(
            AnalysisOutput(issues=issues, dependencies=deps), text, [source]
        )


async def test_nonfact_dependency_regenerates_once(provider):
    tone = {**FACT, "id": OTHER_ID, "rule_type": "tone"}
    calls = provider([result(fact_version_id=OTHER_ID), result()])
    output = await ai.provider_analysis(TEXT, [FACT, tone])
    assert len(calls) == 2
    assert str(output.dependencies[0].fact_version_id) == FACT_ID
    retry = json.loads(calls[1].content)
    assert (
        ai.DependencyReason.NOT_FACT.value
        in retry["systemInstruction"]["parts"][0]["text"]
    )


async def test_retry_does_not_bypass_new_issue_failure(provider):
    bad = result()
    bad["issues"] = [
        Issue(
            category="fact",
            severity="warning",
            quote="invented",
            explanation="test",
            source_id=None,
            evidence_quote="",
            evidence_status="INSUFFICIENT_EVIDENCE",
            correction="",
        ).model_dump(mode="json")
    ]
    calls = provider([result(evidence_quote=TEXT), bad])
    with pytest.raises(ai.InvalidEvidence, match="passage absent"):
        await ai.provider_analysis(TEXT, [FACT])
    assert len(calls) == 2


async def test_no_fact_context_requires_empty_dependencies(provider):
    calls = provider([{"issues": [], "dependencies": []}])
    output = await ai.provider_analysis(TEXT, [])
    assert output.dependencies == []
    request = json.loads(calls[0].content)
    assert request["generationConfig"]["responseJsonSchema"] == ai.GEMINI_JSON_SCHEMA


async def test_openai_adapter_is_not_changed_by_gemini_regeneration(monkeypatch):
    cfg = settings()
    monkeypatch.setattr(cfg, "ai_provider", "openai")
    monkeypatch.setattr(cfg, "ai_model", "offline-test-model")
    monkeypatch.setattr(cfg, "openai_api_key", "offline-test-secret")
    requests = []
    original_client = httpx.AsyncClient

    def respond(request):
        requests.append(request)
        return httpx.Response(
            200,
            json={
                "output": [
                    {"content": [{"type": "output_text", "text": json.dumps(result())}]}
                ]
            },
        )

    monkeypatch.setattr(
        ai.httpx,
        "AsyncClient",
        lambda **kw: original_client(transport=httpx.MockTransport(respond), **kw),
    )
    output = await ai.provider_analysis(TEXT, [FACT])
    assert len(requests) == 1
    payload = json.loads(requests[0].content)
    assert payload["instructions"] == ai.SYSTEM
    assert payload["text"]["format"]["schema"] == AnalysisOutput.model_json_schema()
    ai.validate_evidence(output, TEXT, [FACT])


async def test_transient_recovery_and_dependency_regeneration_share_budget(provider):
    calls = provider([503, result(evidence_quote=TEXT), result()])
    output = await ai.provider_analysis(TEXT, [FACT])
    assert len(calls) == 3
    assert output.dependencies[0].evidence_quote == EVIDENCE
    payloads = [json.loads(c.content) for c in calls]
    assert all(p["contents"] == payloads[0]["contents"] for p in payloads)
    assert all(c.url == calls[0].url for c in calls)


async def test_regeneration_transient_failure_cannot_multiply_requests(provider):
    calls = provider([result(evidence_quote=TEXT), 503])
    with pytest.raises(ai.ProviderUnavailable, match="after 3 attempts"):
        await ai.provider_analysis(TEXT, [FACT])
    assert len(calls) == ai.GEMINI_MAX_ATTEMPTS == 3


async def test_spent_transport_budget_rejects_invalid_dependency_without_more_requests(
    provider,
):
    calls = provider([503, 503, result(evidence_quote=TEXT)])
    with pytest.raises(ai.InvalidFactDependency):
        await ai.provider_analysis(TEXT, [FACT])
    assert len(calls) == ai.GEMINI_MAX_ATTEMPTS == 3


def test_compatible_schema_is_request_local():
    baseline = deepcopy(ai.GEMINI_JSON_SCHEMA)
    request_schema = ai.gemini_schema([FACT])
    request_schema["properties"]["dependencies"]["maxItems"] = 0
    request_schema["properties"]["dependencies"]["items"]["properties"][
        "fact_version_id"
    ]["enum"] = [OTHER_ID]
    assert ai.GEMINI_JSON_SCHEMA == baseline
    assert ai.gemini_schema([]) == baseline
    assert ai.gemini_schema([FACT]) == baseline


def test_remote_correction_safety_instructions_remain_present():
    assert "[[DELETE]]" in ai.SYSTEM
    assert "exact replacement passage ready for publication" in ai.SYSTEM
    assert "Never introduce unsupported facts" in ai.SYSTEM


async def test_compatible_request_omits_regressed_grammar_constraints(provider):
    # This is an offline compatibility sentinel, not a claim about live Gemini.
    # Reject the exact schema additions from PR #9 before serving a valid fixture.
    calls = provider([result()])
    original_request = ai._gemini_request

    async def compatible_request(client, url, key, payload, **kwargs):
        schema = payload["generationConfig"]["responseJsonSchema"]
        deps = schema["properties"]["dependencies"]
        assert "maxItems" not in deps
        assert "enum" not in deps["items"]["properties"]["fact_version_id"]
        assert schema == ai.GEMINI_JSON_SCHEMA
        return await original_request(client, url, key, payload, **kwargs)

    from unittest.mock import patch

    with patch.object(ai, "_gemini_request", compatible_request):
        output = await ai.provider_analysis(TEXT, [FACT])
    assert len(calls) == 1
    assert len(output.dependencies) == 1


async def test_no_fact_context_still_rejects_dependency_and_exhausts_one_regeneration(
    provider,
):
    calls = provider([result()])
    with pytest.raises(ai.InvalidFactDependency) as failure:
        await ai.provider_analysis(TEXT, [])
    assert failure.value.reason == ai.DependencyReason.UNKNOWN_VERSION
    assert len(calls) == 2


def test_dependency_count_limit_remains_in_pydantic():
    output = result()
    output["dependencies"] *= 201
    with pytest.raises(ValidationError):
        AnalysisOutput.model_validate(output)


def test_preserved_provider_classification_enums():
    schema = ai.gemini_schema([FACT])
    issue = schema["properties"]["issues"]["items"]["properties"]
    assert issue["severity"]["enum"] == ["info", "warning", "critical"]
    assert issue["evidence_status"]["enum"] == [
        "SUPPORTED",
        "CONTRADICTED",
        "INSUFFICIENT_EVIDENCE",
        "NOT_APPLICABLE",
    ]
