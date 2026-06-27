from __future__ import annotations

import json
from typing import TypedDict

from langgraph.graph import END, StateGraph
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.running_coach.context_loader import context_load_options_for_intent, load_running_coach_context
from app.ai.running_coach.prompts import build_prompt_messages
from app.ai.running_coach.providers import LLMConfigurationError, LLMGenerationError, LLMMessage, RunningCoachProvider
from app.ai.running_coach.safety import build_health_note, build_scope_note, redact_sensitive_text
from app.ai.running_coach.schemas import (
    RunningAthleteProfile,
    RunningCoachContext,
    RunningCoachRecommendationItem,
    RunningCoachRequest,
    RunningCoachResult,
    RunningCoachStructuredResponse,
    RunningCoachWarning,
    ToolExecutionResult,
)
from app.ai.running_coach.tools import (
    TOOL_GET_RECENT_RUNS,
    TOOL_GET_RUNNER_PROFILE,
    TOOL_GET_UPCOMING_WORKOUTS,
    TOOL_PACE_GUIDANCE,
    TOOL_RISK_SIGNALS,
    TOOL_WEEKLY_SUMMARY,
    execute_tool,
)
from app.models import Profile


class RunningCoachRunError(RuntimeError):
    pass


class RunningCoachState(TypedDict):
    request: RunningCoachRequest
    session: AsyncSession
    profile: Profile
    provider: RunningCoachProvider
    context: RunningCoachContext
    intent: str
    selected_tools: list[str]
    tool_results: list[ToolExecutionResult]
    scope_note: str | None
    health_note: str | None
    messages: list[LLMMessage]
    llm_text: str
    structured: RunningCoachStructuredResponse
    recommendation: str
    rationale: str
    response: str


async def run_running_coach_graph(
    *,
    request: RunningCoachRequest,
    session: AsyncSession,
    profile: Profile,
    provider: RunningCoachProvider,
) -> RunningCoachResult:
    def classify_intent(state: RunningCoachState) -> RunningCoachState:
        return {**state, "intent": classify_running_intent(state["request"].message)}

    async def load_minimum_context(state: RunningCoachState) -> RunningCoachState:
        context = await load_running_coach_context(
            state["session"],
            state["profile"],
            options=context_load_options_for_intent(state["intent"], state["request"].message),
        )
        return {**state, "context": context}

    def decide_tools(state: RunningCoachState) -> RunningCoachState:
        return {**state, "selected_tools": decide_tools_for_intent(state["intent"], state["request"].message)}

    async def execute_tools(state: RunningCoachState) -> RunningCoachState:
        results = []
        for tool_name in state["selected_tools"]:
            results.append(
                await execute_tool(
                    tool_name,
                    session=state["session"],
                    profile=state["profile"],
                    request=state["request"],
                )
            )
        return {**state, "tool_results": results}

    def safety_check(state: RunningCoachState) -> RunningCoachState:
        request = state["request"]
        return {
            **state,
            "scope_note": build_scope_note(request.message),
            "health_note": build_health_note(request.message),
        }

    def compose_answer(state: RunningCoachState) -> RunningCoachState:
        messages = build_prompt_messages(
            state["request"],
            state["context"],
            intent=state["intent"],
            tool_results=state["tool_results"],
            scope_note=state["scope_note"],
            health_note=state["health_note"],
        )
        try:
            llm_text = state["provider"].generate(messages)
        except LLMConfigurationError:
            raise
        except LLMGenerationError as exc:
            raise RunningCoachRunError("AI coach model failed to generate a response.") from exc
        except Exception as exc:
            raise RunningCoachRunError("AI coach model failed to generate a response.") from exc
        return {**state, "messages": messages, "llm_text": redact_sensitive_text(llm_text)}

    def validate_output(state: RunningCoachState) -> RunningCoachState:
        structured = parse_structured_response(
            state["llm_text"],
            context=state["context"],
            tool_results=state["tool_results"],
            health_note=state["health_note"],
            scope_note=state["scope_note"],
        )
        recommendation = _recommendation_text(structured)
        return {
            **state,
            "structured": structured,
            "recommendation": recommendation,
            "rationale": structured.summary,
            "response": structured.answer,
        }

    graph = StateGraph(RunningCoachState)
    graph.add_node("classify_intent", classify_intent)
    graph.add_node("load_minimum_context", load_minimum_context)
    graph.add_node("decide_tools", decide_tools)
    graph.add_node("execute_tools", execute_tools)
    graph.add_node("safety_check", safety_check)
    graph.add_node("compose_answer", compose_answer)
    graph.add_node("validate_output", validate_output)
    graph.set_entry_point("classify_intent")
    graph.add_edge("classify_intent", "load_minimum_context")
    graph.add_edge("load_minimum_context", "decide_tools")
    graph.add_edge("decide_tools", "execute_tools")
    graph.add_edge("execute_tools", "safety_check")
    graph.add_edge("safety_check", "compose_answer")
    graph.add_edge("compose_answer", "validate_output")
    graph.add_edge("validate_output", END)

    initial_context = RunningCoachContext(
        profile=RunningAthleteProfile(first_name=None, primary_sport="running"),
        sports=[],
        recent_activities=[],
        active_plans=[],
        upcoming_sessions=[],
    )
    result = await graph.compile().ainvoke(
        {
            "request": request,
            "session": session,
            "profile": profile,
            "provider": provider,
            "context": initial_context,
            "intent": "general_running",
            "selected_tools": [],
            "tool_results": [],
            "scope_note": None,
            "health_note": None,
            "messages": [],
            "llm_text": "",
            "structured": _fallback_response(
                context=initial_context, tool_results=[], health_note=None, scope_note=None
            ),
            "recommendation": "",
            "rationale": "",
            "response": "",
        }
    )

    return RunningCoachResult(
        response=str(result["response"]),
        recommendation=str(result["recommendation"]),
        rationale=str(result["rationale"]),
        structured=result["structured"],
    )


