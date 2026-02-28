"""Helper for unified LLM calls using LiteLLM."""

import litellm
from state import LLMConfig
from config import OPENAI_API_KEY, OPENAI_MODEL, GEMINI_API_KEY, MISTRAL_API_KEY

async def call_llm(messages: list[dict], response_format=None, llm_config: LLMConfig | None = None, **kwargs):
    """Unified async completion call supporting OpenAI, Gemini, and Mistral."""
    config = llm_config or LLMConfig()
    
    if config.provider == "gemini":
        # Ensure litellm knows it's gemini
        model = config.model if config.model.startswith("gemini/") else f"gemini/{config.model}"
        api_key = config.api_key or GEMINI_API_KEY
    elif config.provider == "mistral":
        model = config.model if config.model.startswith("mistral/") else f"mistral/{config.model}"
        api_key = config.api_key or MISTRAL_API_KEY
    else:
        model = config.model or OPENAI_MODEL
        api_key = config.api_key or OPENAI_API_KEY
        
    response = await litellm.acompletion(
        model=model,
        messages=messages,
        api_key=api_key,
        response_format=response_format,
        **kwargs
    )
    return response

