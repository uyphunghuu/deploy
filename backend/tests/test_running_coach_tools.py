from datetime import date, timedelta

from app.ai.running_coach.schemas import RunningActivitySummary
from app.ai.running_coach.tools import (
    calculate_average_pace_seconds,
    calculate_weekly_running_summary_from_runs,
    detect_training_risk_signals_from_inputs,
)


def test_calculate_average_pace_seconds() -> None:
    assert calculate_average_pace_seconds(10.0, 3000) == 300
    assert calculate_average_pace_seconds(0, 3000) is None
    assert calculate_average_pace_seconds(5.0, 0) is None


def test_calculate_weekly_running_summary_from_runs() -> None:
    today = date(2026, 1, 14)
    runs = [
        _run(today, 5.0),
        _run(today - timedelta(days=2), 8.0),
        _run(today - timedelta(days=8), 4.0),
        _run(today - timedelta(days=10), 6.0),
    ]

    summary = calculate_weekly_running_summary_from_runs(runs, today=today)

    assert summary["total_km_7_days"] == 13.0
    assert summary["total_km_previous_7_days"] == 10.0
    assert summary["percent_change"] == 30.0
    assert summary["run_count"] == 2
    assert summary["longest_run"]["distance_km"] == 8.0
    assert summary["most_recent_rest_day"] == "2026-01-13"


def test_detect_training_risk_signals_from_inputs() -> None:
    today = date(2026, 1, 14)
    runs = [_run(today - timedelta(days=offset), 5.0) for offset in range(7)]
    weekly_summary = calculate_weekly_running_summary_from_runs(
        [*runs, _run(today - timedelta(days=8), 10.0)],
        today=today,
    )

    risk = detect_training_risk_signals_from_inputs(
        message="I feel pain and unusual fatigue today",
        runs=runs,
        weekly_summary=weekly_summary,
        today=today,
    )

    signal_types = {item["type"] for item in risk["signals"]}
    assert risk["is_medical_diagnosis"] is False
    assert "volume_jump" in signal_types
    assert "consecutive_days" in signal_types
    assert "pain_mentioned" in signal_types
    assert "missing_rest" in signal_types


def _run(started_on: date, distance_km: float) -> RunningActivitySummary:
    return RunningActivitySummary(
        sport="running",
        title="Run",
        started_on=started_on,
        distance_km=distance_km,
        duration_seconds=round(distance_km * 360),
        pace_seconds_per_km=360,
    )
