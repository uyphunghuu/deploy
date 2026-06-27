from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile, get_session
from app.models import Activity, PlanStatus, Profile, SessionStatus, TrainingPlan, TrainingSession
from app.schemas import DashboardSummary

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def read_dashboard_summary(
    date_from: date = Query(...),
    date_to: date = Query(...),
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> DashboardSummary:
    start_dt = datetime.combine(date_from, time.min)
    end_dt = datetime.combine(date_to, time.max)

    activities_count = await session.scalar(
        select(func.count(Activity.id)).where(
            Activity.user_id == profile.id,
            Activity.started_at >= start_dt,
            Activity.started_at <= end_dt,
        )
    )
    total_distance = await session.scalar(
        select(func.coalesce(func.sum(Activity.distance_km), 0)).where(
            Activity.user_id == profile.id,
            Activity.started_at >= start_dt,
            Activity.started_at <= end_dt,
        )
    )
    total_duration = await session.scalar(
        select(func.coalesce(func.sum(Activity.duration_seconds), 0)).where(
            Activity.user_id == profile.id,
            Activity.started_at >= start_dt,
            Activity.started_at <= end_dt,
        )
    )
    upcoming_sessions = await session.scalar(
        select(func.count(TrainingSession.id)).where(
            TrainingSession.user_id == profile.id,
            TrainingSession.scheduled_date >= date.today(),
            TrainingSession.status == SessionStatus.planned,
        )
    )
    active_plans = await session.scalar(
        select(func.count(TrainingPlan.id)).where(
            TrainingPlan.user_id == profile.id,
            TrainingPlan.status.in_([PlanStatus.active, PlanStatus.generated]),
        )
    )
    return DashboardSummary(
        activities_count=activities_count or 0,
        total_distance_km=float(total_distance or 0),
        total_duration_seconds=int(total_duration or 0),
        upcoming_sessions_count=upcoming_sessions or 0,
        active_plans_count=active_plans or 0,
    )
