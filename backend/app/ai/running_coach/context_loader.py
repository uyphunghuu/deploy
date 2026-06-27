from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.running_coach.schemas import (
    RunningActivitySummary,
    RunningAthleteProfile,
    RunningCoachContext,
    RunningCoachKnownPaceZoneContext,
    RunningCoachPersonalizedContext,
    RunningCoachPlannedWorkoutContext,
    RunningCoachProfileContext,
    RunningCoachRecentTrainingContext,
    RunningCoachUpcomingPlanContext,
    RunningCoachUserContext,
    RunningPlanSummary,
    RunningSessionSummary,
    RunningSportProfile,
)
from app.ai.running_coach.tools import calculate_weekly_running_summary_from_runs, format_pace
from app.models import Activity, PlanStatus, Profile, SportType, TrainingPlan, TrainingSession, UserSport


@dataclass(frozen=True)
class RunningCoachContextLoadOptions:
    include_recent_training: bool = False
    include_upcoming_plan: bool = False
    recent_runs_limit: int = 5
    upcoming_days: int = 14


def context_load_options_for_intent(intent: str, message: str) -> RunningCoachContextLoadOptions:
    normalized = message.lower()
    if intent == "activity_analysis":
        return RunningCoachContextLoadOptions(
            include_recent_training=True,
            recent_runs_limit=1 if _asks_for_latest_activity(normalized) else 5,
        )
    if intent == "plan_question":
        return RunningCoachContextLoadOptions(include_upcoming_plan=True)
    if intent == "workout_advice":
        return RunningCoachContextLoadOptions(include_recent_training=True, include_upcoming_plan=True)
    if intent in {"recovery", "injury_risk"}:
        return RunningCoachContextLoadOptions(include_recent_training=True)
    if any(term in normalized for term in ("dữ liệu", "du lieu", "số liệu", "so lieu", "km", "pace", "load")):
        return RunningCoachContextLoadOptions(include_recent_training=True)
    return RunningCoachContextLoadOptions()


async def load_running_coach_context(
    session: AsyncSession,
    profile: Profile,
    *,
    options: RunningCoachContextLoadOptions | None = None,
    today: date | None = None,
) -> RunningCoachContext:
    load_options = options or RunningCoachContextLoadOptions(include_recent_training=True, include_upcoming_plan=True)
    anchor = today or date.today()
    user_sport = await _get_running_sport(session, profile)
    recent_runs = await _load_recent_runs(session, profile, load_options, today=anchor)
    weekly_runs = (
        await _load_weekly_runs(session, profile, today=anchor) if load_options.include_recent_training else []
    )
    active_plans = await _load_active_plans(session, profile) if load_options.include_upcoming_plan else []
    upcoming_sessions = await _load_upcoming_sessions(session, profile, load_options, today=anchor)

    recent_training = (
        _build_recent_training(weekly_runs=weekly_runs, recent_runs=recent_runs, today=anchor)
        if load_options.include_recent_training
        else None
    )
    weekly_distance = recent_training.distance_7_days if recent_training else None
    run_count = len([item for item in weekly_runs if anchor - timedelta(days=6) <= item.started_on <= anchor])
    personalized = _build_personalized_context(
        profile=profile,
        user_sport=user_sport,
        recent_training=recent_training,
        upcoming_plan=_build_upcoming_plan(active_plans, upcoming_sessions)
        if load_options.include_upcoming_plan
        else None,
        current_weekly_distance=weekly_distance,
        weekly_frequency=run_count if load_options.include_recent_training else None,
        loaded_sections=_loaded_sections(load_options),
    )

    return RunningCoachContext(
        profile=RunningAthleteProfile(
            first_name=profile.first_name,
            primary_sport=profile.primary_sport.value,
            height_cm=profile.height_cm,
            weight_kg=float(profile.weight_kg) if profile.weight_kg is not None else None,
        ),
        sports=[_sport_summary(user_sport)] if user_sport else [],
        recent_activities=recent_runs,
        active_plans=active_plans,
        upcoming_sessions=upcoming_sessions,
        weekly_mileage_km=weekly_distance,
        training_load_note="Training load requires intensity data that is not fully available yet.",
        personalized=personalized,
    )


