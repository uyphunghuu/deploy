from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile, get_session
from app.models import Activity, Profile, TrainingSession
from app.schemas import CalendarEvent, CalendarResponse

router = APIRouter()


@router.get("", response_model=CalendarResponse)
async def read_calendar(
    date_from: date = Query(...),
    date_to: date = Query(...),
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> CalendarResponse:
    sessions = await session.scalars(
        select(TrainingSession).where(
            and_(
                TrainingSession.user_id == profile.id,
                TrainingSession.scheduled_date >= date_from,
                TrainingSession.scheduled_date <= date_to,
            )
        )
    )
    start_dt = datetime.combine(date_from, time.min)
    end_dt = datetime.combine(date_to, time.max)
    activities = await session.scalars(
        select(Activity).where(
            and_(
                Activity.user_id == profile.id,
                Activity.started_at >= start_dt,
                Activity.started_at <= end_dt,
            )
        )
    )

    events = [
        CalendarEvent(
            id=item.id,
            date=item.scheduled_date,
            sport=item.sport,
            title=item.title,
            duration_minutes=item.duration_minutes,
            distance_km=float(item.distance_km) if item.distance_km is not None else None,
            intensity=item.intensity,
            status=item.status.value,
            source="training_session",
        )
        for item in sessions
    ]
    events.extend(
        CalendarEvent(
            id=item.id,
            date=item.started_at.date(),
            sport=item.sport,
            title=item.title,
            duration_minutes=round(item.duration_seconds / 60) if item.duration_seconds is not None else None,
            distance_km=float(item.distance_km) if item.distance_km is not None else None,
            status="completed",
            source="activity",
        )
        for item in activities
    )
    events.sort(key=lambda event: (event.date, event.title))
    return CalendarResponse(range={"from": date_from, "to": date_to}, events=events)

