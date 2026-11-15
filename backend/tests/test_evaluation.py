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
