"""Drafting Agent — expands an outline into a full academic draft."""

import json
from llm_helper import call_llm
from state import Outline, DraftVersion, Section, LLMConfig

SYSTEM_PROMPT = """You are an expert academic writer. Given a paper outline, write a complete academic draft.

Return ONLY valid JSON in this format:
{
  "sections": [
    {"title": "Section Title", "content": "Full section text...", "order": 0},
    ...
  ]
}

Guidelines:
- Write in formal academic tone
- Each section should be 2-4 substantial paragraphs
- Use specific terminology appropriate for the field
- Include logical transitions between sections
- The Abstract should be a concise summary (150-250 words)
- Methods should be detailed and reproducible
- Results should present findings clearly
- Discussion should interpret results and compare to existing work"""


async def run(
    outline: Outline,
    version: int = 1,
    refinement_instructions: list[str] | None = None,
    previous_draft: DraftVersion | None = None,
    llm_config: LLMConfig | None = None,
) -> DraftVersion:
    """Expand the outline into a full draft."""
    
    outline_text = json.dumps(outline.model_dump(), indent=2)
    user_msg = f"Write a complete academic paper based on this outline:\n\n{outline_text}"
    
    if previous_draft:
        prev_text = "\n\n".join(f"## {s.title}\n{s.content}" for s in previous_draft.sections)
        user_msg += f"\n\nPrevious draft for reference (improve upon it):\n{prev_text}"
    
    if refinement_instructions:
        user_msg += "\n\nAdditional instructions:\n" + "\n".join(f"- {i}" for i in refinement_instructions)
    
    response = await call_llm(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.7,
        response_format={"type": "json_object"},
        llm_config=llm_config,
    )
    
    data = json.loads(response.choices[0].message.content)
    sections = [Section(**s) for s in data.get("sections", [])]
    return DraftVersion(version=version, sections=sections)
