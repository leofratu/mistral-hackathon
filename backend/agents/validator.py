"""Validation Agent — reviews a draft for issues and suggests graphs."""

import json
from llm_helper import call_llm
from state import DraftVersion, Critique, Issue, GraphSuggestion, LLMConfig

SYSTEM_PROMPT = """You are a rigorous academic peer reviewer. Analyze the draft and identify issues.

Return ONLY valid JSON:
{
  "issues": [
    {
      "section": "Section Title",
      "text": "Description of the issue",
      "type": "unsupported_claim | missing_citation | logical_gap | overgeneralization",
      "severity": "low | medium | high"
    }
  ],
  "severity_score": 5,
  "needs_graph": true,
  "graph_suggestions": [
    {
      "title": "Graph Title",
      "description": "What this graph would show",
      "chart_type": "bar | line | scatter | pie",
      "data_description": "Description of data to visualize"
    }
  ]
}

Be thorough but constructive. severity_score is 1-10 (10 = most severe issues).
Set needs_graph to true if the paper would benefit from visual data representation.
Suggest specific, relevant graphs that would strengthen the paper."""


async def run(draft: DraftVersion, llm_config: LLMConfig | None = None) -> Critique:
    """Validate the draft and return structured critique."""
    
    draft_text = "\n\n".join(f"## {s.title}\n{s.content}" for s in draft.sections)
    
    response = await call_llm(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this academic paper draft:\n\n{draft_text}"},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
        llm_config=llm_config,
    )
    
    data = json.loads(response.choices[0].message.content)
    
    issues = [Issue(**i) for i in data.get("issues", [])]
    graph_suggestions = [GraphSuggestion(**g) for g in data.get("graph_suggestions", [])]
    
    return Critique(
        issues=issues,
        severity_score=data.get("severity_score", 5),
        needs_graph=data.get("needs_graph", False),
        graph_suggestions=graph_suggestions,
    )
