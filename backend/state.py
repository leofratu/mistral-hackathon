"""Pydantic models for the structured paper state passed between agents."""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class LLMConfig(BaseModel):
    provider: str = "openai"  # openai, gemini, mistral
    model: str = "gpt-4o-mini"
    api_key: Optional[str] = None


class Section(BaseModel):
    title: str
    content: str
    order: int = 0


class OutlineSection(BaseModel):
    title: str
    key_points: list[str] = Field(default_factory=list)
    order: int = 0


class Outline(BaseModel):
    title: str
    sections: list[OutlineSection] = Field(default_factory=list)


class Issue(BaseModel):
    section: str
    text: str
    type: str  # unsupported_claim | missing_citation | logical_gap | overgeneralization
    severity: str = "medium"  # low | medium | high


class GraphSuggestion(BaseModel):
    title: str
    description: str
    chart_type: str = "bar"  # bar | line | scatter | pie | heatmap
    data_description: str = ""


class Critique(BaseModel):
    issues: list[Issue] = Field(default_factory=list)
    severity_score: int = 5  # 1-10
    needs_graph: bool = False
    graph_suggestions: list[GraphSuggestion] = Field(default_factory=list)


class GraphData(BaseModel):
    filename: str
    title: str
    explanation: str
    inserted_in_section: str = "Results"


class ReviewScores(BaseModel):
    clarity: int = 0
    rigor: int = 0
    novelty: int = 0
    coherence: int = 0
    citation_completeness: int = 0


class ReviewResult(BaseModel):
    overall_score: int = 0  # 1-100
    scores: ReviewScores = Field(default_factory=ReviewScores)
    publication_readiness: float = 0.0  # 0-1
    summary: str = ""
    before_snapshot: str = ""
    after_snapshot: str = ""


class DraftVersion(BaseModel):
    version: int
    sections: list[Section] = Field(default_factory=list)


class PaperState(BaseModel):
    session_id: str = ""
    topic: str = ""
    outline: Optional[Outline] = None
    draft_versions: list[DraftVersion] = Field(default_factory=list)
    critiques: list[Critique] = Field(default_factory=list)
    graphs: list[GraphData] = Field(default_factory=list)
    score_history: list[int] = Field(default_factory=list)
    current_agent: str = ""
    iteration: int = 0
    max_iterations: int = 3
    is_complete: bool = False
    refinement_instructions: list[str] = Field(default_factory=list)
    review: Optional[ReviewResult] = None
    llm_config: Optional[LLMConfig] = None

    @property
    def latest_draft(self) -> Optional[DraftVersion]:
        return self.draft_versions[-1] if self.draft_versions else None

    @property
    def latest_critique(self) -> Optional[Critique]:
        return self.critiques[-1] if self.critiques else None

    @property
    def latest_score(self) -> int:
        return self.score_history[-1] if self.score_history else 0
