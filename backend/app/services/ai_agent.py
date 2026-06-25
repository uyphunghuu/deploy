from __future__ import annotations

from dataclasses import dataclass
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.core.config import Settings
from app.services.ai_context import AgentContext
from app.services.langfuse_tracing import LangfuseRecorder
from app.services.llm_provider import LLMProvider


class AgentRunError(RuntimeError):
    pass


@dataclass(frozen=True)
class CoachRecommendation:
    response: str
    recommendation: str
    rationale: str


class CoachState(TypedDict):
    goal: str
    context: AgentContext
    prompt: str
    llm_text: str
    recommendation: str
    rationale: str
    response: str


SYSTEM_PROMPT = """You are SLABAI's single MVP training coach agent.
Use only the provided profile, sport preferences, and recent activity summary.
Return a simple training session or simple plan suggestion.
Explain briefly why.
Do not claim to update user data.
Do not include secrets, access tokens, API keys, or full email addresses.
Avoid medical claims and keep the advice conservative.

Format:
Recommendation: ...
Rationale: ...
"""


def run_coach_agent(
    *,
    goal: str,
    context: AgentContext,
    settings: Settings,
    llm_provider: LLMProvider,
    langfuse_recorder: LangfuseRecorder | None = None,
) -> CoachRecommendation:
    def prepare_prompt(state: CoachState) -> CoachState:
        prompt = build_user_prompt(state["goal"], state["context"])
        return {**state, "prompt": prompt}

    def call_llm(state: CoachState) -> CoachState:
        try:
            llm_text = llm_provider.generate(SYSTEM_PROMPT, state["prompt"])
        except Exception as exc:
            raise AgentRunError("AI coach model failed to generate a recommendation.") from exc
        return {**state, "llm_text": llm_text}

    def parse_response(state: CoachState) -> CoachState:
        recommendation, rationale = parse_llm_text(state["llm_text"])
        response = f"{recommendation}\n\nWhy: {rationale}"
        return {
            **state,
            "recommendation": recommendation,
            "rationale": rationale,
            "response": response,
        }

    graph = StateGraph(CoachState)
    graph.add_node("prepare_prompt", prepare_prompt)
    graph.add_node("call_llm", call_llm)
    graph.add_node("parse_response", parse_response)
    graph.set_entry_point("prepare_prompt")
    graph.add_edge("prepare_prompt", "call_llm")
    graph.add_edge("call_llm", "parse_response")
    graph.add_edge("parse_response", END)

    compiled = graph.compile()
    result = compiled.invoke(
        {
            "goal": goal,
            "context": context,
            "prompt": "",
            "llm_text": "",
            "recommendation": "",
            "rationale": "",
            "response": "",
        }
    )

    output = CoachRecommendation(
        response=str(result["response"]),
        recommendation=str(result["recommendation"]),
        rationale=str(result["rationale"]),
    )

    if langfuse_recorder:
        langfuse_recorder.record(
            goal=goal,
            context=context,
            output={
                "recommendation": output.recommendation,
                "rationale": output.rationale,
            },
        )

    return output


def build_user_prompt(goal: str, context: AgentContext) -> str:
    sports = context.sports or []
    recent = context.recent_activities or []
    sport_lines = [
        (
            f"- {item.sport}: goal_mode={item.goal_mode}, focus={item.fitness_focus}, "
            f"duration_weeks={item.fitness_duration_weeks}, volume={item.volume}, "
            f"progression={item.build_progression}"
        )
        for item in sports
    ]
    activity_lines = [
        (
            f"- {item.sport} {item.title}: distance_km={item.distance_km}, "
            f"duration_seconds={item.duration_seconds}, pace_seconds_per_km={item.pace_seconds_per_km}"
        )
        for item in recent
    ]

    return "\n".join(
        [
            f"User training goal: {goal}",
            f"First name: {context.profile.first_name or 'athlete'}",
            f"Primary sport: {context.profile.primary_sport}",
            "Sport preferences:",
            *(sport_lines or ["- none provided"]),
            "Recent activities:",
            *(activity_lines or ["- none provided"]),
            "Give one actionable suggestion. Do not update any user data.",
        ]
    )


def parse_llm_text(text: str) -> tuple[str, str]:
    recommendation = ""
    rationale = ""
    for line in text.splitlines():
        normalized = line.strip()
        if normalized.lower().startswith("recommendation:"):
            recommendation = normalized.split(":", 1)[1].strip()
        elif normalized.lower().startswith("rationale:"):
            rationale = normalized.split(":", 1)[1].strip()

    if not recommendation:
        recommendation = text.strip() or "Take an easy aerobic session today."
    if not rationale:
        rationale = "This keeps the suggestion simple and conservative based on the available training context."
    return recommendation, rationale

