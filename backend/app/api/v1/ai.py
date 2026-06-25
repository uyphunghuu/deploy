from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile, get_session
from app.core.config import Settings, get_settings
from app.models import Profile
from app.schemas import AIChatRequest, AIChatResponse
from app.services.ai_agent import AgentRunError, run_coach_agent
from app.services.ai_context import build_agent_context
from app.services.langfuse_tracing import LangfuseRecorder
from app.services.llm_provider import build_llm_provider

router = APIRouter()


@router.post("/coach/chat", response_model=AIChatResponse)
async def coach_chat(
    payload: AIChatRequest,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> AIChatResponse:
    context = await build_agent_context(session, profile)
    goal = payload.training_goal or payload.message
    langfuse_recorder = LangfuseRecorder(settings)
    try:
        recommendation = run_coach_agent(
            goal=goal,
            context=context,
            settings=settings,
            llm_provider=build_llm_provider(settings),
            langfuse_recorder=langfuse_recorder,
        )
    except (AgentRunError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI coach is temporarily unavailable.",
        ) from exc

    return AIChatResponse(
        response=recommendation.response,
        recommendation=recommendation.recommendation,
        rationale=recommendation.rationale,
        trace_enabled=langfuse_recorder.enabled,
    )
