"""Improvement Agent — refines clarity, transitions, tone, and redundancy."""

import json
from llm_helper import call_llm
from state import DraftVersion, Section, Critique, LLMConfig

SYSTEM_PROMPT = """You are an expert academic editor. Improve the draft based on the critique provided.

Return ONLY valid JSON:
{
  "sections": [
    {"title": "Section Title", "content": "Improved text...", "order": 0},
    ...
  ]
}

Improvement guidelines:
- Fix issues identified in the critique
- Improve clarity and readability
- Strengthen transitions between paragraphs and sections
- Make the tone consistently academic and formal
- Reduce redundancy
- Strengthen weak arguments
- Preserve citation markers like [REF1]
- Maintain the paper's core arguments and findings"""


async def run(
    draft: DraftVersion,
    critique: Critique,
    refinement_instructions: list[str] | None = None,
    llm_config: LLMConfig | None = None,
) -> DraftVersion:
    """Improve the draft based on critique and user instructions."""
    
    draft_text = json.dumps(
        {"sections": [s.model_dump() for s in draft.sections]}, indent=2
    )
    critique_text = json.dumps(critique.model_dump(), indent=2)
    
    user_msg = (
        f"Improve this draft based on the critique:\n\n"
        f"DRAFT:\n{draft_text}\n\n"
        f"CRITIQUE:\n{critique_text}"
    )
    
    if refinement_instructions:
        user_msg += "\n\nAdditional instructions from the user:\n" + "\n".join(
            f"- {i}" for i in refinement_instructions
        )
    
    response = await call_llm(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.5,
        response_format={"type": "json_object"},
        llm_config=llm_config,
    )
    
    data = json.loads(response.choices[0].message.content)
    sections = [Section(**s) for s in data.get("sections", [])]
    return DraftVersion(version=draft.version + 1, sections=sections)
