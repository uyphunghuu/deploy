import httpx
import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.models import Activity, SportType, IntegrationCredential

STRAVA_OAUTH_URL = "https://www.strava.com/oauth/token"
STRAVA_API_URL = "https://www.strava.com/api/v3"


class StravaService:
    def __init__(self):
        self.settings = get_settings()

    async def exchange_token(self, code: str) -> dict[str, Any]:
        if not self.settings.strava_client_id or not self.settings.strava_client_secret:
            raise ValueError("Strava credentials not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                STRAVA_OAUTH_URL,
                data={
                    "client_id": self.settings.strava_client_id,
                    "client_secret": self.settings.strava_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                },
            )
            response.raise_for_status()
            return response.json()

    async def refresh_token(self, refresh_token: str) -> dict[str, Any]:
        if not self.settings.strava_client_id or not self.settings.strava_client_secret:
            raise ValueError("Strava credentials not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                STRAVA_OAUTH_URL,
                data={
                    "client_id": self.settings.strava_client_id,
                    "client_secret": self.settings.strava_client_secret,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            response.raise_for_status()
            return response.json()

    async def fetch_activities(self, access_token: str, per_page: int = 30) -> list[dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{STRAVA_API_URL}/athlete/activities",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"per_page": per_page},
            )
            response.raise_for_status()
            return response.json()

    async def sync_activities(self, session: AsyncSession, user_id: uuid.UUID, access_token: str) -> int:
        activities_data = await self.fetch_activities(access_token)
        count = 0

        # Strava sport types to our SportType enum
        type_mapping = {
            "Run": SportType.running,
            "Ride": SportType.cycling,
            "VirtualRide": SportType.cycling,
            "Swim": SportType.swimming,
            "WeightTraining": SportType.strength,
            "Workout": SportType.strength,
        }

        for act_data in activities_data:
            strava_id = str(act_data.get("id"))
            
            # Check if exists
            stmt = select(Activity).where(Activity.user_id == user_id, Activity.external_id == strava_id, Activity.source == "strava")
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                continue

            sport_str = act_data.get("type")
            sport = type_mapping.get(sport_str, SportType.running)  # default to running if unknown

            # Parse dates
            started_at_str = act_data.get("start_date")
            started_at = datetime.fromisoformat(started_at_str.replace("Z", "+00:00"))
            duration_seconds = act_data.get("elapsed_time", 0)
            distance_meters = act_data.get("distance", 0)
            distance_km = round(distance_meters / 1000.0, 2) if distance_meters else None

            # Create activity
            activity = Activity(
                user_id=user_id,
                sport=sport,
                title=act_data.get("name", "Strava Activity"),
                distance_km=distance_km,
                duration_seconds=duration_seconds,
                started_at=started_at,
                source="strava",
                external_id=strava_id,
                raw_payload=act_data
            )
            session.add(activity)
            count += 1
            
        await session.commit()
        return count
