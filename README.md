# 📝 Research Paper Assistant

Multi-agent AI system that generates, validates, and refines academic research papers with visual quality review.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Planner    │────▶│   Drafter    │────▶│   Citation    │
└─────────────┘     └──────────────┘     └───────┬───────┘
                                                  │
                    ┌──────────────┐     ┌───────▼───────┐
                    │   Graph      │◀────│   Validator   │
                    │   Agent      │     └───────┬───────┘
                    └──────────────┘             │
                    ┌──────────────┐     ┌───────▼───────┐
                    │Visual Review │◀────│   Improver    │
                    └──────────────┘     └───────────────┘
```

**Refinement Loop**: Validate → (Graph?) → Improve → Review → repeat if score < 85

## Quick Start

### 1. Environment Setup

```bash
# Create .env in backend/
cp .env.example backend/.env
# Edit backend/.env and add your OpenAI API key
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Demo

1. Enter a research topic (e.g. *"The Impact of Large Language Models on Scientific Discovery"*)
2. Click **Generate Paper** — watch the agents work in real time
3. Navigate to the **Editor** to see sections, citations, and validation flags
4. Use the **Refine** input to send instructions like *"Make it more technical"*
5. Check the **Review** page for quality scores, radar chart, and before/after diff

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python · FastAPI · OpenAI API |
| Frontend | React · Vite |
| Graphs | matplotlib |
| Streaming | Server-Sent Events (SSE) |
| State | Pydantic models |

## Project Structure

```
backend/
  agents/            # 7 specialized AI agents
  orchestrator.py    # Multi-pass refinement loop
  state.py           # Pydantic data models
  config.py          # Environment config
  main.py            # FastAPI app
frontend/
  src/
    pages/           # Home, Editor, Review
    components/      # RadarChart, QualityGauge, AgentStatus
```