async def _get_running_sport(session: AsyncSession, profile: Profile) -> UserSport | None:
    return await session.scalar(
        select(UserSport)
        .where(UserSport.user_id == profile.id, UserSport.sport == SportType.running)
        .order_by(UserSport.updated_at.desc())
        .limit(1)
    )


async def _load_recent_runs(
    session: AsyncSession,
    profile: Profile,
    options: RunningCoachContextLoadOptions,
    *,
    today: date,
) -> list[RunningActivitySummary]:
    if not options.include_recent_training:
        return []
    rows = await session.scalars(
        select(Activity)
        .where(
            Activity.user_id == profile.id,
            Activity.sport == SportType.running,
            Activity.started_at >= datetime.combine(today - timedelta(days=90), time.min),
        )
        .order_by(Activity.started_at.desc())
        .limit(max(options.recent_runs_limit, 1))
    )
    return [_activity_summary(item) for item in rows]


async def _load_weekly_runs(
    session: AsyncSession,
    profile: Profile,
    *,
    today: date,
) -> list[RunningActivitySummary]:
    rows = await session.scalars(
        select(Activity)
        .where(
            Activity.user_id == profile.id,
            Activity.sport == SportType.running,
            Activity.started_at >= datetime.combine(today - timedelta(days=13), time.min),
            Activity.started_at <= datetime.combine(today, time.max),
        )
        .order_by(Activity.started_at.desc())
    )
    return [_activity_summary(item) for item in rows]


async def _load_active_plans(session: AsyncSession, profile: Profile) -> list[RunningPlanSummary]:
    rows = await session.scalars(
        select(TrainingPlan)
        .where(
            TrainingPlan.user_id == profile.id,
            TrainingPlan.sport == SportType.running,
            TrainingPlan.status.in_([PlanStatus.active, PlanStatus.generated]),
        )
        .order_by(TrainingPlan.updated_at.desc())
        .limit(2)
    )
    return [
        RunningPlanSummary(
            name=item.name,
            status=item.status.value,
            starts_on=item.starts_on,
            ends_on=item.ends_on,
        )
        for item in rows
    ]


async def _load_upcoming_sessions(
    session: AsyncSession,
    profile: Profile,
    options: RunningCoachContextLoadOptions,
    *,
    today: date,
) -> list[RunningSessionSummary]:
    if not options.include_upcoming_plan:
        return []
    rows = await session.scalars(
        select(TrainingSession)
        .where(
            TrainingSession.user_id == profile.id,
            TrainingSession.sport == SportType.running,
            TrainingSession.scheduled_date >= today,
            TrainingSession.scheduled_date <= today + timedelta(days=options.upcoming_days),
        )
        .order_by(TrainingSession.scheduled_date)
        .limit(8)
    )
    return [
        RunningSessionSummary(
            scheduled_date=item.scheduled_date,
            title=item.title,
            duration_minutes=item.duration_minutes,
            distance_km=float(item.distance_km) if item.distance_km is not None else None,
            intensity=item.intensity,
            status=item.status.value,
        )
        for item in rows
    ]


def _build_personalized_context(
    *,
    profile: Profile,
    user_sport: UserSport | None,
    recent_training: RunningCoachRecentTrainingContext | None,
    upcoming_plan: RunningCoachUpcomingPlanContext | None,
    current_weekly_distance: float | None,
    weekly_frequency: int | None,
    loaded_sections: list[str],
) -> RunningCoachPersonalizedContext:
    target_distance, target_date = _target_goal(user_sport)
    known_pace_or_zone = RunningCoachKnownPaceZoneContext(
        pace_seconds_per_km=user_sport.pace_seconds_per_km if user_sport else None,
        pace=format_pace(user_sport.pace_seconds_per_km) if user_sport and user_sport.pace_seconds_per_km else None,
        heart_rate_bpm=user_sport.heart_rate_bpm if user_sport else None,
        power_watts=user_sport.power_watts if user_sport else None,
    )
    missing_data = _missing_data(
        profile=profile,
        user_sport=user_sport,
        target_distance=target_distance,
        target_date=target_date,
        weekly_frequency=weekly_frequency,
        current_weekly_distance=current_weekly_distance,
        recent_training=recent_training,
        upcoming_plan=upcoming_plan,
        loaded_sections=loaded_sections,
    )

    return RunningCoachPersonalizedContext(
        user=RunningCoachUserContext(
            display_name=profile.first_name,
            age=_age(profile.date_of_birth),
            height_cm=profile.height_cm,
            weight_kg=float(profile.weight_kg) if profile.weight_kg is not None else None,
        ),
        running_profile=RunningCoachProfileContext(
            primary_sport=profile.primary_sport.value,
            experience_level=user_sport.volume if user_sport else None,
            target_distance=target_distance,
            target_date=target_date,
            weekly_frequency=weekly_frequency,
            current_weekly_distance=current_weekly_distance,
            preferred_training_days=[],
            goal_mode=user_sport.goal_mode.value if user_sport else None,
            fitness_focus=user_sport.fitness_focus if user_sport else None,
            fitness_duration_weeks=user_sport.fitness_duration_weeks if user_sport else None,
            volume=user_sport.volume if user_sport else None,
            schedule_mode=user_sport.schedule_mode if user_sport else None,
            build_progression=user_sport.build_progression if user_sport else None,
            known_pace_or_zone=known_pace_or_zone,
        ),
        recent_training=recent_training,
        upcoming_plan=upcoming_plan,
        missing_data=missing_data,
        loaded_sections=loaded_sections,
    )


