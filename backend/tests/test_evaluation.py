"""Labeled exact-rule fixtures; intentionally not a semantic/model benchmark."""
import json
from pathlib import Path
import pytest
from app.checks import deterministic
from app.ai import validate_evidence
from app.schemas import AnalysisOutput

CASES = json.loads((Path(__file__).parents[1] / 'evaluation/deterministic-cases.json').read_text())['cases']

@pytest.mark.parametrize('case', CASES, ids=lambda case: case['id'])
def test_labeled_exact_rule(case):
    source = {'id': '00000000-0000-4000-8000-000000000001', 'rule_type': case['rule_type'], 'body': case['body'], 'config': case['config']}
    issues, dependencies = deterministic(case['text'], [source], case.get('metadata', {}))
    warnings = sorted(i.category for i in issues if i.severity != 'info')
    assert warnings == sorted(case['warnings'])
    assert len(dependencies) == case['dependencies']
    validate_evidence(AnalysisOutput(issues=issues, dependencies=dependencies), case['text'], [source])


def test_retrieve_keeps_matching_fact_inside_limited_ai_context():
    """Regression: long unrelated rules must not crowd out a relevant fact."""
    from app.checks import retrieve

    fact = {
        "id": "00000000-0000-4000-8000-000000000021",
        "rule_type": "fact",
        "body": "Demo camera price is ₹1,999.",
        "config": {"subject": "Demo camera price", "value": "₹1,999"},
    }
    rules = [
        {
            "id": f"00000000-0000-4000-8000-00000000003{i}",
            "rule_type": "tone",
            "body": "Write thoughtfully. " + str(i) * 15000,
            "config": {},
        }
        for i in (1, 2)
    ]
    selected = retrieve(
        "Demo camera price is ₹2,499.",
        rules + [fact],
        max_chars=30000,
    )
    assert selected[0]["id"] == fact["id"]
    assert any(s["id"] == fact["id"] for s in selected)

    # Exact rule checks stay independent of bounded semantic retrieval.
    issues, dependencies = deterministic(
        "Demo camera price is ₹2,499.", rules + [fact], {}
    )
    assert any(i.category == "fact" for i in issues)
    assert len(dependencies) == 1


def test_retrieve_prefers_matching_fact_when_relevance_ties():
    from app.checks import retrieve

    text = "Demo camera is available."
    fact = {"id": "fact", "rule_type": "fact", "body": "Demo camera has a warranty."}
    tone = {"id": "tone", "rule_type": "tone", "body": "Demo camera voice should be warm."}
    assert [s["id"] for s in retrieve(text, [tone, fact])][:2] == [
        "fact", "tone",
    ]
