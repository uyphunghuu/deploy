from __future__ import annotations

import asyncio
import logging
import re
from collections.abc import Awaitable, Callable
from datetime import date, datetime, time, timedelta
from time import perf_counter
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.running_coach.schemas import RunningActivitySummary, RunningCoachRequest, ToolExecutionResult
from app.models import Activity, PlanStatus, Profile, SportType, TrainingPlan, TrainingSession, UserSport

logger = logging.getLogger(__name__)

ToolCallable = Callable[[AsyncSession, Profile, RunningCoachRequest], Awaitable[dict[str, Any]]]

TOOL_GET_RUNNER_PROFILE = "get_runner_profile"
TOOL_GET_RECENT_RUNS = "get_recent_runs"
TOOL_GET_UPCOMING_WORKOUTS = "get_upcoming_workouts"
TOOL_WEEKLY_SUMMARY = "calculate_weekly_running_summary"
TOOL_PACE_GUIDANCE = "calculate_pace_guidance"
TOOL_RISK_SIGNALS = "detect_training_risk_signals"


def format_duration(seconds: int | None) -> str:
    if seconds is None:
        return "unknown duration"
    minutes = round(seconds / 60)
    if minutes < 60:
        return f"{minutes} min"
    hours, remaining = divmod(minutes, 60)
    return f"{hours}h {remaining:02d}m"


def format_pace(seconds_per_km: int | None) -> str:
    if seconds_per_km is None or seconds_per_km <= 0:
        return "unknown pace"
    minutes, seconds = divmod(seconds_per_km, 60)
    return f"{minutes}:{seconds:02d}/km"


def summarize_recent_load(activities: list[RunningActivitySummary]) -> str:
    if not activities:
        return "No recent running activities are available."
    total_distance = sum(item.distance_km or 0 for item in activities)
    total_seconds = sum(item.duration_seconds or 0 for item in activities)
    return f"{len(activities)} recent runs, {total_distance:.1f} km total, {format_duration(total_seconds)} total time."


async def execute_tool(
    tool_name: str,
    *,
    session: AsyncSession,
    profile: Profile,
    request: RunningCoachRequest,
    timeout_seconds: float = 3.0,
) -> ToolExecutionResult:
    started = perf_counter()
    tool = TOOL_REGISTRY.get(tool_name)
    if tool is None:
        return ToolExecutionResult(name=tool_name, status="skipped", elapsed_ms=0, error="Tool is not registered.")

    try:
        data = await asyncio.wait_for(tool(session, profile, request), timeout=timeout_seconds)
        elapsed_ms = _elapsed_ms(started)
        logger.info("running_coach_tool name=%s status=success elapsed_ms=%s", tool_name, elapsed_ms)
        return ToolExecutionResult(name=tool_name, status="success", elapsed_ms=elapsed_ms, data=data)
    except TimeoutError:
        elapsed_ms = _elapsed_ms(started)
        logger.warning("running_coach_tool name=%s status=timeout elapsed_ms=%s", tool_name, elapsed_ms)
        return ToolExecutionResult(name=tool_name, status="timeout", elapsed_ms=elapsed_ms, error="Tool timed out.")
    except Exception:
        elapsed_ms = _elapsed_ms(started)
        logger.warning("running_coach_tool name=%s status=error elapsed_ms=%s", tool_name, elapsed_ms)
        return ToolExecutionResult(name=tool_name, status="error", elapsed_ms=elapsed_ms, error="Tool failed.")


async def get_runner_profile(session: AsyncSession, profile: Profile, request: RunningCoachRequest) -> dict[str, Any]:
    del request
    user_sport = await _get_running_sport(session, profile)
    race_goal = user_sport.race_goal if user_sport and isinstance(user_sport.race_goal, dict) else {}
    target_date = _first_value(race_goal, "date", "raceDate", "race_date", "targetDate", "target_date")
    target_distance = _first_value(race_goal, "distance", "distanceKm", "distance_km", "targetDistance")

    return {
        "basic": {
            "first_name": profile.first_name,
            "height_cm": profile.height_cm,
            "weight_kg": float(profile.weight_kg) if profile.weight_kg is not None else None,
        },
        "primary_sport": profile.primary_sport.value,
        "running_goal": {
            "goal_mode": user_sport.goal_mode.value if user_sport else None,
            "fitness_focus": user_sport.fitness_focus if user_sport else None,
            "fitness_duration_weeks": user_sport.fitness_duration_weeks if user_sport else None,
            "race_goal": race_goal or None,
        },
        "level": {
            "training_volume": user_sport.volume if user_sport else None,
            "build_progression": user_sport.build_progression if user_sport else None,
            "source": "user_sports.volume and user_sports.build_progression" if user_sport else None,
        },
        "target_distance": target_distance,
        "target_date": target_date,
        "pace_or_zone": {
            "threshold_pace_seconds_per_km": user_sport.pace_seconds_per_km if user_sport else None,
            "threshold_pace": format_pace(user_sport.pace_seconds_per_km if user_sport else None),
            "heart_rate_bpm": user_sport.heart_rate_bpm if user_sport else None,
            "power_watts": user_sport.power_watts if user_sport else None,
        },
    }


