from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models import AccountStatus, GoalMode, PlanStatus, Role, SessionStatus, SportType

Gender = Literal["male", "female", "other", "prefer-not-to-say"]


class ProfileBase(BaseModel):
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    height_cm: int | None = Field(default=None, ge=50, le=260)
    weight_kg: float | None = Field(default=None, ge=20, le=300)
    primary_sport: SportType = SportType.running


class ProfileRead(ProfileBase):
    id: uuid.UUID
    email: EmailStr
    role: Role
    status: AccountStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    height_cm: int | None = Field(default=None, ge=50, le=260)
    weight_kg: float | None = Field(default=None, ge=20, le=300)
    primary_sport: SportType | None = None


class UserSportUpsert(BaseModel):
    sport: SportType = SportType.running
    goal_mode: GoalMode = GoalMode.fitness
    fitness_focus: Literal["5k", "10k", "half-marathon", "general-fitness", "endurance"] | None = "5k"
    fitness_duration_weeks: int | None = Field(default=6, ge=4, le=24)
    race_goal: dict[str, Any] | None = None
    volume: Literal["low", "mid", "high"] = "low"
    schedule_mode: Literal["ai-optimized", "custom"] = "ai-optimized"
    heart_rate_bpm: int | None = Field(default=None, ge=80, le=220)
    pace_seconds_per_km: int | None = Field(default=None, ge=150, le=900)
    power_watts: int | None = Field(default=None, ge=50, le=600)
    build_progression: Literal["maintain", "normal", "aggressive"] = "normal"

    @field_validator("sport")
    @classmethod
    def sport_must_be_trainable(cls, value: SportType) -> SportType:
        if value in {SportType.rest, SportType.strength}:
            raise ValueError("Plan preferences require running, cycling, or swimming.")
        return value


class UserSportRead(UserSportUpsert):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityCreate(BaseModel):
    sport: SportType
    title: str = Field(min_length=1, max_length=180)
    description: str | None = None
    distance_km: float | None = Field(default=None, ge=0)
    duration_seconds: int | None = Field(default=None, ge=0)
    pace_seconds_per_km: int | None = Field(default=None, ge=0)
    started_at: datetime
    completed_at: datetime | None = None
    source: str = Field(default="manual", max_length=40)
    external_id: str | None = Field(default=None, max_length=180)
    raw_payload: dict[str, Any] | None = None


class ActivityUpdate(BaseModel):
    sport: SportType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = None
    distance_km: float | None = Field(default=None, ge=0)
    duration_seconds: int | None = Field(default=None, ge=0)
    pace_seconds_per_km: int | None = Field(default=None, ge=0)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    source: str | None = Field(default=None, max_length=40)
    external_id: str | None = Field(default=None, max_length=180)
    raw_payload: dict[str, Any] | None = None


class ActivityRead(ActivityCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrainingPlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    sport: SportType
    status: PlanStatus = PlanStatus.draft
    starts_on: date
    ends_on: date | None = None
    generated_by: str = Field(default="manual", max_length=40)
    generation_metadata: dict[str, Any] | None = None


class TrainingPlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=180)
    sport: SportType | None = None
    status: PlanStatus | None = None
    starts_on: date | None = None
    ends_on: date | None = None
    generated_by: str | None = Field(default=None, max_length=40)
    generation_metadata: dict[str, Any] | None = None


class TrainingPlanRead(TrainingPlanCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GeneratePlanRequest(BaseModel):
    sport: SportType = SportType.running
    starts_on: date = Field(default_factory=lambda: date.today() + timedelta(days=1))
    name: str = Field(default="SLABAI Generated Plan", max_length=180)

    @field_validator("sport")
    @classmethod
    def sport_must_be_trainable(cls, value: SportType) -> SportType:
        if value in {SportType.rest, SportType.strength}:
            raise ValueError("Generated plans require running, cycling, or swimming.")
        return value


class TrainingSessionCreate(BaseModel):
    plan_id: uuid.UUID | None = None
    scheduled_date: date
    sport: SportType
    title: str = Field(min_length=1, max_length=180)
    description: str | None = None
    duration_minutes: int | None = Field(default=None, ge=0)
    distance_km: float | None = Field(default=None, ge=0)
    intensity: str | None = Field(default=None, max_length=80)
    status: SessionStatus = SessionStatus.planned


class TrainingSessionUpdate(BaseModel):
    plan_id: uuid.UUID | None = None
    scheduled_date: date | None = None
    sport: SportType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = None
    duration_minutes: int | None = Field(default=None, ge=0)
    distance_km: float | None = Field(default=None, ge=0)
    intensity: str | None = Field(default=None, max_length=80)
    status: SessionStatus | None = None


class TrainingSessionRead(TrainingSessionCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CalendarEvent(BaseModel):
    id: uuid.UUID
    date: date
    sport: SportType
    title: str
    duration_minutes: int | None = None
    distance_km: float | None = None
    intensity: str | None = None
    status: str
    source: Literal["training_session", "activity"]


class CalendarResponse(BaseModel):
    range: dict[str, date]
    events: list[CalendarEvent]


class DashboardSummary(BaseModel):
    activities_count: int
    total_distance_km: float
    total_duration_seconds: int
    upcoming_sessions_count: int
    active_plans_count: int


class InsightPoint(BaseModel):
    duration_seconds: int
    pace_seconds_per_km: int


class InsightsResponse(BaseModel):
    sport: SportType
    range: str
    metrics: dict[str, str]
    curve: list[InsightPoint]


class AdminProfileUpdate(BaseModel):
    role: Role | None = None
    status: AccountStatus | None = None


AI_CHAT_MAX_MESSAGE_CHARS = 2000
AI_CHAT_MAX_HISTORY_MESSAGES = 10
AI_CHAT_MAX_HISTORY_CHARS = 8000


class AIChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=AI_CHAT_MAX_MESSAGE_CHARS)

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        return value.strip()


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=AI_CHAT_MAX_MESSAGE_CHARS)
    training_goal: str | None = Field(default=None, max_length=500)
    conversation_id: str | None = Field(default=None, max_length=128)
    history: list[AIChatHistoryMessage] = Field(
        default_factory=list,
        validation_alias=AliasChoices("history", "conversation_history"),
    )

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("message")
    @classmethod
    def normalize_message(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Message must not be empty.")
        return normalized

    @model_validator(mode="after")
    def normalize_history(self) -> AIChatRequest:
        history = [item for item in self.history if item.content]
        history = history[-AI_CHAT_MAX_HISTORY_MESSAGES:]

        total_chars = sum(len(item.content) for item in history)
        while history and total_chars > AI_CHAT_MAX_HISTORY_CHARS:
            removed = history.pop(0)
            total_chars -= len(removed.content)

        self.history = history
        return self


class AIChatRecommendationItem(BaseModel):
    title: str
    details: str
    priority: Literal["low", "medium", "high"]


class AIChatWarning(BaseModel):
    level: Literal["none", "caution", "urgent"]
    message: str


class AIChatResponse(BaseModel):
    response: str
    recommendation: str
    rationale: str
    trace_enabled: bool
    answer: str
    intent: Literal[
        "workout_advice",
        "activity_analysis",
        "plan_question",
        "recovery",
        "injury_risk",
        "general_running",
        "missing_context",
    ]
    summary: str
    recommendations: list[AIChatRecommendationItem]
    warning: AIChatWarning
    missing_data: list[str]
    suggested_questions: list[str]
