from __future__ import annotations

from typing import Any

from app.core.config import Settings


class LangfuseRecorder:
    def __init__(self, settings: Settings) -> None:
        self.enabled = settings.langfuse_enabled
        self._client: Any | None = None
        if not self.enabled:
            return
        if not settings.langfuse_public_key or not settings.langfuse_secret_key:
            self.enabled = False
            return
        try:
            from langfuse import Langfuse

            self._client = Langfuse(
                public_key=settings.langfuse_public_key,
                secret_key=settings.langfuse_secret_key,
                host=settings.langfuse_host,
            )
        except Exception:
            self.enabled = False

    def record(self, *, goal: str, context: Any, output: dict[str, str]) -> None:
        if not self.enabled or self._client is None:
            return

        self._client.trace(
            name="slabai-ai-coach-mvp",
            input={
                "goal": goal,
                "profile": {
                    "first_name": context.profile.first_name,
                    "primary_sport": context.profile.primary_sport,
                },
                "sports": [item.__dict__ for item in context.sports],
                "recent_activities_count": len(context.recent_activities),
            },
            output=output,
            metadata={"agent": "single-agent", "scope": "mvp"},
        )