def _build_recent_training(
    *,
    weekly_runs: list[RunningActivitySummary],
    recent_runs: list[RunningActivitySummary],
    today: date,
) -> RunningCoachRecentTrainingContext | None:
    if not weekly_runs and not recent_runs:
        return RunningCoachRecentTrainingContext(
            recent_runs=[],
            distance_7_days=0.0,
            previous_7_day_distance=0.0,
            longest_run=None,
            rest_days=[(today - timedelta(days=offset)).isoformat() for offset in range(0, 7)],
            latest_activity_date=None,
        )

    summary = calculate_weekly_running_summary_from_runs(weekly_runs, today=today)
    latest_activity_date = (
        recent_runs[0].started_on if recent_runs else max((item.started_on for item in weekly_runs), default=None)
    )

    return RunningCoachRecentTrainingContext(
        recent_runs=recent_runs,
        distance_7_days=summary["total_km_7_days"],
        previous_7_day_distance=summary["total_km_previous_7_days"],
        longest_run=_dict_to_activity_summary(summary["longest_run"]),
        rest_days=_rest_days(weekly_runs, today=today),
        latest_activity_date=latest_activity_date,
    )


def _build_upcoming_plan(
    active_plans: list[RunningPlanSummary],
    upcoming_sessions: list[RunningSessionSummary],
) -> RunningCoachUpcomingPlanContext:
    return RunningCoachUpcomingPlanContext(
        active_plans=active_plans,
        planned_workouts=[
            RunningCoachPlannedWorkoutContext(
                scheduled_date=item.scheduled_date,
                workout_type=item.title,
                title=item.title,
                target_distance_km=item.distance_km,
                target_duration_minutes=item.duration_minutes,
                intensity=item.intensity,
                status=item.status,
            )
            for item in upcoming_sessions
        ],
    )


def _sport_summary(user_sport: UserSport) -> RunningSportProfile:
    return RunningSportProfile(
        sport=user_sport.sport.value,
        goal_mode=user_sport.goal_mode.value,
        fitness_focus=user_sport.fitness_focus,
        fitness_duration_weeks=user_sport.fitness_duration_weeks,
        volume=user_sport.volume,
        schedule_mode=user_sport.schedule_mode,
        heart_rate_bpm=user_sport.heart_rate_bpm,
        pace_seconds_per_km=user_sport.pace_seconds_per_km,
        power_watts=user_sport.power_watts,
        build_progression=user_sport.build_progression,
    )


def _activity_summary(activity: Activity) -> RunningActivitySummary:
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


def _dict_to_activity_summary(value: dict[str, Any] | None) -> RunningActivitySummary | None:
    if not value:
        return None
    activity_date = value.get("date")
    if not isinstance(activity_date, str):
        return None
    return RunningActivitySummary(
        sport=str(value.get("sport") or "running"),
        title=str(value.get("title") or "Run"),
        started_on=date.fromisoformat(activity_date),
        distance_km=_float_or_none(value.get("distance_km")),
        duration_seconds=_int_or_none(value.get("duration_seconds")),
        pace_seconds_per_km=_int_or_none(value.get("pace_seconds_per_km")),
        heart_rate_bpm=_int_or_none(value.get("heart_rate_bpm")),
        cadence_spm=_int_or_none(value.get("cadence_spm")),
        elevation_m=_float_or_none(value.get("elevation_m")),
    )


