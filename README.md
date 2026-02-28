<div align="center">
  <img src="https://mistral.ai/images/logo.svg" alt="Mistral AI Logo" width="200" style="margin-bottom: 20px;"/>
  <h1>Synthesix: Autonomous Research Orchestration Engine</h1>
  <p><em>A multi-agent AI system that generates, validates, and refines academic research papers with visual quality review and autonomous data visualization.</em></p>
  
  > ✨ **Created with Mistral AI / Coded by Mistral AI** ✨
</div>

---

## 🚀 Overview

**Synthesix** is an end-to-end academic research and visualization pipeline powered by a flexible, multi-provider LLM backend. It employs a synchronized team of 7 specialized AI agents working within a continuous refinement loop to autonomously generate publication-quality research drafts.

Instead of a single zero-shot generation, Synthesix critically reviews its own work, injects academic citations, validates logic, generates corresponding data visualizations via raw Python code execution, and iteratively improves the text.

## ✨ Key Features

- **Multi-Agent Orchestration:** 7 distinct AI personas (Planner, Drafter, Citation, Validator, Graph, Improver, Visual Review) working in synergy.
- **Autonomous Data Visualization:** The Graph Agent acts as a data scientist, securely writing and executing Python `matplotlib` code to dynamically generate quantitative charts tailored to the generated research.
- **Continuous Refinement Loop:** The system iterates on the draft (Validate → Graph → Improve → Review) until high quality is achieved.
- **Real-time Streaming UI:** A sleek, premium Dark Mode frontend (inspired by modern developer tools) that streams real-time Server-Sent Events (SSE) so you can watch the agents "think" and work.
- **Multi-LLM Flexibility:** Dynamically fetch and switch between models from **Mistral**, **Google Gemini**, and **OpenAI**. Configure your preferred provider and API key directly in the UI.
- **Streamer Mode:** Safely demo the application; Streamer Mode hides your API keys with a secure lock UI.

## 🧠 Architecture

```text
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
*The Refinement Loop: Validate → (Graph Generation) → Improve → Review → Repeat.*

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Python, FastAPI, LiteLLM |
| **Frontend** | React, Vite, Lucide React (Icons), Recharts (Radar Chart) |
| **Visualization**| `matplotlib`, `numpy` (Autonomous execution) |
| **Communication**| Server-Sent Events (SSE) for real-time streaming |
| **Data Models** | Pydantic |

## 🏁 Quick Start

### 1. Environment Setup

Clone the repository and set up your backend environment variables:

```bash
git clone https://github.com/leofratu/mistral-hackathon.git
cd mistral-hackathon

# Setup backend environment
cp backend/.env.example backend/.env
# Edit backend/.env and add API keys (MISTRAL_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY)
```
*(Note: You can also enter API keys directly in the frontend Settings UI).*

### 2. Run the Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the server on port 8000
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Run the Frontend (React / Vite)

In a new terminal:

```bash
cd frontend
npm install

# Start the dev server on port 5173
npm run dev -- --port 5173
```

### 4. Open Application
Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

## 🎮 How to Use the Demo

1. **Configure Models:** Go to the `/settings` tab. Select **Mistral**, pick a model (e.g., `mistral-large-latest`), and ensure your API key is set.
2. **Start Generation:** On the Home page, enter a research topic like *"Quantum Computing in Drug Discovery"* and click **Generate**.
3. **Watch the Process:** Observe the real-time progress bar and agent event logs as the system plans, drafts, and refines the paper.
4. **Interactive Editor:** Once complete, you will be redirected to the Editor to view the generated sections, citations, and any dynamically generated charts.
5. **Quality Review:** Click the "Review" tab to see a Quality Radar Chart scoring the paper across 5 axes (Clarity, Depth, Citations, Logic, Formatting) along with high-level critiques.
6. **Refine:** Use the refinement input in the Editor to ask the agents to revise specific parts of the paper.

---
<div align="center">
  <i>Built during the Mistral AI Hackathon.</i>
</div>