def classify_running_intent(message: str) -> str:
    normalized = message.lower()
    if any(term in normalized for term in ("đau", "pain", "chấn thương", "injury", "ngực", "khó thở", "ngất")):
        return "injury_risk"
    if any(term in normalized for term in ("mệt", "hồi phục", "recovery", "rest", "nghỉ")):
        return "recovery"
    if any(term in normalized for term in ("phân tích", "analyze", "pace", "cadence", "elevation", "nhịp tim")):
        return "activity_analysis"
    if any(term in normalized for term in ("lịch", "giáo án", "plan", "workout", "buổi tập sắp", "sắp tới")):
        return "plan_question"
    if any(term in normalized for term in ("hôm nay", "nên tập", "chạy gì", "workout", "5k", "10k", "half")):
        return "workout_advice"
    return "general_running"


def decide_tools_for_intent(intent: str, message: str) -> list[str]:
    normalized = message.lower()
    if build_scope_note(message):
        return [TOOL_GET_RUNNER_PROFILE]

    if intent == "activity_analysis":
        return [TOOL_GET_RUNNER_PROFILE, TOOL_GET_RECENT_RUNS, TOOL_WEEKLY_SUMMARY, TOOL_PACE_GUIDANCE]
    if intent == "plan_question":
        return [TOOL_GET_RUNNER_PROFILE, TOOL_GET_UPCOMING_WORKOUTS, TOOL_WEEKLY_SUMMARY]
    if intent == "workout_advice":
        return [
            TOOL_GET_RUNNER_PROFILE,
            TOOL_GET_RECENT_RUNS,
            TOOL_GET_UPCOMING_WORKOUTS,
            TOOL_WEEKLY_SUMMARY,
            TOOL_PACE_GUIDANCE,
            TOOL_RISK_SIGNALS,
        ]
    if intent in {"injury_risk", "recovery"}:
        return [TOOL_GET_RUNNER_PROFILE, TOOL_GET_RECENT_RUNS, TOOL_WEEKLY_SUMMARY, TOOL_RISK_SIGNALS]
    if any(term in normalized for term in ("dữ liệu", "số liệu", "km", "pace", "load")):
        return [TOOL_GET_RUNNER_PROFILE, TOOL_GET_RECENT_RUNS, TOOL_WEEKLY_SUMMARY]
    return [TOOL_GET_RUNNER_PROFILE]


