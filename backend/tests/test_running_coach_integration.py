from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

import pytest
from conftest import TEST_USER_ID
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.config import Settings, get_settings
from app.main import app
from app.models import Activity, Profile, SportType


@pytest.mark.asyncio
async def test_ai_coach_request_without_token_is_unauthorized(db_session: AsyncSession) -> None:
    async with _auth_dependency_client(db_session) as client:
        response = await client.post("/api/v1/ai/coach/chat", json={"message": "Hôm nay chạy gì?"})

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ai_coach_request_with_invalid_token_is_unauthorized(db_session: AsyncSession) -> None:
    async with _auth_dependency_client(db_session) as client:
        response = await client.post(
            "/api/v1/ai/coach/chat",
            json={"message": "Hôm nay chạy gì?"},
            headers={"Authorization": "Bearer invalid-token"},
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ai_coach_user_with_profile_but_no_activity(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.api.v1 import ai

    class FakeProvider:
        def generate(self, messages: list) -> str:
            prompt = _user_prompt(messages)
            assert "no recent running activities provided" in prompt
            return _coach_json("Mình chưa thấy buổi chạy nào gần đây trong dữ liệu của bạn.")

    monkeypatch.setattr(ai, "build_llm_provider", lambda settings: FakeProvider())

    response = await client.post("/api/v1/ai/coach/chat", json={"message": "Phân tích buổi chạy gần nhất"})

    assert response.status_code == 200
    assert "chưa thấy buổi chạy" in response.json()["answer"]


@pytest.mark.asyncio
async def test_ai_coach_user_with_activity_uses_activity_context(
    client: AsyncClient, db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.api.v1 import ai

    profile = await db_session.get(Profile, TEST_USER_ID)
    assert profile is not None
    db_session.add(
        Activity(
            user_id=profile.id,
            sport=SportType.running,
            title="Morning Tempo",
            distance_km=6.2,
            duration_seconds=2100,
            pace_seconds_per_km=339,
            started_at=datetime.now(UTC),
        )
    )
    await db_session.commit()

    class FakeProvider:
        def generate(self, messages: list) -> str:
            prompt = _user_prompt(messages)
            assert "Morning Tempo" in prompt
            assert "6.2" in prompt
            return _coach_json("Buổi Morning Tempo của bạn có pace khá ổn định.")

    monkeypatch.setattr(ai, "build_llm_provider", lambda settings: FakeProvider())

    response = await client.post("/api/v1/ai/coach/chat", json={"message": "Phân tích buổi chạy gần nhất"})

    assert response.status_code == 200
    assert "Morning Tempo" in response.json()["answer"]


@pytest.mark.asyncio
async def test_ai_coach_llm_error_returns_503(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.api.v1 import ai

    class FailingProvider:
        def generate(self, messages: list) -> str:
            raise RuntimeError("model unavailable")

    monkeypatch.setattr(ai, "build_llm_provider", lambda settings: FailingProvider())

    response = await client.post("/api/v1/ai/coach/chat", json={"message": "Hôm nay chạy gì?"})

    assert response.status_code == 503


@pytest.mark.asyncio
async def test_ai_coach_tool_error_still_returns_transparent_answer(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.ai.running_coach import graph as running_graph
    from app.ai.running_coach.schemas import ToolExecutionResult
    from app.api.v1 import ai

    async def failing_tool(*args, **kwargs) -> ToolExecutionResult:
        return ToolExecutionResult(name="get_recent_runs", status="error", elapsed_ms=1, error="Tool failed.")

    class FakeProvider:
        def generate(self, messages: list) -> str:
            assert "get_recent_runs: status=error" in _user_prompt(messages)
            return _coach_json("Mình chưa lấy được một phần dữ liệu chạy gần đây, nên sẽ trả lời thận trọng.")

    monkeypatch.setattr(running_graph, "execute_tool", failing_tool)
    monkeypatch.setattr(ai, "build_llm_provider", lambda settings: FakeProvider())

    response = await client.post("/api/v1/ai/coach/chat", json={"message": "Phân tích buổi chạy gần nhất"})

    assert response.status_code == 200
    assert "chưa lấy được" in response.json()["answer"]


@pytest.mark.asyncio
async def test_ai_coach_invalid_structured_output_falls_back(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.api.v1 import ai

    class InvalidProvider:
        def generate(self, messages: list) -> str:
            return "not-json"

    monkeypatch.setattr(ai, "build_llm_provider", lambda settings: InvalidProvider())

    response = await client.post("/api/v1/ai/coach/chat", json={"message": "Hôm nay chạy gì?"})

    assert response.status_code == 200
    assert response.json()["intent"] in {"general_running", "missing_context"}
    assert "Mình chưa đọc được phản hồi" in response.json()["answer"]


@pytest.mark.asyncio
async def test_ai_coach_request_with_too_long_history_is_trimmed(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.api.v1 import ai

    class FakeProvider:
        def generate(self, messages: list) -> str:
            prompt = _user_prompt(messages)
            assert "history-0" not in prompt
            assert "history-11" in prompt
            return _coach_json("Mình dùng các lượt gần nhất để trả lời.")

    monkeypatch.setattr(ai, "build_llm_provider", lambda settings: FakeProvider())

    response = await client.post(
        "/api/v1/ai/coach/chat",
        json={
            "message": "Hôm nay chạy gì?",
            "history": [{"role": "user", "content": f"history-{index}"} for index in range(12)],
        },
    )

    assert response.status_code == 200


def _user_prompt(messages: list) -> str:
    return "\n".join(message.content for message in messages if message.role == "user")


def _coach_json(answer: str) -> str:
    return f"""
    {{
      "answer": "{answer}",
      "intent": "workout_advice",
      "summary": "Integration test response.",
      "recommendations": [
        {{
          "title": "Chạy thận trọng",
          "details": "Giữ cường độ dễ và không tự bịa dữ liệu.",
          "priority": "medium"
        }}
      ],
      "warning": {{"level": "none", "message": ""}},
      "missing_data": [],
      "suggested_questions": []
    }}
    """


@asynccontextmanager
async def _auth_dependency_client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def override_session() -> AsyncIterator[AsyncSession]:
        yield db_session

    app.dependency_overrides.clear()
    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_settings] = lambda: Settings(
        DATABASE_URL="sqlite+aiosqlite:///:memory:",
        supabase_jwt_secret="test-secret",
        openai_api_key="test-key",
        llm_model="test-model",
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