async def get_recent_runs(session: AsyncSession, profile: Profile, request: RunningCoachRequest) -> dict[str, Any]:
    days, limit = _recent_run_params(request.message)
    filters = [Activity.user_id == profile.id, Activity.sport == SportType.running]
    if days is not None:
        filters.append(Activity.started_at >= datetime.combine(date.today() - timedelta(days=days), time.min))
    result = await session.scalars(
        select(Activity).where(*filters).order_by(Activity.started_at.desc()).limit(limit or 5)
    )
    activities = [_activity_to_summary(item) for item in result]
    total_distance = sum(item.distance_km or 0 for item in activities)
    total_duration = sum(item.duration_seconds or 0 for item in activities)
    average_pace = calculate_average_pace_seconds(total_distance, total_duration)

    return {
        "days": days,
        "activity_count": len(activities),
        "runs": [_activity_summary_to_dict(item) for item in activities],
        "total_distance_km": round(total_distance, 2),
        "total_duration_seconds": total_duration,
        "average_pace_seconds_per_km": average_pace,
        "average_pace": format_pace(average_pace),
        "heart_rate": _heart_rate_summary(activities),
    }


async def get_upcoming_workouts(
    session: AsyncSession, profile: Profile, request: RunningCoachRequest
) -> dict[str, Any]:
    del request
    today = date.today()
    sessions = await session.scalars(
        select(TrainingSession)
        .where(
            TrainingSession.user_id == profile.id,
            TrainingSession.sport == SportType.running,
            TrainingSession.scheduled_date >= today,
            TrainingSession.scheduled_date <= today + timedelta(days=14),
        )
        .order_by(TrainingSession.scheduled_date)
        .limit(8)
    )
    plans = await session.scalars(
        select(TrainingPlan)
        .where(
            TrainingPlan.user_id == profile.id,
            TrainingPlan.sport == SportType.running,
            TrainingPlan.status.in_([PlanStatus.active, PlanStatus.generated]),
        )
        .order_by(TrainingPlan.updated_at.desc())
        .limit(2)
    )

    return {
        "workouts": [
            {
                "scheduled_date": item.scheduled_date.isoformat(),
                "title": item.title,
                "duration_minutes": item.duration_minutes,
                "distance_km": float(item.distance_km) if item.distance_km is not None else None,
                "intensity": item.intensity,
                "status": item.status.value,
            }
            for item in sessions
        ],
        "plans": [
            {
                "name": item.name,
                "status": item.status.value,
                "starts_on": item.starts_on.isoformat(),
                "ends_on": item.ends_on.isoformat() if item.ends_on else None,
            }
            for item in plans
        ],
    }


async def calculate_weekly_running_summary(
    session: AsyncSession, profile: Profile, request: RunningCoachRequest
) -> dict[str, Any]:
    del request
    today = date.today()
    rows = await session.scalars(
        select(Activity)
        .where(
            Activity.user_id == profile.id,
            Activity.sport == SportType.running,
            Activity.started_at >= datetime.combine(today - timedelta(days=14), time.min),
        )
        .order_by(Activity.started_at.desc())
    )
    return calculate_weekly_running_summary_from_runs([_activity_to_summary(item) for item in rows], today=today)


async def calculate_pace_guidance(
    session: AsyncSession, profile: Profile, request: RunningCoachRequest
) -> dict[str, Any]:
    del request
    user_sport = await _get_running_sport(session, profile)
    threshold = user_sport.pace_seconds_per_km if user_sport else None
    if threshold is None:
        return {
            "available": False,
            "missing_data": ["threshold_pace_seconds_per_km"],
            "message": "Pace guidance requires a saved threshold pace.",
        }

    return {
        "available": True,
        "threshold_pace_seconds_per_km": threshold,
        "threshold_pace": format_pace(threshold),
        "easy_pace_range_seconds_per_km": [threshold + 60, threshold + 120],
        "easy_pace_range": [format_pace(threshold + 60), format_pace(threshold + 120)],
        "steady_pace_range_seconds_per_km": [threshold + 20, threshold + 45],
        "steady_pace_range": [format_pace(threshold + 20), format_pace(threshold + 45)],
        "note": "Guidance is based on saved threshold pace, not an invented race result.",
    }


