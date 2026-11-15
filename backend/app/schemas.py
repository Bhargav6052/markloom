from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class Command(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: str = Field(min_length=1, max_length=60)
    data: dict = Field(default_factory=dict)


class Issue(BaseModel):
    model_config = ConfigDict(extra="forbid")
    category: Literal[
        "tone",
        "terminology",
        "claim",
        "messaging",
        "visual",
        "accessibility",
        "disclaimer",
        "fact",
    ]
    severity: Literal["info", "warning", "critical"]
    quote: str = Field(max_length=4000)
    explanation: str = Field(min_length=1, max_length=4000)
    source_id: UUID | None
    evidence_quote: str = Field(max_length=4000)
    evidence_status: Literal[
        "SUPPORTED", "CONTRADICTED", "INSUFFICIENT_EVIDENCE", "NOT_APPLICABLE"
    ]
    correction: str = Field(max_length=10000)


class Dependency(BaseModel):
    model_config = ConfigDict(extra="forbid")
    quote: str = Field(min_length=1, max_length=4000)
    fact_version_id: UUID
    evidence_quote: str = Field(min_length=1, max_length=4000)


class AnalysisOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    issues: list[Issue] = Field(max_length=100)
    dependencies: list[Dependency] = Field(max_length=200)
