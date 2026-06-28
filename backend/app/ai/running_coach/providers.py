from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Literal, Protocol

from app.core.config import Settings

LLMRole = Literal["system", "user", "assistant"]


@dataclass(frozen=True)
class LLMMessage:
    role: LLMRole
    content: str


class RunningCoachProvider(Protocol):
    def generate(self, messages: Sequence[LLMMessage]) -> str:
        """Generate a coach response from chat messages."""


class LLMConfigurationError(RuntimeError):
    pass


class LLMGenerationError(RuntimeError):
    pass


class OpenAIChatProvider:
    def __init__(self, settings: Settings, *, max_attempts: int = 2) -> None:
        if not settings.openai_api_key:
            raise LLMConfigurationError("OPENAI_API_KEY is not configured for the AI coach.")
        if not settings.llm_model:
            raise LLMConfigurationError("LLM_MODEL is not configured for the AI coach.")

        from langchain_openai import ChatOpenAI

        self._max_attempts = max(1, max_attempts)
        self._model = ChatOpenAI(
            model=settings.llm_model,
            api_key=settings.openai_api_key,
            temperature=0.2,
            max_retries=0,
        )

    def generate(self, messages: Sequence[LLMMessage]) -> str:
        from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

        converted: list[BaseMessage] = []
        for message in messages:
            if message.role == "system":
                converted.append(SystemMessage(content=message.content))
            elif message.role == "assistant":
                converted.append(AIMessage(content=message.content))
            else:
                converted.append(HumanMessage(content=message.content))

        last_error: Exception | None = None
        for _ in range(self._max_attempts):
            try:
                response = self._model.invoke(converted)
                return str(response.content)
            except Exception as exc:
                last_error = exc

        raise LLMGenerationError("AI coach model request failed.") from last_error


class GeminiChatProvider:
    def __init__(self, settings: Settings, *, max_attempts: int = 2) -> None:
        if not settings.gemini_api_key:
            raise LLMConfigurationError("GEMINI_API_KEY is not configured for the AI coach.")
        if not settings.llm_model:
            raise LLMConfigurationError("LLM_MODEL is not configured for the AI coach.")

        self._api_key = settings.gemini_api_key
        self._model = settings.llm_model
        self._max_attempts = max(1, max_attempts)

    def generate(self, messages: Sequence[LLMMessage]) -> str:
        import httpx

        system_parts = []
        contents = []

        for msg in messages:
            if msg.role == "system":
                system_parts.append({"text": msg.content})
            elif msg.role == "assistant":
                contents.append({"role": "model", "parts": [{"text": msg.content}]})
            else:
                contents.append({"role": "user", "parts": [{"text": msg.content}]})

        payload = {"contents": contents, "generationConfig": {"temperature": 0.2}}
        if system_parts:
            payload["systemInstruction"] = {"parts": system_parts}

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent?key={self._api_key}"
        )

        last_error: Exception | None = None
        for _ in range(self._max_attempts):
            try:
                with httpx.Client(timeout=30.0) as client:
                    response = client.post(url, json=payload)
                    response.raise_for_status()
                    data = response.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return text
            except Exception as exc:
                last_error = exc

        raise LLMGenerationError("AI coach model request failed.") from last_error


def build_running_llm_provider(settings: Settings) -> RunningCoachProvider:
    provider = settings.llm_provider.lower()
    if provider == "openai":
        return OpenAIChatProvider(settings)
    elif provider == "gemini":
        return GeminiChatProvider(settings)
    raise LLMConfigurationError(f"Unsupported LLM_PROVIDER for the AI coach: {settings.llm_provider}")