async def detect_training_risk_signals(
    session: AsyncSession, profile: Profile, request: RunningCoachRequest
) -> dict[str, Any]:
    today = date.today()
    rows = await session.scalars(
        select(Activity)
        .where(
            Activity.user_id == profile.id,
            Activity.sport == SportType.running,
            Activity.started_at >= datetime.combine(today - timedelta(days=14), time.min),
        )
        .order_by(Activity.started_at.desc())
    )
    runs = [_activity_to_summary(item) for item in rows]
    summary = calculate_weekly_running_summary_from_runs(runs, today=today)
    return detect_training_risk_signals_from_inputs(
        message=request.message,
        runs=runs,
        weekly_summary=summary,
        today=today,
    )


def calculate_weekly_running_summary_from_runs(
    runs: list[RunningActivitySummary], *, today: date | None = None
) -> dict[str, Any]:
    anchor = today or date.today()
    current_start = anchor - timedelta(days=6)
    previous_start = anchor - timedelta(days=13)
    previous_end = anchor - timedelta(days=7)

    current_runs = [item for item in runs if current_start <= item.started_on <= anchor]
    previous_runs = [item for item in runs if previous_start <= item.started_on <= previous_end]
    current_km = round(sum(item.distance_km or 0 for item in current_runs), 2)
    previous_km = round(sum(item.distance_km or 0 for item in previous_runs), 2)
    percent_change = _percent_change(current_km, previous_km)
    longest_run = max(current_runs, key=lambda item: item.distance_km or 0, default=None)

    return {
        "total_km_7_days": current_km,
        "total_km_previous_7_days": previous_km,
        "percent_change": percent_change,
        "run_count": len(current_runs),
        "longest_run": _activity_summary_to_dict(longest_run) if longest_run else None,
        "most_recent_rest_day": _most_recent_rest_day(current_runs, today=anchor),
    }


def calculate_average_pace_seconds(total_distance_km: float, total_duration_seconds: int) -> int | None:
    if total_distance_km <= 0 or total_duration_seconds <= 0:
        return None
    return round(total_duration_seconds / total_distance_km)


def detect_training_risk_signals_from_inputs(
    *,
    message: str,
    runs: list[RunningActivitySummary],
    weekly_summary: dict[str, Any],
    today: date | None = None,
) -> dict[str, Any]:
    anchor = today or date.today()
    signals: list[dict[str, str]] = []
    percent_change = weekly_summary.get("percent_change")
    if isinstance(percent_change, int | float) and percent_change > 30:
        signals.append(
            {
                "level": "caution",
                "type": "volume_jump",
                "message": "Khối lượng 7 ngày gần nhất tăng trên 30% so với 7 ngày trước.",
            }
        )

    consecutive_days = _current_consecutive_run_days(runs, today=anchor)
    if consecutive_days >= 4:
        signals.append(
            {
                "level": "caution",
                "type": "consecutive_days",
                "message": f"Bạn đã có {consecutive_days} ngày chạy liên tiếp.",
            }
        )

    normalized = message.lower()
    if any(term in normalized for term in ("đau", "pain", "nhức", "sore")):
        signals.append(
            {
                "level": "caution",
                "type": "pain_mentioned",
                "message": "Bạn có nhắc tới đau/nhức; đây chỉ là tín hiệu cần thận trọng, không phải chẩn đoán.",
            }
        )
    if any(term in normalized for term in ("mệt bất thường", "unusual fatigue", "kiệt sức", "exhausted")):
        signals.append(
            {
                "level": "caution",
                "type": "fatigue_mentioned",
                "message": "Bạn có nhắc tới mệt bất thường; nên ưu tiên hồi phục và theo dõi thêm.",
            }
        )

    if weekly_summary.get("most_recent_rest_day") is None and weekly_summary.get("run_count", 0) >= 6:
        signals.append(
            {
                "level": "caution",
                "type": "missing_rest",
                "message": "Không thấy ngày nghỉ rõ ràng trong 7 ngày gần nhất.",
            }
        )

    return {"signals": signals, "is_medical_diagnosis": False}