def parse_structured_response(
    text: str,
    *,
    context: RunningCoachContext,
    tool_results: list[ToolExecutionResult] | None = None,
    health_note: str | None = None,
    scope_note: str | None = None,
) -> RunningCoachStructuredResponse:
    safe_text = redact_sensitive_text(text)
    try:
        payload = json.loads(_extract_json_object(safe_text))
        return RunningCoachStructuredResponse.model_validate(payload)
    except (json.JSONDecodeError, ValidationError, ValueError, TypeError):
        legacy = _legacy_text_response(safe_text)
        if legacy:
            return legacy
        return _fallback_response(
            context=context,
            tool_results=tool_results or [],
            health_note=health_note,
            scope_note=scope_note,
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
        recommendation = text.strip() or "Choose an easy run at conversational effort today."
    if not rationale:
        rationale = "This keeps the guidance conservative based on the available running context."
    return redact_sensitive_text(recommendation), redact_sensitive_text(rationale)


def _extract_json_object(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped.startswith("json"):
            stripped = stripped[4:].strip()
    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in model output.")
    return stripped[start : end + 1]


def _legacy_text_response(text: str) -> RunningCoachStructuredResponse | None:
    recommendation, rationale = parse_llm_text(text)
    if not recommendation or recommendation == text.strip():
        return None
    return RunningCoachStructuredResponse(
        answer=recommendation,
        intent="general_running",
        summary=rationale,
        recommendations=[
            RunningCoachRecommendationItem(
                title="Gợi ý chạy bộ",
                details=recommendation,
                priority="medium",
            )
        ],
        warning=RunningCoachWarning(level="none", message=""),
        missing_data=[],
        suggested_questions=[],
    )


def _fallback_response(
    *,
    context: RunningCoachContext,
    tool_results: list[ToolExecutionResult],
    health_note: str | None,
    scope_note: str | None,
) -> RunningCoachStructuredResponse:
    missing_data = _missing_data(context, tool_results)
    tool_errors = [item.name for item in tool_results if item.status != "success"]
    tool_error_text = f" Một số dữ liệu chưa lấy được: {', '.join(tool_errors)}." if tool_errors else ""
    if health_note:
        return RunningCoachStructuredResponse(
            answer=(
                "Mình chưa thể phân tích chi tiết từ phản hồi AI lúc này. Với dấu hiệu bạn mô tả, hãy dừng buổi tập "
                f"và tìm hỗ trợ y tế phù hợp trước khi tiếp tục chạy.{tool_error_text}"
            ),
            intent="injury_risk",
            summary="Có dấu hiệu cần ưu tiên an toàn.",
            recommendations=[
                RunningCoachRecommendationItem(
                    title="Ưu tiên an toàn",
                    details="Dừng tập, nghỉ ngơi ở nơi an toàn và liên hệ chuyên gia y tế nếu triệu chứng tiếp diễn.",
                    priority="high",
                )
            ],
            warning=RunningCoachWarning(
                level="urgent",
                message="Dừng tập và tìm hỗ trợ y tế phù hợp nếu có triệu chứng nghiêm trọng hoặc kéo dài.",
            ),
            missing_data=missing_data,
            suggested_questions=[],
        )

    if scope_note:
        return RunningCoachStructuredResponse(
            answer=(
                "Phiên bản hiện tại của SLABAI AI Coach tập trung vào chạy bộ, nên mình chỉ có thể hỗ trợ "
                f"trong phạm vi chạy.{tool_error_text}"
            ),
            intent="general_running",
            summary="Câu hỏi nằm ngoài phạm vi chạy bộ của MVP.",
            recommendations=[],
            warning=RunningCoachWarning(level="none", message=""),
            missing_data=missing_data,
            suggested_questions=["Bạn muốn mình gợi ý một buổi chạy phù hợp hôm nay không?"],
        )

    return RunningCoachStructuredResponse(
        answer=(
            "Mình chưa đọc được phản hồi có cấu trúc từ AI, nên sẽ trả lời an toàn: hãy giữ buổi chạy ở mức dễ, "
            f"có thể nói chuyện thoải mái, và không tăng khối lượng nếu bạn đang mệt.{tool_error_text}"
        ),
        intent="missing_context" if missing_data else "general_running",
        summary="Fallback an toàn do phản hồi AI không đúng định dạng.",
        recommendations=[
            RunningCoachRecommendationItem(
                title="Giữ cường độ dễ",
                details="Chọn chạy nhẹ 20-30 phút hoặc nghỉ nếu cơ thể chưa sẵn sàng.",
                priority="medium",
            )
        ],
        warning=RunningCoachWarning(level="none", message=""),
        missing_data=missing_data,
        suggested_questions=_suggested_questions(missing_data),
    )


def _missing_data(context: RunningCoachContext, tool_results: list[ToolExecutionResult]) -> list[str]:
    missing = []
    if context.personalized:
        missing.extend(context.personalized.missing_data)
    successful_tools = {item.name for item in tool_results if item.status == "success"}
    if TOOL_GET_RUNNER_PROFILE not in successful_tools:
        missing.append("running_profile")
    if TOOL_GET_RECENT_RUNS not in successful_tools and not context.recent_activities:
        missing.append("recent_running_activities")
    if TOOL_WEEKLY_SUMMARY not in successful_tools and context.weekly_mileage_km is None:
        missing.append("weekly_mileage")
    if TOOL_GET_UPCOMING_WORKOUTS not in successful_tools and not context.upcoming_sessions:
        missing.append("upcoming_running_sessions")
    return list(dict.fromkeys(missing))


def _suggested_questions(missing_data: list[str]) -> list[str]:
    questions = []
    if "recent_running_activities" in missing_data:
        questions.append("Gần đây bạn chạy buổi nào nhất, khoảng bao xa và pace thế nào?")
    if "running_profile" in missing_data:
        questions.append("Mục tiêu chạy bộ hiện tại của bạn là 5 km, 10 km, half marathon hay duy trì sức khỏe?")
    return questions[:2]


def _recommendation_text(response: RunningCoachStructuredResponse) -> str:
    if response.recommendations:
        first = response.recommendations[0]
        return f"{first.title}: {first.details}"
    return response.answer
