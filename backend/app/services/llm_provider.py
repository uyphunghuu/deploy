from __future__ import annotations

from typing import Protocol

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import Settings


class LLMProvider(Protocol):
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate a text response from a chat model."""


class OpenAILLMProvider:
    def __init__(self, settings: Settings) -> None:
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required for the OpenAI LLM provider.")
        from langchain_openai import ChatOpenAI

        self._model = ChatOpenAI(
            model=settings.llm_model,
            api_key=settings.openai_api_key,
            temperature=0.2,
        )

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        response = self._model.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
        return str(response.content)


class StaticFallbackLLMProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        return (
            "Recommendation: Easy aerobic session for 30 minutes at conversational effort.\n"
            "Rationale: This is a conservative suggestion based on limited available context."
        )


def build_llm_provider(settings: Settings) -> LLMProvider:
    provider = settings.llm_provider.lower()
    if provider == "openai":
        return OpenAILLMProvider(settings)
    raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")