def _target_goal(user_sport: UserSport | None) -> tuple[str | float | int | None, str | None]:
    if user_sport is None:
        return None, None
    race_goal = user_sport.race_goal if isinstance(user_sport.race_goal, dict) else {}
    target_distance = _first_value(race_goal, "distance", "distanceKm", "distance_km", "targetDistance")
    target_date = _first_value(race_goal, "date", "raceDate", "race_date", "targetDate", "target_date")
    if target_distance is None and user_sport.fitness_focus in {"5k", "10k", "half-marathon"}:
        target_distance = user_sport.fitness_focus
    return target_distance, str(target_date) if target_date is not None else None


def _missing_data(
    *,
    profile: Profile,
    user_sport: UserSport | None,
    target_distance: str | float | int | None,
    target_date: str | None,
    weekly_frequency: int | None,
    current_weekly_distance: float | None,
    recent_training: RunningCoachRecentTrainingContext | None,
    upcoming_plan: RunningCoachUpcomingPlanContext | None,
    loaded_sections: list[str],
) -> list[str]:
    missing = []
    if profile.date_of_birth is None:
        missing.append("user.age")
    if profile.height_cm is None:
        missing.append("user.height_cm")
    if profile.weight_kg is None:
        missing.append("user.weight_kg")
    if user_sport is None:
        missing.append("running_profile")
    if target_distance is None:
        missing.append("running_profile.target_distance")
    if target_date is None:
        missing.append("running_profile.target_date")
    if user_sport and user_sport.pace_seconds_per_km is None and user_sport.heart_rate_bpm is None:
        missing.append("running_profile.known_pace_or_zone")
    if "recent_training" in loaded_sections:
        if weekly_frequency is None:
            missing.append("running_profile.weekly_frequency")
        if current_weekly_distance is None:
            missing.append("running_profile.current_weekly_distance")
        if recent_training is None or not recent_training.recent_runs:
            missing.append("recent_training.recent_runs")
    if "upcoming_plan" in loaded_sections and (upcoming_plan is None or not upcoming_plan.planned_workouts):
        missing.append("upcoming_plan.planned_workouts")
    missing.append("running_profile.preferred_training_days")
    return list(dict.fromkeys(missing))


def _loaded_sections(options: RunningCoachContextLoadOptions) -> list[str]:
    sections = ["user", "running_profile"]
    if options.include_recent_training:
        sections.append("recent_training")
    if options.include_upcoming_plan:
        sections.append("upcoming_plan")
    return sections


def _rest_days(runs: list[RunningActivitySummary], *, today: date) -> list[str]:
    run_dates = {item.started_on for item in runs}
    return [
        (today - timedelta(days=offset)).isoformat()
        for offset in range(0, 7)
        if today - timedelta(days=offset) not in run_dates
    ]


def _age(date_of_birth: date | None, *, today: date | None = None) -> int | None:
    if date_of_birth is None:
        return None
    anchor = today or date.today()
    years = anchor.year - date_of_birth.year
    if (anchor.month, anchor.day) < (date_of_birth.month, date_of_birth.day):
        years -= 1
    return years


def _asks_for_latest_activity(message: str) -> bool:
    return any(term in message for term in ("gần nhất", "gan nhat", "latest", "last run", "buổi chạy vừa"))


def _first_value(values: dict[str, Any], *keys: str) -> Any | None:
    for key in keys:
        value = values.get(key)
        if value not in (None, ""):
            return value
    return None


def _raw_int(values: dict[str, Any], *keys: str) -> int | None:
    return _int_or_none(_first_value(values, *keys))


def _raw_float(values: dict[str, Any], *keys: str) -> float | None:
    return _float_or_none(_first_value(values, *keys))


def _int_or_none(value: Any) -> int | None:
    try:
        return round(float(value)) if value is not None else None
    except (TypeError, ValueError):
        return None


def _float_or_none(value: Any) -> float | None:
    try:
        return round(float(value), 2) if value is not None else None
    except (TypeError, ValueError):
        return None
