from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile, get_session
from app.models import Activity, Profile, SportType
from app.schemas import InsightPoint, InsightsResponse

router = APIRouter()


@router.get("/profiles-zones", response_model=InsightsResponse)
async def read_profiles_zones(
    sport: SportType = SportType.running,
    range_key: str = Query(default="6w", pattern="^(6w|12w|24w)$"),
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> InsightsResponse:
    result = await session.scalars(
        select(Activity)
        .where(Activity.user_id == profile.id, Activity.sport == sport, Activity.pace_seconds_per_km.is_not(None))
        .order_by(Activity.started_at.desc())
        .limit(20)
    )
    activities = list(result)
    paces = sorted(int(item.pace_seconds_per_km or 0) for item in activities if item.pace_seconds_per_km)
    baseline = paces[len(paces) // 2] if paces else 360
    curve = [
        InsightPoint(duration_seconds=60, pace_seconds_per_km=max(120, baseline - 55)),
        InsightPoint(duration_seconds=300, pace_seconds_per_km=max(120, baseline - 25)),
        InsightPoint(duration_seconds=600, pace_seconds_per_km=baseline),
        InsightPoint(duration_seconds=1800, pace_seconds_per_km=baseline + 35),
        InsightPoint(duration_seconds=3600, pace_seconds_per_km=baseline + 55),
    ]
    return InsightsResponse(
        sport=sport,
        range=range_key,
        metrics={
            "aerobicThresholdPace": _format_pace(baseline + 60),
            "thresholdPace": _format_pace(baseline),
            "vo2MaxPace": _format_pace(max(120, baseline - 35)),
            "sprintPace": _format_pace(max(90, baseline - 120)),
        },
        curve=curve,
    )


def _format_pace(seconds_per_km: int) -> str:
    minutes, seconds = divmod(seconds_per_km, 60)
    return f"{minutes}:{seconds:02d}/km"
