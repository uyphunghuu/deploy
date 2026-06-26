from __future__ import annotations

from typing import Protocol

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.running_coach.graph import run_running_coach_graph
from app.ai.running_coach.providers import RunningCoachProvider
from app.ai.running_coach.schemas import (
    RunningAthleteProfile,
    RunningCoachContext,
    RunningCoachRequest,
    RunningCoachResult,
)
from app.models import Profile


class TraceRecorder(Protocol):
    enabled: bool

    def record(self, *, goal: str, context: RunningCoachContext, output: dict[str, str]) -> None:
        """Record sanitized AI coach trace data."""


class RunningCoachService:
    def __init__(self, *, provider: RunningCoachProvider, trace_recorder: TraceRecorder | None = None) -> None:
        self._provider = provider
        self._trace_recorder = trace_recorder

    async def chat(
        self, request: RunningCoachRequest, *, session: AsyncSession, profile: Profile
    ) -> RunningCoachResult:
        safe_request = RunningCoachRequest(
            message=request.message,
            training_goal=request.training_goal,
            history=request.history[-10:],
        )
        result = await run_running_coach_graph(
            request=safe_request,
            session=session,
            profile=profile,
            provider=self._provider,
        )

        if self._trace_recorder:
            try:
                trace_context = RunningCoachContext(
                    profile=RunningAthleteProfile(
                        first_name=profile.first_name,
                        primary_sport=profile.primary_sport.value,
                        height_cm=profile.height_cm,
                        weight_kg=float(profile.weight_kg) if profile.weight_kg is not None else None,
                    ),
                    sports=[],
                    recent_activities=[],
                    active_plans=[],
                    upcoming_sessions=[],
                )
                self._trace_recorder.record(
                    goal=safe_request.goal_text,
                    context=trace_context,
                    output={
                        "answer": result.structured.answer,
                        "intent": result.structured.intent,
                        "recommendation": result.recommendation,
                        "rationale": result.rationale,
                    },
                )
            except Exception:
                pass

        return result
