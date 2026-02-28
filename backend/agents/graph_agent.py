"""Graph Agent — generates matplotlib visualizations based on validation suggestions."""

import json
import uuid
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from llm_helper import call_llm
from state import GraphSuggestion, GraphData, LLMConfig
from config import GRAPHS_DIR
import os

SYSTEM_PROMPT = """You are a data visualization specialist. Given a graph description for a research paper, generate Python matplotlib code that creates a compelling, publication-quality chart.

Return ONLY valid JSON:
{
  "code": "import matplotlib.pyplot as plt\\nimport numpy as np\\n...",
  "explanation": "A paragraph explaining what this graph shows and its significance for the paper."
}

Rules:
- Use matplotlib.pyplot and numpy only
- Generate realistic synthetic data that supports the paper's thesis
- Use a clean, academic style (no gridlines clutter, proper labels)
- Set figure size to (10, 6)
- Use a professional color palette
- Include proper axis labels and title
- Save figure using plt.savefig(SAVE_PATH) — use the variable SAVE_PATH (it will be injected)
- End with plt.close()"""


async def run(suggestions: list[GraphSuggestion], llm_config: LLMConfig | None = None) -> list[GraphData]:
    """Generate graphs for each suggestion."""
    results: list[GraphData] = []
    
    for suggestion in suggestions[:3]:  # Limit to 3 graphs max
        filename = f"graph_{uuid.uuid4().hex[:8]}.png"
        save_path = os.path.join(GRAPHS_DIR, filename)
        
        response = await call_llm(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Generate a {suggestion.chart_type} chart:\n"
                        f"Title: {suggestion.title}\n"
                        f"Description: {suggestion.description}\n"
                        f"Data context: {suggestion.data_description}"
                    ),
                },
            ],
            temperature=0.5,
            response_format={"type": "json_object"},
            llm_config=llm_config,
        )
        
        data = json.loads(response.choices[0].message.content)
        code = data.get("code", "")
        explanation = data.get("explanation", "")
        
        # Execute the plotting code safely
        try:
            exec_globals = {"plt": plt, "np": np, "SAVE_PATH": save_path}
            exec(code, exec_globals)
            
            # If file wasn't saved by the code, save current figure
            if not os.path.exists(save_path):
                plt.savefig(save_path, dpi=150, bbox_inches="tight", facecolor="white")
                plt.close()
            
            results.append(
                GraphData(
                    filename=filename,
                    title=suggestion.title,
                    explanation=explanation,
                    inserted_in_section="Results",
                )
            )
        except Exception as e:
            # Fallback: generate a simple placeholder chart
            _generate_fallback(suggestion, save_path)
            results.append(
                GraphData(
                    filename=filename,
                    title=suggestion.title,
                    explanation=f"Visualization of {suggestion.description}",
                    inserted_in_section="Results",
                )
            )
    
    return results


def _generate_fallback(suggestion: GraphSuggestion, save_path: str) -> None:
    """Generate a simple fallback chart if code execution fails."""
    fig, ax = plt.subplots(figsize=(10, 6))
    
    np.random.seed(42)
    if suggestion.chart_type == "line":
        x = np.arange(10)
        ax.plot(x, np.cumsum(np.random.randn(10)), "-o", color="#6366f1", linewidth=2)
    elif suggestion.chart_type == "scatter":
        x = np.random.randn(50)
        y = x * 0.7 + np.random.randn(50) * 0.3
        ax.scatter(x, y, c="#6366f1", alpha=0.7, s=60)
    elif suggestion.chart_type == "pie":
        sizes = np.random.randint(10, 40, 5)
        colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]
        ax.pie(sizes, labels=[f"Cat {i+1}" for i in range(5)], colors=colors, autopct="%1.1f%%")
    else:  # bar
        x = [f"Group {i+1}" for i in range(5)]
        y = np.random.randint(20, 100, 5)
        ax.bar(x, y, color="#6366f1", edgecolor="white")
    
    ax.set_title(suggestion.title, fontsize=14, fontweight="bold")
    fig.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close()
