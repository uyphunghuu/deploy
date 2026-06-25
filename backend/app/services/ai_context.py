from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Activity, Profile, UserSport


@dataclass(frozen=True)
class AgentActivity:
    sport: str
    title: str
    distance_km: float | None
    duration_seconds: int | None
    pace_seconds_per_km: int | None


@dataclass(frozen=True)
class AgentProfile:
    first_name: str | None
    primary_sport: str


@dataclass(frozen=True)
class AgentSportPreference:
    sport: str
    goal_mode: str
    fitness_focus: str | None
    fitness_duration_weeks: int | None
    volume: str
    build_progression: str


@dataclass(frozen=True)
class AgentContext:
    profile: AgentProfile
    sports: list[AgentSportPreference]
    recent_activities: list[AgentActivity]


async def build_agent_context(session: AsyncSession, profile: Profile) -> AgentContext:
    sport_rows = await session.scalars(
        select(UserSport).where(UserSport.user_id == profile.id).order_by(UserSport.updated_at.desc()).limit(3)
    )
    activity_rows = await session.scalars(
        select(Activity).where(Activity.user_id == profile.id).order_by(Activity.started_at.desc()).limit(5)
    )

    return AgentContext(
        profile=AgentProfile(
            first_name=profile.first_name,
            primary_sport=profile.primary_sport.value,
        ),
        sports=[
            AgentSportPreference(
                sport=item.sport.value,
                goal_mode=item.goal_mode.value,
                fitness_focus=item.fitness_focus,
                fitness_duration_weeks=item.fitness_duration_weeks,
                volume=item.volume,
                build_progression=item.build_progression,
            )
            for item in sport_rows
        ],
        recent_activities=[
            AgentActivity(
                sport=item.sport.value,
                title=item.title,
                distance_km=float(item.distance_km) if item.distance_km is not None else None,
                duration_seconds=item.duration_seconds,
                pace_seconds_per_km=item.pace_seconds_per_km,
            )
            for item in activity_rows
        ],
    )

