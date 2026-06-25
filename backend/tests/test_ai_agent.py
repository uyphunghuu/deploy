import pytest

from app.core.config import Settings
from app.services.ai_agent import AgentRunError, run_coach_agent
from app.services.ai_context import AgentActivity, AgentContext, AgentProfile, AgentSportPreference


class FakeProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        assert "Do not update any user data" in user_prompt
        assert "access tokens" in system_prompt.lower()
        return (
            "Recommendation: Run 35 minutes easy in Zone 2, then add four relaxed strides.\n"
            "Rationale: The recent activity list is light, so this keeps load conservative."
        )


class FailingProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        raise RuntimeError("model unavailable")


def test_ai_agent_workflow_recommends_training_without_db_access() -> None:
    result = run_coach_agent(
        goal="Build toward a 10K",
        context=_context(),
        settings=_settings(),
        llm_provider=FakeProvider(),
    )

    assert "Run 35 minutes easy" in result.recommendation
    assert "conservative" in result.rationale
    assert "Why:" in result.response


def test_ai_agent_workflow_surfaces_llm_failure() -> None:
    with pytest.raises(AgentRunError):
        run_coach_agent(
            goal="Build toward a 10K",
            context=_context(),
            settings=_settings(),
            llm_provider=FailingProvider(),
        )


def _context() -> AgentContext:
    return AgentContext(
        profile=AgentProfile(first_name="Lam", primary_sport="running"),
        sports=[
            AgentSportPreference(
                sport="running",
                goal_mode="fitness",
                fitness_focus="10k",
                fitness_duration_weeks=8,
                volume="low",
                build_progression="normal",
            )
        ],
        recent_activities=[
            AgentActivity(
                sport="running",
                title="Easy Run",
                distance_km=5.0,
                duration_seconds=1800,
                pace_seconds_per_km=360,
            )
        ],
    )


def _settings() -> Settings:
    return Settings(DATABASE_URL="sqlite+aiosqlite:///:memory:", OPENAI_API_KEY="test-key")

