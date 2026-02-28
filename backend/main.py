"""FastAPI application — REST + SSE endpoints for the Research Paper Assistant."""

import asyncio
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import GRAPHS_DIR
from orchestrator import generate_paper, refine_paper
from state import PaperState, LLMConfig

# ── In-memory session store (sufficient for MVP) ─────────────────
sessions: dict[str, PaperState] = {}

app = FastAPI(title="Research Paper Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated graph images
app.mount("/graphs", StaticFiles(directory=GRAPHS_DIR), name="graphs")


# ── Request / response models ────────────────────────────────────
class GenerateRequest(BaseModel):
    topic: str
    llm_config: LLMConfig | None = None


class RefineRequest(BaseModel):
    instruction: str
    llm_config: LLMConfig | None = None


# ── Endpoints ─────────────────────────────────────────────────────
@app.post("/api/generate")
async def api_generate(req: GenerateRequest):
    """Start paper generation — returns SSE stream."""
    if not req.topic.strip():
        raise HTTPException(400, "Topic is required")
    
    async def event_stream():
        state_holder: dict = {}
        async for event in generate_paper(req.topic, llm_config=req.llm_config):
            # Capture session & persist state from final event
            if event["event"] == "session_start":
                sid = event["data"]["session_id"]
                state_holder["sid"] = sid
            elif event["event"] == "complete":
                sid = state_holder.get("sid", "")
                # Re-create state from final data for session persistence
                _persist_state(sid, event["data"])
            
            yield f"data: {json.dumps(event)}\n\n"
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/status/{session_id}")
async def api_status(session_id: str):
    """Get current state of a paper session."""
    state = sessions.get(session_id)
    if not state:
        raise HTTPException(404, "Session not found")
    return _serialize_state(state)


@app.post("/api/refine/{session_id}")
async def api_refine(session_id: str, req: RefineRequest):
    """Refine an existing paper with user instruction — returns SSE stream."""
    state = sessions.get(session_id)
    if not state:
        raise HTTPException(404, "Session not found")
    
    async def event_stream():
        async for event in refine_paper(state, req.instruction, llm_config=req.llm_config):
            if event["event"] == "complete":
                _persist_state(session_id, event["data"])
            yield f"data: {json.dumps(event)}\n\n"
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ── Helpers ───────────────────────────────────────────────────────
def _persist_state(session_id: str, data: dict) -> None:
    """Persist paper state from serialized data (lightweight MVP approach)."""
    from state import (
        PaperState, Outline, OutlineSection, DraftVersion, Section,
        Critique, Issue, GraphSuggestion, GraphData, ReviewResult, ReviewScores,
    )
    
    outline = None
    if data.get("outline"):
        outline = Outline(**data["outline"])
    
    draft_versions = []
    if data.get("draft"):
        draft_versions.append(DraftVersion(**data["draft"]))
    
    critiques = [Critique(**c) for c in data.get("critiques", [])]
    graphs = [GraphData(**g) for g in data.get("graphs", [])]
    
    review = None
    if data.get("review"):
        review = ReviewResult(**data["review"])
    
    state = PaperState(
        session_id=session_id,
        topic=data.get("topic", ""),
        outline=outline,
        draft_versions=draft_versions,
        critiques=critiques,
        graphs=graphs,
        score_history=data.get("score_history", []),
        iteration=data.get("iterations", 0),
        is_complete=data.get("is_complete", True),
        review=review,
    )
    sessions[session_id] = state


def _serialize_state(state: PaperState) -> dict:
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
