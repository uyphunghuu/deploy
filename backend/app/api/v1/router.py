from fastapi import APIRouter

from app.api.v1 import admin, activities, ai, calendar, dashboard, insights, profiles, training, integrations

api_router = APIRouter()
api_router.include_router(profiles.router, prefix="/profile", tags=["profile"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(training.router, prefix="/training", tags=["training"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
