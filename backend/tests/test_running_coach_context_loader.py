from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.running_coach.context_loader import context_load_options_for_intent, load_running_coach_context
from app.models import Activity, GoalMode, PlanStatus, Profile, SportType, TrainingPlan, TrainingSession, UserSport
from tests.conftest import OTHER_USER_ID, TEST_USER_ID


@pytest.mark.asyncio
async def test_context_loader_builds_distinct_context_for_distinct_users(db_session: AsyncSession) -> None:
    today = date(2026, 1, 14)
    user = await db_session.get(Profile, TEST_USER_ID)
    other_user = await db_session.get(Profile, OTHER_USER_ID)
    assert user is not None
    assert other_user is not None

    user.first_name = "Lam"
    user.date_of_birth = date(1992, 5, 20)
    user.height_cm = 170
    user.weight_kg = 62.5
    other_user.first_name = "Mai"
    other_user.height_cm = 160

    db_session.add_all(
        [
            UserSport(
                user_id=user.id,
                sport=SportType.running,
                goal_mode=GoalMode.race,
                fitness_focus="10k",
                race_goal={"distanceKm": 10, "targetDate": "2026-03-01"},
                volume="mid",
                schedule_mode="ai-optimized",
                pace_seconds_per_km=330,
                build_progression="normal",
            ),
            UserSport(
                user_id=other_user.id,
                sport=SportType.running,
                goal_mode=GoalMode.fitness,
                fitness_focus="5k",
                volume="low",
                schedule_mode="custom",
                build_progression="maintain",
            ),
            Activity(
                user_id=user.id,
                sport=SportType.running,
                title="Tempo Run",
                distance_km=6.0,
                duration_seconds=1980,
                pace_seconds_per_km=330,
                started_at=datetime(2026, 1, 14, 6, tzinfo=UTC),
                raw_payload={"average_heartrate": 150, "average_cadence": 172},
            ),
            Activity(
                user_id=user.id,
                sport=SportType.running,
                title="Previous Week Easy",
                distance_km=4.0,
                duration_seconds=1560,
                pace_seconds_per_km=390,
                started_at=datetime(2026, 1, 6, 6, tzinfo=UTC),
            ),
            Activity(
                user_id=other_user.id,
                sport=SportType.running,
                title="Short Easy",
                distance_km=2.0,
                duration_seconds=900,
                pace_seconds_per_km=450,
                started_at=datetime(2026, 1, 13, 6, tzinfo=UTC),
            ),
            TrainingPlan(
                user_id=user.id,
                name="10K Build",
                sport=SportType.running,
                status=PlanStatus.active,
                starts_on=today,
                ends_on=today + timedelta(days=28),
            ),
            TrainingSession(
                user_id=user.id,
                scheduled_date=today + timedelta(days=1),
                sport=SportType.running,
                title="Easy Run",
                duration_minutes=40,
                distance_km=6.5,
                intensity="Zone 2",
            ),
        ]
    )
    await db_session.commit()

    options = context_load_options_for_intent("workout_advice", "Hôm nay tôi nên chạy gì?")
    user_context = await load_running_coach_context(db_session, user, options=options, today=today)
    other_context = await load_running_coach_context(db_session, other_user, options=options, today=today)

    assert user_context.personalized is not None
    assert other_context.personalized is not None
    assert user_context.personalized.user.display_name == "Lam"
    assert other_context.personalized.user.display_name == "Mai"
    assert user_context.personalized.running_profile.target_distance == 10
    assert other_context.personalized.running_profile.target_distance == "5k"
    assert user_context.personalized.running_profile.current_weekly_distance == 6.0
    assert other_context.personalized.running_profile.current_weekly_distance == 2.0
    assert user_context.personalized.upcoming_plan is not None
    assert other_context.personalized.upcoming_plan is not None
    assert len(user_context.personalized.upcoming_plan.planned_workouts) == 1
    assert len(other_context.personalized.upcoming_plan.planned_workouts) == 0
    assert "@" not in str(user_context.personalized)


@pytest.mark.asyncio
async def test_context_loader_keeps_general_questions_minimal(db_session: AsyncSession) -> None:
    profile = await db_session.get(Profile, TEST_USER_ID)
    assert profile is not None
    db_session.add(
        Activity(
            user_id=profile.id,
            sport=SportType.running,
            title="Should Not Load",
            distance_km=5,
            duration_seconds=1800,
            pace_seconds_per_km=360,
            started_at=datetime(2026, 1, 14, 6, tzinfo=UTC),
        )
    )
    await db_session.commit()

    context = await load_running_coach_context(
        db_session,
        profile,
        options=context_load_options_for_intent("general_running", "Zone 2 là gì?"),
        today=date(2026, 1, 14),
    )

    assert context.personalized is not None
    assert context.personalized.loaded_sections == ["user", "running_profile"]
    assert context.personalized.recent_training is None
    assert context.personalized.upcoming_plan is None
    assert context.recent_activities == []
    assert context.upcoming_sessions == []


@pytest.mark.asyncio
async def test_context_loader_prioritizes_latest_run_for_activity_analysis(db_session: AsyncSession) -> None:
    profile = await db_session.get(Profile, TEST_USER_ID)
    assert profile is not None
    db_session.add_all(
        [
            Activity(
                user_id=profile.id,
                sport=SportType.running,
                title="Older Run",
                distance_km=4,
                duration_seconds=1500,
                pace_seconds_per_km=375,
                started_at=datetime(2026, 1, 12, 6, tzinfo=UTC),
            ),
            Activity(
                user_id=profile.id,
                sport=SportType.running,
                title="Latest Run",
                distance_km=7,
                duration_seconds=2400,
                pace_seconds_per_km=343,
                started_at=datetime(2026, 1, 14, 6, tzinfo=UTC),
            ),
        ]
    )
    await db_session.commit()

    context = await load_running_coach_context(
        db_session,
        profile,
        options=context_load_options_for_intent("activity_analysis", "Phân tích buổi chạy gần nhất"),
        today=date(2026, 1, 14),
    )

    assert context.personalized is not None
    assert context.personalized.recent_training is not None
    assert [item.title for item in context.personalized.recent_training.recent_runs] == ["Latest Run"]
