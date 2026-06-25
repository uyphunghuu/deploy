from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import SupabaseJWTVerifier
from app.db.session import get_db
from app.models import AccountStatus, Profile, Role

bearer_scheme = HTTPBearer(auto_error=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async for session in get_db():
        yield session


async def get_current_profile(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> Profile:
    if credentials is None:
        print("DEBUG 401: credentials is None")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    print(f"DEBUG 401: received token: {credentials.credentials[:10]}...")
    claims = SupabaseJWTVerifier(settings).verify(credentials.credentials)
    print(f"DEBUG 401: claims: {claims}")
    
    try:
        user_id = uuid.UUID(claims.sub)
    except ValueError as exc:
        print(f"DEBUG 401: ValueError {exc}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user id.") from exc

    profile = await session.get(Profile, user_id)
    if profile is None:
        if not claims.email:
            print("DEBUG 401: missing email claim")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token email is required.")
        profile = Profile(id=user_id, email=claims.email)
        session.add(profile)
        await session.commit()
        await session.refresh(profile)

    if profile.status == AccountStatus.SUSPENDED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended.")
    return profile


async def require_admin(profile: Profile = Depends(get_current_profile)) -> Profile:
    if profile.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")
    return profile

