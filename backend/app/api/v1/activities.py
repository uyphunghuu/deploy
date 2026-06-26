import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile, get_session
from app.core.pagination import DEFAULT_LIMIT, LimitQuery, OffsetQuery
from app.models import Activity, Profile, SportType
from app.schemas import ActivityCreate, ActivityRead, ActivityUpdate

router = APIRouter()


@router.get("", response_model=list[ActivityRead])
async def list_activities(
    sport: SportType | None = None,
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    limit: LimitQuery = DEFAULT_LIMIT,
    offset: OffsetQuery = 0,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> list[Activity]:
    filters = [Activity.user_id == profile.id]
    if sport:
        filters.append(Activity.sport == sport)
    if date_from:
        filters.append(Activity.started_at >= date_from)
    if date_to:
        filters.append(Activity.started_at <= date_to)
    result = await session.scalars(
        select(Activity).where(and_(*filters)).order_by(Activity.started_at.desc()).limit(limit).offset(offset)
    )
    return list(result)


@router.post("", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
async def create_activity(
    payload: ActivityCreate,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> Activity:
    activity = Activity(user_id=profile.id, **payload.model_dump())
    session.add(activity)
    await session.commit()
    await session.refresh(activity)
    return activity


@router.get("/{activity_id}", response_model=ActivityRead)
async def get_activity(
    activity_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> Activity:
    activity = await session.get(Activity, activity_id)
    if activity is None or activity.user_id != profile.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")
    return activity


@router.patch("/{activity_id}", response_model=ActivityRead)
async def update_activity(
    activity_id: uuid.UUID,
    payload: ActivityUpdate,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> Activity:
    activity = await get_activity(activity_id, profile, session)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)
    await session.commit()
    await session.refresh(activity)
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> None:
    activity = await get_activity(activity_id, profile, session)
    await session.delete(activity)
    await session.commit()
