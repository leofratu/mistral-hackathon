"""Visual Review Agent — produces quality scores and publication readiness assessment."""

import json
from llm_helper import call_llm
from state import DraftVersion, ReviewResult, ReviewScores, Critique, LLMConfig

SYSTEM_PROMPT = """You are a journal editor evaluating a research paper for publication readiness.

Return ONLY valid JSON:
{
  "overall_score": 75,
  "scores": {
    "clarity": 80,
    "rigor": 70,
    "novelty": 65,
    "coherence": 85,
    "citation_completeness": 60
  },
  "publication_readiness": 0.65,
  "summary": "Brief assessment of the paper's strengths and weaknesses...",
  "key_improvements": "What would most improve this paper..."
}

Scoring guide (each 0-100):
- clarity: How clear and well-written is the paper?
- rigor: How methodologically sound and evidence-based?
- novelty: How original and innovative are the contributions?
- coherence: How well do sections flow together?
- citation_completeness: How well are claims supported with citations?
- overall_score: Weighted average (rigor and clarity weighted more heavily)
- publication_readiness: 0.0 to 1.0 probability of acceptance at a good journal"""


async def run(
    draft: DraftVersion,
    critique: Critique | None = None,
    previous_draft: DraftVersion | None = None,
    llm_config: LLMConfig | None = None,
) -> ReviewResult:
    """Evaluate the draft and return quality scores."""
    
    draft_text = "\n\n".join(f"## {s.title}\n{s.content}" for s in draft.sections)
    user_msg = f"Evaluate this academic paper:\n\n{draft_text}"
    
    if critique:
        user_msg += f"\n\nPrevious critique issues count: {len(critique.issues)}"
    
    response = await call_llm(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
        llm_config=llm_config,
    )
    
    data = json.loads(response.choices[0].message.content)
    
    scores = ReviewScores(**data.get("scores", {}))
    
    before_snapshot = ""
    after_snapshot = ""
    if previous_draft:
        before_snapshot = "\n\n".join(
            f"## {s.title}\n{s.content[:300]}..." for s in previous_draft.sections
        )
    after_snapshot = "\n\n".join(
        f"## {s.title}\n{s.content[:300]}..." for s in draft.sections
    )
    
    return ReviewResult(
        overall_score=data.get("overall_score", 50),
        scores=scores,
        publication_readiness=data.get("publication_readiness", 0.5),
        summary=data.get("summary", "") + "\n\n" + data.get("key_improvements", ""),
        before_snapshot=before_snapshot,
        after_snapshot=after_snapshot,
    )
