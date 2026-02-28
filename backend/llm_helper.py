"""Helper for unified LLM calls using LiteLLM."""

import litellm
from state import LLMConfig
from config import OPENAI_API_KEY, OPENAI_MODEL, GEMINI_API_KEY, MISTRAL_API_KEY

# Default models per provider
DEFAULT_MODELS = {
    "openai": "gpt-4o",
    "gemini": "gemini-1.5-pro",
    "mistral": "mistral-large-latest",
}

# Suppress litellm's noisy logging
litellm.suppress_debug_info = True


async def call_llm(messages: list[dict], response_format=None, llm_config: LLMConfig | None = None, **kwargs):
    """Unified async completion call supporting OpenAI, Gemini, and Mistral."""
    config = llm_config or LLMConfig()
    provider = (config.provider or "openai").strip().lower()

    # Resolve the model name — use the user's choice, or fall back to default
    raw_model = config.model.strip() if config.model else ""
    default_model = DEFAULT_MODELS.get(provider, OPENAI_MODEL)

    if provider == "gemini":
        if raw_model:
            model = raw_model if raw_model.startswith("gemini/") else f"gemini/{raw_model}"
        else:
            model = f"gemini/{default_model}"
        api_key = config.api_key or GEMINI_API_KEY
    elif provider == "mistral":
        if raw_model:
            model = raw_model if raw_model.startswith("mistral/") else f"mistral/{raw_model}"
        else:
            model = f"mistral/{default_model}"
        api_key = config.api_key or MISTRAL_API_KEY
    else:  # openai
        model = raw_model or default_model
        api_key = config.api_key or OPENAI_API_KEY

    print(f"[LLM] provider={provider} model={model} key={'***' + api_key[-4:] if api_key else 'NONE'}")

    call_kwargs = {
        "model": model,
        "messages": messages,
        "api_key": api_key,
        **kwargs,
    }
    if response_format is not None:
        call_kwargs["response_format"] = response_format

    response = await litellm.acompletion(**call_kwargs)
    return response
