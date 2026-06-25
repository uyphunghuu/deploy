import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile, get_session
from app.core.pagination import DEFAULT_LIMIT, LimitQuery, OffsetQuery
from app.models import PlanStatus, Profile, SportType, TrainingPlan, TrainingSession
from app.schemas import (
    GeneratePlanRequest,
    TrainingPlanCreate,
    TrainingPlanRead,
    TrainingPlanUpdate,
    TrainingSessionCreate,
    TrainingSessionRead,
    TrainingSessionUpdate,
)

router = APIRouter()


async def _get_owned_plan(plan_id: uuid.UUID, profile: Profile, session: AsyncSession) -> TrainingPlan:
    plan = await session.get(TrainingPlan, plan_id)
    if plan is None or plan.user_id != profile.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training plan not found.")
    return plan


async def _get_owned_session(session_id: uuid.UUID, profile: Profile, db: AsyncSession) -> TrainingSession:
    training_session = await db.get(TrainingSession, session_id)
    if training_session is None or training_session.user_id != profile.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found.")
    return training_session


@router.get("/plans", response_model=list[TrainingPlanRead])
async def list_plans(
    limit: LimitQuery = DEFAULT_LIMIT,
    offset: OffsetQuery = 0,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> list[TrainingPlan]:
    result = await session.scalars(
        select(TrainingPlan)
        .where(TrainingPlan.user_id == profile.id)
        .order_by(TrainingPlan.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result)


@router.post("/plans", response_model=TrainingPlanRead, status_code=status.HTTP_201_CREATED)
async def create_plan(
    payload: TrainingPlanCreate,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> TrainingPlan:
    plan = TrainingPlan(user_id=profile.id, **payload.model_dump())
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return plan


@router.post("/plans/generate", response_model=TrainingPlanRead, status_code=status.HTTP_201_CREATED)
async def generate_plan(
    payload: GeneratePlanRequest,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> TrainingPlan:
    plan = TrainingPlan(
        user_id=profile.id,
        name=payload.name,
        sport=payload.sport,
        status=PlanStatus.generated,
        starts_on=payload.starts_on,
        ends_on=payload.starts_on + timedelta(days=27),
        generated_by="deterministic",
        generation_metadata={"source": "mvp", "weeks": 4},
    )
    session.add(plan)
    await session.flush()

    templates = [
        ("Aerobic Development", 35, "Zone 2", 0),
        ("Strength & Conditioning", 30, "Strength", 2),
        ("Aerobic Development", 45, "Zone 2", 4),
        ("Rest", None, "Recovery", 5),
    ]
    for title, duration, intensity, offset in templates:
        session.add(
            TrainingSession(
                user_id=profile.id,
                plan_id=plan.id,
                scheduled_date=payload.starts_on + timedelta(days=offset),
                sport=payload.sport if title != "Strength & Conditioning" else SportType.strength,
                title=title,
                duration_minutes=duration,
                intensity=intensity,
            )
        )

    await session.commit()
    await session.refresh(plan)
    return plan


@router.get("/plans/{plan_id}", response_model=TrainingPlanRead)
async def get_plan(
    plan_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> TrainingPlan:
    return await _get_owned_plan(plan_id, profile, session)


@router.patch("/plans/{plan_id}", response_model=TrainingPlanRead)
async def update_plan(
    plan_id: uuid.UUID,
    payload: TrainingPlanUpdate,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> TrainingPlan:
    plan = await _get_owned_plan(plan_id, profile, session)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    await session.commit()
    await session.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> None:
    plan = await _get_owned_plan(plan_id, profile, session)
    await session.delete(plan)
    await session.commit()


@router.get("/sessions", response_model=list[TrainingSessionRead])
async def list_sessions(
    limit: LimitQuery = DEFAULT_LIMIT,
    offset: OffsetQuery = 0,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> list[TrainingSession]:
    result = await session.scalars(
        select(TrainingSession)
        .where(TrainingSession.user_id == profile.id)
        .order_by(TrainingSession.scheduled_date)
        .limit(limit)
        .offset(offset)
    )
    return list(result)


@router.post("/sessions", response_model=TrainingSessionRead, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: TrainingSessionCreate,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> TrainingSession:
    if payload.plan_id is not None:
        await _get_owned_plan(payload.plan_id, profile, session)
    training_session = TrainingSession(user_id=profile.id, **payload.model_dump())
    session.add(training_session)
    await session.commit()
    await session.refresh(training_session)
    return training_session


@router.get("/sessions/{session_id}", response_model=TrainingSessionRead)
async def get_session_detail(
    session_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> TrainingSession:
    return await _get_owned_session(session_id, profile, session)


@router.patch("/sessions/{session_id}", response_model=TrainingSessionRead)
async def update_session(
    session_id: uuid.UUID,
    payload: TrainingSessionUpdate,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> TrainingSession:
    training_session = await _get_owned_session(session_id, profile, session)
    values = payload.model_dump(exclude_unset=True)
    if values.get("plan_id") is not None:
        await _get_owned_plan(values["plan_id"], profile, session)
    for field, value in values.items():
        setattr(training_session, field, value)
    await session.commit()
    await session.refresh(training_session)
    return training_session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> None:
    training_session = await _get_owned_session(session_id, profile, session)
    await session.delete(training_session)
    await session.commit()
