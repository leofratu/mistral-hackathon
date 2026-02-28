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
        try:
            async for event in generate_paper(req.topic, llm_config=req.llm_config):
                # Capture session & persist state from final event
                if event["event"] == "session_start":
                    sid = event["data"]["session_id"]
                    state_holder["sid"] = sid
                elif event["event"] == "complete":
                    sid = state_holder.get("sid", "")
                    _persist_state(sid, event["data"])
                
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            error_msg = str(e)
            if len(error_msg) > 300:
                error_msg = error_msg[:300] + "..."
            yield f"data: {json.dumps({'event': 'error', 'data': {'message': error_msg}})}\n\n"
    
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
        try:
            async for event in refine_paper(state, req.instruction, llm_config=req.llm_config):
                if event["event"] == "complete":
                    _persist_state(session_id, event["data"])
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            error_msg = str(e)
            if len(error_msg) > 300:
                error_msg = error_msg[:300] + "..."
            yield f"data: {json.dumps({'event': 'error', 'data': {'message': error_msg}})}\n\n"
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/models/{provider}")
async def list_models(provider: str):
    """Return available models for a given LLM provider."""
    models = {
        "openai": [
            {"id": "gpt-4o", "name": "GPT-4o", "description": "Most capable, multimodal"},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "description": "Fast and affordable"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "description": "High intelligence, long context"},
            {"id": "gpt-4", "name": "GPT-4", "description": "Original GPT-4"},
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "description": "Fast, legacy"},
            {"id": "o1", "name": "o1", "description": "Reasoning model"},
            {"id": "o1-mini", "name": "o1 Mini", "description": "Fast reasoning"},
            {"id": "o3-mini", "name": "o3 Mini", "description": "Latest reasoning, efficient"},
        ],
        "gemini": [
            {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "description": "Most capable, latest"},
            {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "description": "Fast and intelligent"},
            {"id": "gemini-2.5-flash-lite", "name": "Gemini 2.5 Flash Lite", "description": "Ultra-fast, lightweight"},
            {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "description": "Previous gen fast model"},
            {"id": "gemini-2.0-flash-lite", "name": "Gemini 2.0 Flash Lite", "description": "Previous gen lightweight"},
            {"id": "gemini-3.1-pro-preview", "name": "Gemini 3.1 Pro Preview", "description": "Cutting-edge preview"},
            {"id": "gemini-3-pro-preview", "name": "Gemini 3 Pro Preview", "description": "Next-gen preview"},
            {"id": "gemini-3-flash-preview", "name": "Gemini 3 Flash Preview", "description": "Next-gen fast preview"},
        ],
        "mistral": [
            {"id": "mistral-large-latest", "name": "Mistral Large", "description": "Flagship model"},
            {"id": "mistral-medium-latest", "name": "Mistral Medium", "description": "Balanced performance"},
            {"id": "mistral-small-latest", "name": "Mistral Small", "description": "Fast and efficient"},
            {"id": "open-mistral-nemo", "name": "Mistral Nemo", "description": "Open-weight, 12B"},
            {"id": "codestral-latest", "name": "Codestral", "description": "Optimized for code"},
            {"id": "open-mixtral-8x22b", "name": "Mixtral 8x22B", "description": "MoE, open-weight"},
            {"id": "open-mixtral-8x7b", "name": "Mixtral 8x7B", "description": "MoE, fast"},
            {"id": "mistral-tiny", "name": "Mistral Tiny", "description": "Fastest, lowest cost"},
        ],
    }
    return {"provider": provider, "models": models.get(provider, [])}


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
