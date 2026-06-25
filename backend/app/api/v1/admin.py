import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session, require_admin
from app.core.pagination import DEFAULT_LIMIT, LimitQuery, OffsetQuery
from app.models import Activity, Profile, TrainingPlan
from app.schemas import ActivityRead, AdminProfileUpdate, ProfileRead, TrainingPlanRead

router = APIRouter()


@router.get("/profiles", response_model=list[ProfileRead])
async def list_profiles(
    limit: LimitQuery = DEFAULT_LIMIT,
    offset: OffsetQuery = 0,
    _: Profile = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[Profile]:
    result = await session.scalars(select(Profile).order_by(Profile.created_at.desc()).limit(limit).offset(offset))
    return list(result)


@router.patch("/profiles/{profile_id}", response_model=ProfileRead)
async def update_profile_status_or_role(
    profile_id: uuid.UUID,
    payload: AdminProfileUpdate,
    _: Profile = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> Profile:
    profile = await session.get(Profile, profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.get("/training-plans", response_model=list[TrainingPlanRead])
async def list_training_plans(
    limit: LimitQuery = DEFAULT_LIMIT,
    offset: OffsetQuery = 0,
    _: Profile = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[TrainingPlan]:
    result = await session.scalars(
        select(TrainingPlan).order_by(TrainingPlan.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result)


@router.get("/activities", response_model=list[ActivityRead])
async def list_all_activities(
    limit: LimitQuery = DEFAULT_LIMIT,
    offset: OffsetQuery = 0,
    _: Profile = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[Activity]:
    result = await session.scalars(select(Activity).order_by(Activity.started_at.desc()).limit(limit).offset(offset))
    return list(result)
