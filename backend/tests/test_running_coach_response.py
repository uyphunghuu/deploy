from datetime import date

from app.ai.running_coach.graph import parse_structured_response
from app.ai.running_coach.schemas import (
    RunningActivitySummary,
    RunningAthleteProfile,
    RunningCoachContext,
    ToolExecutionResult,
)


def test_parse_structured_response_accepts_json_code_fence() -> None:
    response = parse_structured_response(
        """
        ```json
        {
          "answer": "Buổi chạy này có pace ổn định.",
          "intent": "activity_analysis",
          "summary": "Pace đều, khối lượng vừa phải.",
          "recommendations": [
            {
              "title": "Giữ nhịp",
              "details": "Lặp lại một buổi dễ tương tự trước khi tăng khối lượng.",
              "priority": "low"
            }
          ],
          "warning": {"level": "none", "message": ""},
          "missing_data": ["heart_rate"],
          "suggested_questions": ["Bạn có dữ liệu nhịp tim của buổi chạy này không?"]
        }
        ```
        """,
        context=_context(),
    )

    assert response.intent == "activity_analysis"
    assert response.warning.level == "none"
    assert response.missing_data == ["heart_rate"]


def test_parse_structured_response_falls_back_safely_on_invalid_output() -> None:
    response = parse_structured_response("not-json", context=_context(recent_activities=[]))

    assert response.intent == "missing_context"
    assert response.warning.level == "none"
    assert "recent_running_activities" in response.missing_data
    assert response.suggested_questions


def test_parse_structured_response_uses_urgent_fallback_for_health_warning() -> None:
    response = parse_structured_response(
        "not-json",
        context=_context(),
        health_note="The athlete mentioned a potentially serious symptom.",
    )

    assert response.intent == "injury_risk"
    assert response.warning.level == "urgent"
    assert "Dừng tập" in response.warning.message


def test_parse_structured_response_reports_tool_error_fallback() -> None:
    response = parse_structured_response(
        "not-json",
        context=_context(),
        tool_results=[
            ToolExecutionResult(
                name="get_recent_runs",
                status="error",
                elapsed_ms=12,
                error="Tool failed.",
            )
        ],
    )

    assert response.warning.level == "none"
    assert "get_recent_runs" in response.answer


def _context(recent_activities: list[RunningActivitySummary] | None = None) -> RunningCoachContext:
    activities = (
        [
            RunningActivitySummary(
                sport="running",
                title="Easy Run",
                started_on=date.today(),
                distance_km=5.0,
                duration_seconds=1800,
                pace_seconds_per_km=360,
            )
        ]
        if recent_activities is None
        else recent_activities
    )
    return RunningCoachContext(
        profile=RunningAthleteProfile(first_name="Lam", primary_sport="running"),
        sports=[],
        recent_activities=activities,
        active_plans=[],
        upcoming_sessions=[],
        weekly_mileage_km=5.0 if activities else None,
        training_load_note=None,
    )
