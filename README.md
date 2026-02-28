<div align="center">
  <img src="https://avatars.githubusercontent.com/u/132992940?v=4" alt="Mistral AI Logo" width="120" style="border-radius: 20px; margin-bottom: 20px;"/>
  <h1>Synthesix: Autonomous Research Orchestration Engine</h1>
  <p><em>A multi-agent AI system that generates, validates, and refines academic research papers with visual quality review and autonomous data visualization.</em></p>
  
  > 🏆 **Submitted for the Mistral AI Hackathon** | **Coded by Mistral AI** 🏆
</div>

---

## 🚀 The Vision: Why We Built Synthesix

Writing high-quality academic research requires rigorous planning, drafting, citing, critical peer-review, and complex data visualization. **Single-prompt LLM interactions inevitably fall short**—producing shallow, hallucinated content without structural integrity or verifiable empirical data.

**Synthesix solves this by simulating an entire academic research laboratory within a single application.**

Powered by Mistral AI, it employs a synchronized team of **7 specialized AI agents** working within a continuous refinement loop. Instead of a single zero-shot generation, Synthesix critically reviews its own work, injects strict academic citations, validates logic, generates corresponding data visualizations via raw Python code execution, and iteratively improves the text before rendering a final visual quality score.

---

## ✨ Standout Features

- 🧠 **7-Agent Orchestration graph:** Distinct AI personas (Planner, Drafter, Citation, Validator, Graph, Improver, Visual Review) working in synergy.
- 📊 **Autonomous Python Data Visualization:** The Graph Agent acts as a data scientist. It reads the paper, and securely writes & executes raw Python `matplotlib` code to dynamically generate tailored quantitative charts (Line, Bar, Scatter, Pie).
- 🔄 **Self-Healing Iterative Refinement Loop:** The system iterates on the draft (Validate → Graph → Improve → Review). If it fails its own rigorous internal quality checks, it triggers another autonomous refinement pass.
- 🖥️ **Premium Real-time Streaming UI:** A sleek, Cursor-inspired Dark Mode frontend that parses Server-Sent Events (SSE). Watch the agents "think", collaborate, and write in real-time.
- 🔀 **Unified Multi-LLM Routing:** Engineered with a custom abstraction layer to dynamically fetch and switch between models from **Mistral AI**, **Google Gemini**, and **OpenAI**. Configure your preferred provider instantly.

---

## 🤖 Meet the Lab (The Agents)

1. 📋 **The Planner:** Takes the initial user topic and constructs a rigorous academic outline (`Abstract`, `Introduction`, `Methods`, `Results`, `Discussion`, `Conclusion`).
2. ✍️ **The Drafter:** Expands the outline into a full academic draft, ensuring scholarly tone and logical flow.
3. 📚 **The Citation Agent:** Scours the text to inject precise academic markers, formatting, and standardizes references.
4. 🧐 **The Validator (Peer Reviewer):** Scrutinizes the draft for logic gaps, weak claims, or inconsistencies.
5. 📈 **The Graph Agent:** Analyzes the empirical claims and autonomously writes/executes Python code to generate synthetic, publication-quality PNG charts.
6. 🛠️ **The Improver:** Ingests the validator's strict critiques and iteratively refines the prose to elevate the quality.
7. 🎯 **The Visual Reviewer:** Analyzes the final iteration and scores it across 5 axes (*Clarity, Depth, Citations, Logic, Formatting*), rendering a dynamic Radar Chart.

```text
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Planner    │────▶│   Drafter    │────▶│   Citation    │
└─────────────┘     └──────────────┘     └───────┬───────┘
                                                  │
                    ┌──────────────┐     ┌───────▼───────┐
                    │ Graph Agent  │◀────│   Validator   │
                    │ (Exec Python)│     └───────┬───────┘
                    └──────────────┘             │
                    ┌──────────────┐     ┌───────▼───────┐
                    │Visual Review │◀────│   Improver    │
                    └──────────────┘     └───────────────┘
```

---

## 🛠️ The Tech Stack

| Architecture Layer | Capabilities |
|-----------|-------------|
| **Core AI Logic** | **Mistral API** (Primary Engine), LiteLLM (Unified LLM abstraction forcing structured JSON outputs) |
| **Backend Engine** | Python, FastAPI, Asynchronous Server-Sent Events (SSE) |
| **Frontend UI** | React, Vite (Reactive UI with custom animations and realtime SSE parsing) |
| **Data Viz**| `matplotlib`, `numpy` (Secure Python execution sandbox for graph generation), Recharts (Frontend Radar charts) |
| **Data Modeling** | Pydantic (Strict schema enforcement across the multi-agent graph) |

---

## 🏁 Quick Start & Setup

### 1. Clone & Core Setup

```bash
git clone https://github.com/leofratu/mistral-hackathon.git
cd mistral-hackathon

# Setup backend environment
cp backend/.env.example backend/.env
# Add API keys to .env (MISTRAL_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY)
```

### 2. Launch the Backend (FastAPI Engine)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the async server on port 8000
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Launch the Frontend (React Application)

In a new terminal:

```bash
cd frontend
npm install

# Start the dev server on port 5173
npm run dev -- --port 5173
```

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎮 Evaluating the Demo (Judges Guide)

1. **Configure the Engine:** Navigate to the `/settings` tab. Select **Mistral AI**, pick a dynamic model (e.g., `mistral-large-latest`), and ensure your API key is active.
2. **Initiate the Lab:** On the Home page, input a specialized topic like *"The Efficacy of Transformer Architectures in Genomic Sequencing"* and click **Generate ↵**.
3. **Observe the Pipeline:** Watch the real-time progress bar. The Agent Status UI will update via SSE as the system plans, drafts, validates, graphs, and refines the paper autonomously.
4. **Interactive Editor:** Once compilation concludes, you are redirected to the Editor. Review the generated sections, citations, and the **dynamically generated PNG charts**.
5. **Quality Review:** Click the **Review** tab to analyze the Quality Radar Chart, scoring the paper across 5 critical axes.
6. **Multi-Turn Refinement:** Use the Editor's refinement input to ask the agents to selectively revise specific paragraphs interactively.

---
<div align="center">
  <i>Generated papers are for demonstration purposes and utilize synthesized empirical data.</i>
</div>
