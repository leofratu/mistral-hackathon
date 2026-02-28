<div align="center">
  <img src="https://avatars.githubusercontent.com/u/132992940?v=4" alt="Mistral AI Logo" width="120" style="border-radius: 20px; margin-bottom: 20px;"/>
  <h1>Synthesix: Autonomous Research Orchestration Engine</h1>
  <p><em>A multi-agent AI system that generates, validates, and refines academic research papers with visual quality review and autonomous data visualization.</em></p>
  
  > ✨ **Built for the Mistral AI Hackathon** | **Coded by Mistral AI** ✨
</div>

---

## 🚀 The Vision

Writing high-quality academic research requires planning, drafting, citing, critical review, and data visualization. Single-prompt LLM interactions often fall short, producing shallow or hallucinated content without rigorous structural integrity or verifiable data representation.

**Synthesix** solves this by mimicking a real academic research lab. It employs a synchronized team of **7 specialized AI agents** working within a continuous refinement loop to autonomously generate publication-quality research drafts. Instead of a single zero-shot generation, Synthesix critically reviews its own work, injects academic citations, validates logic, generates corresponding data visualizations via raw Python code execution, and iteratively improves the text.

## ✨ Key Features

- **Multi-Agent Orchestration:** 7 distinct AI personas (Planner, Drafter, Citation, Validator, Graph, Improver, Visual Review) working in synergy.
- **Autonomous Data Visualization:** The Graph Agent acts as a data scientist, securely writing and executing Python `matplotlib` code to dynamically generate quantitative charts (Line, Bar, Scatter, Pie) tailored to the generated research.
- **Iterative Refinement Loop:** The system iterates on the draft (Validate → Graph → Improve → Review). If the internal quality score falls below the threshold, it triggers another refinement pass.
- **Premium Real-time Streaming UI:** A sleek, Cursor-inspired Dark Mode frontend that streams real-time Server-Sent Events (SSE). Watch the agents "think", collaborate, and work in real-time.
- **Unified Multi-LLM Routing:** Dynamically fetch and switch between models from **Mistral AI**, **Google Gemini**, and **OpenAI**. Configure your preferred provider and API key directly in the UI.
- **Safe Demo "Streamer Mode":** Safely present the application live; Streamer Mode hides your API keys replacing them with a secure lock UI.

## 🧠 Meet the Agents

Synthesix is powered by a graph of highly specialized agents:

1. **The Planner:** Takes the initial user topic and constructs a rigorous academic outline (Abstract, Introduction, Methods, Results, Discussion, Conclusion).
2. **The Drafter:** Expands the outline into a full academic draft, ensuring scholarly tone and logical flow.
3. **The Citation Agent:** Injects rigorous academic markers, formatting, and standardizes references.
4. **The Validator:** Scrutinizes the draft for logic gaps, weak claims, or inconsistencies, acting as a peer reviewer.
5. **The Graph Agent:** Analyzes the paper's data points and autonomously writes/executes Python code to generate synthetic, publication-quality quantitative charts.
6. **The Improver:** Takes the validator's critiques and iteratively refines the text to elevate the quality.
7. **The Visual Reviewer:** Analyzes the final iteration and scores it across 5 axes (Clarity, Depth, Citations, Logic, Formatting), rendering a dynamic Radar Chart.

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
*The Refinement Loop: Validate → (Graph Generation) → Improve → Review.*

## 🛠️ Tech Stack

| Component | Technology | Description |
|-----------|-----------|-------------|
| **Core AI** | Mistral API (Primary), LiteLLM | Unified LLM abstraction forcing structured JSON outputs |
| **Backend** | Python, FastAPI | Asynchronous server streaming SSE events |
| **Frontend** | React, Vite | Reactive UI with custom animations and SSE parsing |
| **UI Components**| Lucide React, Recharts | Dynamic icons and quality Radar charts |
| **Visualization**| `matplotlib`, `numpy` | Autonomous Python execution for graph generation |
| **Data Models** | Pydantic | Strict schema enforcement across the agent graph |

## 🏁 Quick Start

### 1. Environment Setup

Clone the repository and set up your backend environment variables:

```bash
git clone https://github.com/leofratu/mistral-hackathon.git
cd mistral-hackathon

# Setup backend environment
cp backend/.env.example backend/.env
# Edit backend/.env and add default API keys (MISTRAL_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY)
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

1. **Configure Models:** Go to the `/settings` tab. Select **Mistral AI** (or another provider), pick a dynamic model (e.g., `mistral-large-latest`), and ensure your API key is set. Toggle on *Streamer Mode* if presenting.
2. **Start Generation:** On the Home page, enter a research topic like *"Quantum Computing in Drug Discovery"* and click **Generate ↵**.
3. **Watch the Process:** Observe the real-time progress bar and agent event logs as the system plans, drafts, and refines the paper.
4. **Interactive Editor:** Once complete, you will be redirected to the Editor to view the generated sections, citations, and any dynamically generated charts.
5. **Quality Review:** Click the "Review" tab to see a Quality Radar Chart scoring the paper across 5 axes (Clarity, Depth, Citations, Logic, Formatting) along with high-level critiques.
6. **Refine:** Use the refinement input in the Editor to ask the agents to revise specific parts of the paper interactively.

---
<div align="center">
  <i>Submitted for the Mistral AI Hackathon. Generated papers are for demonstration purposes and use synthetic data.</i>
</div>
