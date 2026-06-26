from __future__ import annotations

from typing import Protocol

from app.ai.running_coach.providers import LLMMessage, build_running_llm_provider
from app.core.config import Settings


class LLMProvider(Protocol):
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate text from a system prompt and user prompt."""


class OpenAILLMProvider:
    def __init__(self, settings: Settings) -> None:
        self._provider = build_running_llm_provider(settings)

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        return self._provider.generate(
            [
                LLMMessage(role="system", content=system_prompt),
                LLMMessage(role="user", content=user_prompt),
            ]
        )


def build_llm_provider(settings: Settings) -> LLMProvider:
    return OpenAILLMProvider(settings)
