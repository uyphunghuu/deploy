from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile, get_session
from app.models import Profile, UserSport
from app.schemas import ProfileRead, ProfileUpdate, UserSportRead, UserSportUpsert

router = APIRouter()


@router.get("", response_model=ProfileRead)
async def read_profile(profile: Profile = Depends(get_current_profile)) -> Profile:
    return profile


@router.patch("", response_model=ProfileRead)
async def update_profile(
    payload: ProfileUpdate,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> Profile:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await session.commit()
    await session.refresh(profile)
    return profile


@router.get("/sports", response_model=list[UserSportRead])
async def list_user_sports(
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> list[UserSport]:
    result = await session.scalars(
        select(UserSport).where(UserSport.user_id == profile.id).order_by(UserSport.created_at)
    )
    return list(result)


@router.put("/sports", response_model=UserSportRead)
async def upsert_user_sport(
    payload: UserSportUpsert,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> UserSport:
    result = await session.scalars(
        select(UserSport).where(UserSport.user_id == profile.id, UserSport.sport == payload.sport)
    )
    user_sport = result.first()
    if user_sport is None:
        user_sport = UserSport(user_id=profile.id, **payload.model_dump())
        session.add(user_sport)
    else:
        for field, value in payload.model_dump().items():
            setattr(user_sport, field, value)
    await session.commit()
    await session.refresh(user_sport)
    return user_sport
