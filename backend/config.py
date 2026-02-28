"""Application configuration — all secrets from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL: str = os.environ.get("OPENAI_MODEL", "gpt-4o")
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
MISTRAL_API_KEY: str = os.environ.get("MISTRAL_API_KEY", "")
MAX_ITERATIONS: int = int(os.environ.get("MAX_ITERATIONS", "3"))
QUALITY_THRESHOLD: int = int(os.environ.get("QUALITY_THRESHOLD", "85"))
GRAPHS_DIR: str = os.path.join(os.path.dirname(__file__), "generated_graphs")

os.makedirs(GRAPHS_DIR, exist_ok=True)
