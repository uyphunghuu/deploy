import os
import uuid
from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SUPABASE_JWT_AUDIENCE", "authenticated")

from app.api.deps import get_current_profile, get_session  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.models import AccountStatus, Profile, Role, SportType  # noqa: E402

TEST_USER_ID = uuid.UUID("10000000-0000-0000-0000-000000000001")
OTHER_USER_ID = uuid.UUID("10000000-0000-0000-0000-000000000002")
ADMIN_USER_ID = uuid.UUID("10000000-0000-0000-0000-000000000003")
SUSPENDED_USER_ID = uuid.UUID("10000000-0000-0000-0000-000000000004")


@pytest.fixture()
async def db_session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        session.add_all(
            [
                Profile(
                    id=TEST_USER_ID,
                    email="user@slabai.app",
                    first_name="User",
                    primary_sport=SportType.running,
                ),
                Profile(
                    id=OTHER_USER_ID,
                    email="other@slabai.app",
                    first_name="Other",
                    primary_sport=SportType.running,
                ),
                Profile(
                    id=ADMIN_USER_ID,
                    email="admin@slabai.app",
                    first_name="Admin",
                    role=Role.ADMIN,
                    primary_sport=SportType.running,
                ),
                Profile(
                    id=SUSPENDED_USER_ID,
                    email="suspended@slabai.app",
                    first_name="Suspended",
                    status=AccountStatus.SUSPENDED,
                    primary_sport=SportType.running,
                ),
            ]
        )
        await session.commit()
        yield session

    await engine.dispose()


@pytest.fixture()
async def client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def override_session() -> AsyncIterator[AsyncSession]:
        yield db_session

    async def override_profile() -> Profile:
        profile = await db_session.get(Profile, TEST_USER_ID)
        assert profile is not None
        if profile.status == AccountStatus.SUSPENDED:
            raise AssertionError("Test user should be active")
        return profile

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_profile] = override_profile
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
async def admin_client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def override_session() -> AsyncIterator[AsyncSession]:
        yield db_session

    async def override_profile() -> Profile:
        profile = await db_session.get(Profile, ADMIN_USER_ID)
        assert profile is not None
        return profile

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_profile] = override_profile
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as test_client:
        yield test_client
    app.dependency_overrides.clear()