async def _get_running_sport(session: AsyncSession, profile: Profile) -> UserSport | None:
    return await session.scalar(
        select(UserSport)
        .where(UserSport.user_id == profile.id, UserSport.sport == SportType.running)
        .order_by(UserSport.updated_at.desc())
        .limit(1)
    )


def _activity_to_summary(activity: Activity) -> RunningActivitySummary:
    raw = activity.raw_payload or {}
    return RunningActivitySummary(
        sport=activity.sport.value,
        title=activity.title,
        started_on=activity.started_at.date(),
        distance_km=float(activity.distance_km) if activity.distance_km is not None else None,
        duration_seconds=activity.duration_seconds,
        pace_seconds_per_km=activity.pace_seconds_per_km,
        heart_rate_bpm=_raw_int(raw, "average_heartrate", "averageHeartRate", "heart_rate_bpm"),
        cadence_spm=_raw_int(raw, "average_cadence", "averageCadence", "cadence_spm"),
        elevation_m=_raw_float(raw, "total_elevation_gain", "elevation_m", "elevation"),
    )


def _activity_summary_to_dict(activity: RunningActivitySummary | None) -> dict[str, Any] | None:
    if activity is None:
        return None
    return {
        "sport": activity.sport,
        "title": activity.title,
        "date": activity.started_on.isoformat(),
        "distance_km": activity.distance_km,
        "duration_seconds": activity.duration_seconds,
        "pace_seconds_per_km": activity.pace_seconds_per_km,
        "pace": format_pace(activity.pace_seconds_per_km),
        "heart_rate_bpm": activity.heart_rate_bpm,
        "cadence_spm": activity.cadence_spm,
        "elevation_m": activity.elevation_m,
    }


def _heart_rate_summary(activities: list[RunningActivitySummary]) -> dict[str, Any]:
    values = [item.heart_rate_bpm for item in activities if item.heart_rate_bpm is not None]
    if not values:
        return {"available": False}
    return {"available": True, "average_bpm": round(sum(values) / len(values)), "max_average_bpm": max(values)}


def _recent_run_params(message: str) -> tuple[int | None, int | None]:
    normalized = message.lower()
    if any(term in normalized for term in ("gần nhất", "gan nhat", "latest", "last run", "buổi chạy vừa")):
        return None, 1
    days_match = re.search(r"(\d+)\s*(ngày|days?)", normalized)
    if days_match:
        return min(int(days_match.group(1)), 90), None
    count_match = re.search(r"(\d+)\s*(buổi|runs?|activities?)", normalized)
    if count_match:
        return None, min(int(count_match.group(1)), 20)
    return 14, 5


def _percent_change(current: float, previous: float) -> float | None:
    if previous <= 0:
        return None if current <= 0 else 100.0
    return round(((current - previous) / previous) * 100, 1)


def _most_recent_rest_day(runs: list[RunningActivitySummary], *, today: date) -> str | None:
    run_dates = {item.started_on for item in runs}
    for offset in range(0, 7):
        candidate = today - timedelta(days=offset)
        if candidate not in run_dates:
            return candidate.isoformat()
    return None


def _current_consecutive_run_days(runs: list[RunningActivitySummary], *, today: date) -> int:
    run_dates = {item.started_on for item in runs}
    count = 0
    cursor = today
    while cursor in run_dates:
        count += 1
        cursor -= timedelta(days=1)
    return count


def _first_value(values: dict[str, Any], *keys: str) -> Any | None:
    for key in keys:
        value = values.get(key)
        if value not in (None, ""):
            return value
    return None


def _raw_int(values: dict[str, Any], *keys: str) -> int | None:
    value = _first_value(values, *keys)
    try:
        return round(float(value)) if value is not None else None
    except (TypeError, ValueError):
        return None


def _raw_float(values: dict[str, Any], *keys: str) -> float | None:
    value = _first_value(values, *keys)
    try:
        return round(float(value), 2) if value is not None else None
    except (TypeError, ValueError):
        return None


def _elapsed_ms(started: float) -> int:
    return round((perf_counter() - started) * 1000)


TOOL_REGISTRY: dict[str, ToolCallable] = {
    TOOL_GET_RUNNER_PROFILE: get_runner_profile,
    TOOL_GET_RECENT_RUNS: get_recent_runs,
    TOOL_GET_UPCOMING_WORKOUTS: get_upcoming_workouts,
    TOOL_WEEKLY_SUMMARY: calculate_weekly_running_summary,
    TOOL_PACE_GUIDANCE: calculate_pace_guidance,
    TOOL_RISK_SIGNALS: detect_training_risk_signals,
}
