"""Orchestrator — controls the multi-pass refinement loop across all agents."""

import asyncio
import uuid
from typing import AsyncGenerator
import json

from state import PaperState, DraftVersion, LLMConfig
from config import MAX_ITERATIONS, QUALITY_THRESHOLD
from agents import planner, drafter, validator, citation, improver, graph_agent, visual_review


async def generate_paper(topic: str, llm_config: LLMConfig | None = None) -> AsyncGenerator[dict, None]:
    """Run the full paper-generation pipeline, yielding SSE events."""
    state = PaperState(
        session_id=str(uuid.uuid4()),
        topic=topic,
        max_iterations=MAX_ITERATIONS,
    )
    
    yield _event("session_start", {"session_id": state.session_id})
    
    # ── Step 1: Plan ──────────────────────────────────────────────
    state.current_agent = "planner"
    yield _event("agent_start", {"agent": "planner", "message": "Creating paper outline..."})
    
    state.outline = await planner.run(topic, llm_config=llm_config)
    yield _event("agent_done", {
        "agent": "planner",
        "result": state.outline.model_dump(),
    })
    
    # ── Step 2: Draft ─────────────────────────────────────────────
    state.current_agent = "drafter"
    yield _event("agent_start", {"agent": "drafter", "message": "Writing initial draft..."})
    
    draft = await drafter.run(state.outline, version=1, llm_config=llm_config)
    state.draft_versions.append(draft)
    yield _event("agent_done", {
        "agent": "drafter",
        "result": {"version": draft.version, "section_count": len(draft.sections)},
    })
    
    # ── Step 3: Citation ──────────────────────────────────────────
    state.current_agent = "citation"
    yield _event("agent_start", {"agent": "citation", "message": "Searching web and adding citations..."})
    
    cited_draft = await citation.run(draft, state.topic, llm_config=llm_config)
    state.draft_versions[-1] = cited_draft
    yield _event("agent_done", {"agent": "citation", "result": {"version": cited_draft.version}})
    
    # ── Refinement Loop ───────────────────────────────────────────
    for iteration in range(MAX_ITERATIONS):
        state.iteration = iteration + 1
        yield _event("iteration_start", {"iteration": state.iteration, "max": MAX_ITERATIONS})
        
        current_draft = state.latest_draft
        
        # Validate
        state.current_agent = "validator"
        yield _event("agent_start", {"agent": "validator", "message": f"Reviewing draft (pass {state.iteration})..."})
        
        crit = await validator.run(current_draft, llm_config=llm_config)
        state.critiques.append(crit)
        yield _event("agent_done", {
            "agent": "validator",
            "result": crit.model_dump(),
        })
        
        # Graph generation (if suggested)
        if crit.needs_graph and crit.graph_suggestions:
            state.current_agent = "graph_agent"
            yield _event("agent_start", {"agent": "graph_agent", "message": "Generating visualizations..."})
            
            graphs = await graph_agent.run(crit.graph_suggestions, llm_config=llm_config)
            state.graphs.extend(graphs)
            yield _event("agent_done", {
                "agent": "graph_agent",
                "result": [g.model_dump() for g in graphs],
            })
        
        # Improve
        state.current_agent = "improver"
        yield _event("agent_start", {"agent": "improver", "message": f"Improving draft (pass {state.iteration})..."})
        
        previous_draft = current_draft
        improved = await improver.run(
            current_draft,
            crit,
            refinement_instructions=state.refinement_instructions,
            llm_config=llm_config,
        )
        state.draft_versions.append(improved)
        yield _event("agent_done", {
            "agent": "improver",
            "result": {"version": improved.version, "section_count": len(improved.sections)},
        })
        
        # Review
        state.current_agent = "visual_review"
        yield _event("agent_start", {"agent": "visual_review", "message": "Evaluating quality..."})
        
        review = await visual_review.run(improved, crit, previous_draft, llm_config=llm_config)
        state.review = review
        state.score_history.append(review.overall_score)
        yield _event("agent_done", {
            "agent": "visual_review",
            "result": review.model_dump(),
        })
        
        yield _event("iteration_done", {
            "iteration": state.iteration,
            "score": review.overall_score,
            "publication_readiness": review.publication_readiness,
        })
        
        # Stop if quality threshold reached
        if review.overall_score >= QUALITY_THRESHOLD:
            break
    
    state.is_complete = True
    state.current_agent = ""
    yield _event("complete", _serialize_final_state(state))


async def refine_paper(state: PaperState, instruction: str, llm_config: LLMConfig | None = None) -> AsyncGenerator[dict, None]:
    """Run a refinement pass with user instruction."""
    state.refinement_instructions.append(instruction)
    state.is_complete = False
    
    yield _event("refine_start", {"instruction": instruction})
    
    current_draft = state.latest_draft
    if not current_draft:
        yield _event("error", {"message": "No draft to refine"})
        return
    
    # 1. Improve with user instruction (using the most recent critique as context)
    state.current_agent = "improver"
    yield _event("agent_start", {"agent": "improver", "message": f"Applying: {instruction[:60]}..."})
    
    previous_draft = current_draft
    last_critique = state.critiques[-1] if state.critiques else None
    
    # We must pass a Critique if the improver expects one, but it handles None or we can pass last_critique
    # Wait, improver expects `critique: Critique`. Let's pass last_critique. If None, it might crash, but in our pipeline, critique always exists.
    # In improver.py: async def run(draft: DraftVersion, critique: Critique, ...)
    improved = await improver.run(current_draft, last_critique, refinement_instructions=[instruction], llm_config=llm_config)
    state.draft_versions.append(improved)
    yield _event("agent_done", {"agent": "improver", "result": {"version": improved.version}})
    
    # 2. Re-validate the NEW draft
    state.current_agent = "validator"
    yield _event("agent_start", {"agent": "validator", "message": "Re-reviewing the updated draft..."})
    crit = await validator.run(improved, llm_config=llm_config)
    state.critiques.append(crit)
    yield _event("agent_done", {"agent": "validator", "result": crit.model_dump()})
    
    # 3. Generate new graphs if the new draft needs them
    if crit.needs_graph and crit.graph_suggestions:
        state.current_agent = "graph_agent"
        yield _event("agent_start", {"agent": "graph_agent", "message": "Generating visualizations..."})
        graphs = await graph_agent.run(crit.graph_suggestions, llm_config=llm_config)
        state.graphs.extend(graphs)
        yield _event("agent_done", {"agent": "graph_agent", "result": [g.model_dump() for g in graphs]})
    
    # 4. Final Review
    state.current_agent = "visual_review"
    yield _event("agent_start", {"agent": "visual_review", "message": "Re-evaluating quality..."})
    review = await visual_review.run(improved, crit, previous_draft, llm_config=llm_config)
    state.review = review
    state.score_history.append(review.overall_score)
    yield _event("agent_done", {"agent": "visual_review", "result": review.model_dump()})
    
    state.is_complete = True
    state.current_agent = ""
    yield _event("complete", _serialize_final_state(state))


def _event(event_type: str, data: dict) -> dict:
    return {"event": event_type, "data": data}


def _serialize_final_state(state: PaperState) -> dict:
    return {
        "session_id": state.session_id,
        "topic": state.topic,
        "outline": state.outline.model_dump() if state.outline else None,
        "draft": state.latest_draft.model_dump() if state.latest_draft else None,
        "critiques": [c.model_dump() for c in state.critiques],
        "graphs": [g.model_dump() for g in state.graphs],
        "score_history": state.score_history,
        "review": state.review.model_dump() if state.review else None,
        "iterations": state.iteration,
        "is_complete": state.is_complete,
    }
