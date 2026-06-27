from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.running_coach.graph import RunningCoachRunError
from app.ai.running_coach.providers import LLMConfigurationError, LLMGenerationError, build_running_llm_provider
from app.ai.running_coach.schemas import ConversationMessage, RunningCoachRequest
from app.ai.running_coach.service import RunningCoachService
from app.api.deps import get_current_profile, get_session
from app.core.config import Settings, get_settings
from app.models import Profile
from app.schemas import AIChatRequest, AIChatResponse
from app.services.langfuse_tracing import LangfuseRecorder

router = APIRouter()

build_llm_provider = build_running_llm_provider


@router.post("/coach/chat", response_model=AIChatResponse)
async def coach_chat(
    payload: AIChatRequest,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> AIChatResponse:
    langfuse_recorder = LangfuseRecorder(settings)
    try:
        service = RunningCoachService(
            provider=build_llm_provider(settings),
            trace_recorder=langfuse_recorder,
        )
        recommendation = await service.chat(
            RunningCoachRequest(
                message=payload.message,
                training_goal=payload.training_goal,
                history=[ConversationMessage(role=item.role, content=item.content) for item in payload.history],
            ),
            session=session,
            profile=profile,
        )
    except LLMConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except (LLMGenerationError, RunningCoachRunError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI coach is temporarily unavailable.",
        ) from exc

    return AIChatResponse(
        response=recommendation.response,
        recommendation=recommendation.recommendation,
        rationale=recommendation.rationale,
        trace_enabled=langfuse_recorder.enabled,
        answer=recommendation.structured.answer,
        intent=recommendation.structured.intent,
        summary=recommendation.structured.summary,
        recommendations=[item.model_dump() for item in recommendation.structured.recommendations],
        warning=recommendation.structured.warning.model_dump(),
        missing_data=recommendation.structured.missing_data,
        suggested_questions=recommendation.structured.suggested_questions,
    )
