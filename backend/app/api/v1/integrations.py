from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from urllib.parse import urlencode

from app.api.deps import get_current_profile, get_db
from app.core.config import get_settings
from app.models import Profile, IntegrationCredential
from app.services.strava import StravaService
import httpx

router = APIRouter()
settings = get_settings()
strava_service = StravaService()


@router.get("/")
async def get_integrations(
    current_user: Profile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    """Get the current integration status for the user."""
    stmt = select(IntegrationCredential).where(IntegrationCredential.user_id == current_user.id)
    result = await db.execute(stmt)
    credentials = result.scalars().all()
    
    status_map = {
        "strava": {"connected": False},
        "garmin": {"connected": False},
        "coros": {"connected": False},
    }
    
    for cred in credentials:
        status_map[cred.provider] = {
            "connected": True,
            "athlete_id": cred.athlete_id,
        }
        
    return status_map


@router.get("/strava/login")
async def strava_login():
    """Returns the Strava OAuth login URL."""
    if not settings.strava_client_id:
        raise HTTPException(status_code=500, detail="Strava credentials not configured")
        
    # Redirect back to frontend
    redirect_uri = "http://localhost:3000/strava-callback"
    
    params = {
        "client_id": settings.strava_client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "approval_prompt": "force",
        "scope": "activity:read_all",
    }
    
    url = f"https://www.strava.com/oauth/authorize?{urlencode(params)}"
    return {"url": url}


@router.post("/strava/callback")
async def strava_callback(
    code: str,
    current_user: Profile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    """Exchange code for token and save credentials."""
    try:
        token_data = await strava_service.exchange_token(code)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange token: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    athlete = token_data.get("athlete", {})
    athlete_id = str(athlete.get("id"))
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_at_ts = token_data.get("expires_at")
    
    expires_at = None
    if expires_at_ts:
        expires_at = datetime.fromtimestamp(expires_at_ts, tz=timezone.utc)
        
    # Check if we already have credentials for this user and provider
    stmt = select(IntegrationCredential).where(
        IntegrationCredential.user_id == current_user.id,
        IntegrationCredential.provider == "strava"
    )
    result = await db.execute(stmt)
    cred = result.scalar_one_or_none()
    
    if cred:
        cred.access_token = access_token
        cred.refresh_token = refresh_token
        cred.expires_at = expires_at
        cred.athlete_id = athlete_id
    else:
        cred = IntegrationCredential(
            user_id=current_user.id,
            provider="strava",
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            athlete_id=athlete_id
        )
        db.add(cred)
        
    await db.commit()
    
    # Auto-sync immediately after successful connect
    try:
        await strava_service.sync_activities(db, current_user.id, access_token)
    except Exception as e:
        print(f"Auto-sync failed: {e}") # Non-fatal error for the callback

    return {"message": "Strava connected successfully"}


@router.post("/strava/sync")
async def strava_sync(
    current_user: Profile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db),
):
    """Sync activities from Strava."""
    stmt = select(IntegrationCredential).where(
        IntegrationCredential.user_id == current_user.id,
        IntegrationCredential.provider == "strava"
    )
    result = await db.execute(stmt)
    cred = result.scalar_one_or_none()
    
    if not cred:
        raise HTTPException(status_code=400, detail="Strava not connected")
        
    # Check if token is expired, refresh if needed
    if cred.expires_at and cred.expires_at < datetime.now(timezone.utc):
        try:
            token_data = await strava_service.refresh_token(cred.refresh_token)
            cred.access_token = token_data.get("access_token")
            cred.refresh_token = token_data.get("refresh_token")
            expires_at_ts = token_data.get("expires_at")
            if expires_at_ts:
                cred.expires_at = datetime.fromtimestamp(expires_at_ts, tz=timezone.utc)
            db.add(cred)
            await db.commit()
        except Exception as e:
            raise HTTPException(status_code=401, detail="Failed to refresh Strava token. Please reconnect.")

    try:
        count = await strava_service.sync_activities(db, current_user.id, cred.access_token)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch from Strava: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"message": f"Synced {count} activities"}
