from datetime import date, datetime, timezone

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_profile_read_and_update(client: AsyncClient) -> None:
    response = await client.get("/api/v1/profile")
    assert response.status_code == 200
    assert response.json()["email"] == "user@slabai.app"

    response = await client.patch("/api/v1/profile", json={"first_name": "Lam", "height_cm": 170})
    assert response.status_code == 200
    assert response.json()["first_name"] == "Lam"
    assert response.json()["height_cm"] == 170


@pytest.mark.asyncio
async def test_activity_crud_is_user_owned(client: AsyncClient) -> None:
    payload = {
        "sport": "running",
        "title": "Morning Run",
        "distance_km": 5.1,
        "duration_seconds": 1800,
        "pace_seconds_per_km": 353,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    response = await client.post("/api/v1/activities", json=payload)
    assert response.status_code == 201
    activity_id = response.json()["id"]

    response = await client.get("/api/v1/activities")
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = await client.patch(f"/api/v1/activities/{activity_id}", json={"title": "Easy Run"})
    assert response.status_code == 200
    assert response.json()["title"] == "Easy Run"


@pytest.mark.asyncio
async def test_generate_plan_creates_calendar_sessions(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/training/plans/generate",
        json={"sport": "running", "starts_on": date.today().isoformat(), "name": "Generated"},
    )
    assert response.status_code == 201

    response = await client.get(
        "/api/v1/calendar",
        params={"date_from": date.today().isoformat(), "date_to": date.today().isoformat()},
    )
    assert response.status_code == 200
    assert any(event["source"] == "training_session" for event in response.json()["events"])


@pytest.mark.asyncio
async def test_dashboard_and_insights(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/activities",
        json={
            "sport": "running",
            "title": "Tempo",
            "distance_km": 4,
            "duration_seconds": 1200,
            "pace_seconds_per_km": 300,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    response = await client.get(
        "/api/v1/dashboard/summary",
        params={"date_from": date.today().isoformat(), "date_to": date.today().isoformat()},
    )
    assert response.status_code == 200
    assert response.json()["activities_count"] == 1

    response = await client.get("/api/v1/insights/profiles-zones", params={"sport": "running", "range_key": "6w"})
    assert response.status_code == 200
    assert response.json()["metrics"]["thresholdPace"].endswith("/km")


@pytest.mark.asyncio
async def test_admin_endpoint_requires_admin(client: AsyncClient, admin_client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/profiles")
    assert response.status_code == 403

    response = await admin_client.get("/api/v1/admin/profiles")
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_ai_coach_endpoint(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.api.v1 import ai

    class FakeProvider:
        def generate(self, system_prompt: str, user_prompt: str) -> str:
            return "Recommendation: Bike easy for 30 minutes.\nRationale: Recent load is limited."

    monkeypatch.setattr(ai, "build_llm_provider", lambda settings: FakeProvider())

    response = await client.post("/api/v1/ai/coach/chat", json={"message": "What should I do today?"})
    assert response.status_code == 200
    assert "Bike easy" in response.json()["recommendation"]


@pytest.mark.asyncio
async def test_ai_coach_endpoint_handles_llm_failure(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.api.v1 import ai

    class FailingProvider:
        def generate(self, system_prompt: str, user_prompt: str) -> str:
            raise RuntimeError("model down")

    monkeypatch.setattr(ai, "build_llm_provider", lambda settings: FailingProvider())

    response = await client.post("/api/v1/ai/coach/chat", json={"message": "What should I do today?"})
    assert response.status_code == 503
