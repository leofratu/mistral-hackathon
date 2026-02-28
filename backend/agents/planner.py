"""Planner Agent — converts a topic into a structured paper outline."""

import json
from llm_helper import call_llm
from state import Outline, OutlineSection, LLMConfig

SYSTEM_PROMPT = """You are a research paper planning specialist. Given a topic, produce a structured outline for an academic paper.

Return ONLY valid JSON in this exact format:
{
  "title": "Paper Title",
  "sections": [
    {"title": "Abstract", "key_points": ["point1", "point2"], "order": 0},
    {"title": "Introduction", "key_points": [...], "order": 1},
    {"title": "Literature Review", "key_points": [...], "order": 2},
    {"title": "Methods", "key_points": [...], "order": 3},
    {"title": "Results", "key_points": [...], "order": 4},
    {"title": "Discussion", "key_points": [...], "order": 5},
    {"title": "Conclusion", "key_points": [...], "order": 6}
  ]
}

Make the key points specific, insightful, and academically rigorous."""


async def run(topic: str, refinement_instructions: list[str] | None = None, llm_config: LLMConfig | None = None) -> Outline:
    """Generate a structured outline for the given topic."""
    
    user_msg = f"Create a detailed academic paper outline for the following topic:\n\n{topic}"
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
    sections = [OutlineSection(**s) for s in data.get("sections", [])]
    return Outline(title=data.get("title", topic), sections=sections)
