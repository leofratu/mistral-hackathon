"""Citation Agent — marks statements requiring references and inserts placeholders."""

import json
from llm_helper import call_llm
from state import DraftVersion, Section, LLMConfig

SYSTEM_PROMPT = """You are a citation specialist. Review each section of the paper and insert placeholder citations where references are needed.

Return ONLY valid JSON:
{
  "sections": [
    {"title": "Section Title", "content": "Text with [REF1] inserted where citations are needed...", "order": 0},
    ...
  ]
}

Rules:
- Insert [REF1], [REF2], etc. for each unique needed reference
- Place citations after specific claims, statistics, and referenced findings
- Do NOT add citations to the Abstract
- Maintain the original text quality while adding citations
- Number citations sequentially across the entire paper
- Focus on: empirical claims, methodological references, comparative statements, and theoretical frameworks"""


async def run(draft: DraftVersion, llm_config: LLMConfig | None = None) -> DraftVersion:
    """Add citation placeholders to the draft."""
    
    draft_text = json.dumps(
        {"sections": [s.model_dump() for s in draft.sections]}, indent=2
    )
    
    response = await call_llm(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Add citation placeholders to this draft:\n\n{draft_text}"},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
        llm_config=llm_config,
    )
    
    data = json.loads(response.choices[0].message.content)
    sections = [Section(**s) for s in data.get("sections", [])]
    return DraftVersion(version=draft.version, sections=sections)
