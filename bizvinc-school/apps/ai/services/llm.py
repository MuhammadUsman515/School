"""Azure OpenAI wrapper for the AI service."""

from openai import AzureOpenAI
import os

_client: AzureOpenAI | None = None


def get_llm_client() -> AzureOpenAI:
    """Lazy-initialize and return the Azure OpenAI client."""
    global _client
    if _client is None:
        _client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY", ""),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
            api_version=os.getenv("OPENAI_API_VERSION", "2024-02-01"),
        )
    return _client
