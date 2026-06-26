from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date

from app.ai.running_coach.graph import RunningCoachRunError, parse_structured_response
from app.ai.running_coach.prompts import build_prompt_messages
from app.ai.running_coach.providers import LLMMessage
from app.ai.running_coach.safety import build_health_note, build_scope_note, redact_sensitive_text
from app.ai.running_coach.schemas import (
    RunningActivitySummary,
    RunningAthleteProfile,
    RunningCoachContext,
    RunningCoachRequest,
    RunningCoachStructuredResponse,
    RunningSportProfile,
)
from app.core.config import Settings
from app.services.ai_context import AgentContext
from app.services.langfuse_tracing import LangfuseRecorder
from app.services.llm_provider import LLMProvider


class AgentRunError(RunningCoachRunError):
    pass


@dataclass(frozen=True)
class CoachRecommendation:
    response: str
    recommendation: str
    rationale: str


def run_coach_agent(
    *,
    goal: str,
    context: AgentContext,
    settings: Settings,
    llm_provider: LLMProvider,
    langfuse_recorder: LangfuseRecorder | None = None,
) -> CoachRecommendation:
    del settings
    request = RunningCoachRequest(message=goal, training_goal=goal)
    running_context = _to_running_context(context)
    scope_note = build_scope_note(goal)
    health_note = build_health_note(goal)
    try:
        llm_text = _PromptProviderAdapter(llm_provider).generate(
            build_prompt_messages(
                request,
                running_context,
                intent="general_running",
                tool_results=[],
                scope_note=scope_note,
                health_note=health_note,
            )
        )
        structured = parse_structured_response(
            redact_sensitive_text(llm_text),
            context=running_context,
            tool_results=[],
            health_note=health_note,
            scope_note=scope_note,
        )
    except Exception as exc:
        raise AgentRunError(str(exc)) from exc

    if langfuse_recorder:
        try:
            langfuse_recorder.record(
                goal=request.goal_text,
                context=running_context,
                output={
                    "answer": structured.answer,
                    "intent": structured.intent,
                    "recommendation": _recommendation_text(structured),
                    "rationale": structured.summary,
                },
            )
        except Exception:
            pass

    return CoachRecommendation(
        response=structured.answer,
        recommendation=_recommendation_text(structured),
        rationale=structured.summary,
    )


class _PromptProviderAdapter:
    def __init__(self, provider: LLMProvider) -> None:
        self._provider = provider

    def generate(self, messages: Sequence[LLMMessage]) -> str:
        system_prompt = "\n\n".join(item.content for item in messages if item.role == "system")
        user_prompt = "\n\n".join(f"{item.role}: {item.content}" for item in messages if item.role != "system")
        return self._provider.generate(system_prompt, user_prompt)


def _to_running_context(context: AgentContext) -> RunningCoachContext:
    return RunningCoachContext(
        profile=RunningAthleteProfile(
            first_name=context.profile.first_name,
            primary_sport=context.profile.primary_sport,
        ),
        sports=[
            RunningSportProfile(
                sport=item.sport,
                goal_mode=item.goal_mode,
                fitness_focus=item.fitness_focus,
                fitness_duration_weeks=item.fitness_duration_weeks,
                volume=item.volume,
                schedule_mode="ai-optimized",
                heart_rate_bpm=None,
                pace_seconds_per_km=None,
                power_watts=None,
                build_progression=item.build_progression,
            )
            for item in context.sports
        ],
        recent_activities=[
            RunningActivitySummary(
                sport=item.sport,
                title=item.title,
                started_on=date.today(),
                distance_km=item.distance_km,
                duration_seconds=item.duration_seconds,
                pace_seconds_per_km=item.pace_seconds_per_km,
            )
            for item in context.recent_activities
        ],
        active_plans=[],
        upcoming_sessions=[],
    )


def _recommendation_text(response: RunningCoachStructuredResponse) -> str:
    if response.recommendations:
        first = response.recommendations[0]
        return f"{first.title}: {first.details}"
    return response.answer
