import asyncio
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models import Activity, Profile, Role, SessionStatus, SportType, TrainingPlan, TrainingSession

DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEMO_ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(select(Profile).where(Profile.id == DEMO_USER_ID))
        if existing is None:
            user = Profile(
                id=DEMO_USER_ID,
                email="demo@slabai.app",
                first_name="Lam",
                last_name="Demo",
                primary_sport=SportType.running,
            )
            admin = Profile(
                id=DEMO_ADMIN_ID,
                email="admin@slabai.app",
                first_name="Admin",
                last_name="SLABAI",
                role=Role.ADMIN,
                primary_sport=SportType.running,
            )
            plan = TrainingPlan(
                user_id=DEMO_USER_ID,
                name="Demo Running Plan",
                sport=SportType.running,
                starts_on=date.today(),
                generated_by="seed",
            )
            session.add_all([user, admin, plan])
            await session.flush()
            session.add_all(
                [
                    TrainingSession(
                        user_id=DEMO_USER_ID,
                        plan_id=plan.id,
                        scheduled_date=date.today(),
                        sport=SportType.running,
                        title="Aerobic Development",
                        duration_minutes=35,
                        intensity="Zone 2",
                        status=SessionStatus.planned,
                    ),
                    Activity(
                        user_id=DEMO_USER_ID,
                        sport=SportType.running,
                        title="Morning Run",
                        distance_km=5.1,
                        duration_seconds=1800,
                        pace_seconds_per_km=353,
                        started_at=datetime.now(timezone.utc),
                    ),
                ]
            )
            await session.commit()
            print("Seeded demo user, admin, plan, session, and activity.")
        else:
            print("Development seed already exists.")


if __name__ == "__main__":
    asyncio.run(main())

