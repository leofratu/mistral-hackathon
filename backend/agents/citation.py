"""Citation Agent — marks statements requiring references and inserts placeholders."""

import json
from llm_helper import call_llm
from state import DraftVersion, Section, LLMConfig
try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

SYSTEM_PROMPT = """You are an academic citation specialist. Your job is to inject REAL citations into the provided draft.
I will give you the draft text and a list of REAL WORLD SEARCH RESULTS related to the paper's topic.

Return ONLY valid JSON:
{
  "sections": [
    {"title": "Section Title", "content": "Text with [1] inserted where citations are needed...", "order": 0},
    ...
    {"title": "References", "content": "[1] Author/Title - URL\\n[2] Author/Title - URL", "order": 99}
  ]
}

Rules:
- You MUST use the provided REAL WORLD SEARCH RESULTS to find citations.
- Insert [1], [2], etc. for each reference directly sourced from the search results.
- Replace vague claims with specific facts from the search snippets if applicable.
- Number citations sequentially across the entire paper.
- Place citations after specific claims, statistics, and referenced findings.
- Do NOT add citations to the Abstract.
- Maintain the original text quality while adding citations.
- Create a new final section named 'References' containing the mapped citations with their Titles and URLs. Ensure it has "order": 99 so it appears at the end.
"""

def get_search_context(topic: str) -> str:
    if not DDGS:
        return "No real-time search results available (duckduckgo-search not installed)."
    try:
        results = DDGS().text(f"{topic} academic research", max_results=5)
        context = "REAL WORLD SEARCH RESULTS TO USE FOR CITATIONS:\n\n"
        for i, res in enumerate(results):
            context += f"[{i+1}] Title: {res.get('title')}\n    Snippet: {res.get('body')}\n    URL: {res.get('href')}\n\n"
        return context
    except Exception as e:
        print(f"[CitationAgent] Search error: {e}")
        return "No real-time search results available."


async def run(draft: DraftVersion, topic: str, llm_config: LLMConfig | None = None) -> DraftVersion:
    """Search the web and add real citations to the draft."""
    
    # 1. Fetch real-world citations from the web
    search_context = get_search_context(topic)
    
    draft_text = json.dumps(
        {"sections": [s.model_dump() for s in draft.sections]}, indent=2
    )
    
    user_prompt = f"Topic: {topic}\n\n{search_context}\n\nAdd citations to this draft:\n\n{draft_text}"
    
    response = await call_llm(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
        llm_config=llm_config,
    )
    
    data = json.loads(response.choices[0].message.content)
    sections = [Section(**s) for s in data.get("sections", [])]
    return DraftVersion(version=draft.version, sections=sections)
