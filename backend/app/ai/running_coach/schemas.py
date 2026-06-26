from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

ConversationRole = Literal["user", "assistant"]
RunningCoachIntent = Literal[
    "workout_advice",
    "activity_analysis",
    "plan_question",
    "recovery",
    "injury_risk",
    "general_running",
    "missing_context",
]
RecommendationPriority = Literal["low", "medium", "high"]
WarningLevel = Literal["none", "caution", "urgent"]


@dataclass(frozen=True)
class ConversationMessage:
    role: ConversationRole
    content: str


@dataclass(frozen=True)
class RunningCoachRequest:
    message: str
    training_goal: str | None = None
    history: list[ConversationMessage] = field(default_factory=list)

    @property
    def goal_text(self) -> str:
        return self.training_goal or self.message


@dataclass(frozen=True)
class RunningAthleteProfile:
    first_name: str | None
    primary_sport: str
    height_cm: int | None = None
    weight_kg: float | None = None


@dataclass(frozen=True)
class RunningSportProfile:
    sport: str
    goal_mode: str
    fitness_focus: str | None
    fitness_duration_weeks: int | None
    volume: str
    schedule_mode: str
    heart_rate_bpm: int | None
    pace_seconds_per_km: int | None
    power_watts: int | None
    build_progression: str


@dataclass(frozen=True)
class RunningActivitySummary:
    sport: str
    title: str
    started_on: date
    distance_km: float | None
    duration_seconds: int | None
    pace_seconds_per_km: int | None
    heart_rate_bpm: int | None = None
    cadence_spm: int | None = None
    elevation_m: float | None = None


@dataclass(frozen=True)
class RunningPlanSummary:
    name: str
    status: str
    starts_on: date
    ends_on: date | None


@dataclass(frozen=True)
class RunningSessionSummary:
    scheduled_date: date
    title: str
    duration_minutes: int | None
    distance_km: float | None
    intensity: str | None
    status: str


@dataclass(frozen=True)
class RunningCoachUserContext:
    display_name: str | None
    age: int | None
    height_cm: int | None
    weight_kg: float | None


@dataclass(frozen=True)
class RunningCoachKnownPaceZoneContext:
    pace_seconds_per_km: int | None
    pace: str | None
    heart_rate_bpm: int | None
    power_watts: int | None


@dataclass(frozen=True)
class RunningCoachProfileContext:
    primary_sport: str
    experience_level: str | None
    target_distance: str | float | int | None
    target_date: str | None
    weekly_frequency: int | None
    current_weekly_distance: float | None
    preferred_training_days: list[str]
    goal_mode: str | None
    fitness_focus: str | None
    fitness_duration_weeks: int | None
    volume: str | None
    schedule_mode: str | None
    build_progression: str | None
    known_pace_or_zone: RunningCoachKnownPaceZoneContext


@dataclass(frozen=True)
class RunningCoachRecentTrainingContext:
    recent_runs: list[RunningActivitySummary]
    distance_7_days: float | None
    previous_7_day_distance: float | None
    longest_run: RunningActivitySummary | None
    rest_days: list[str]
    latest_activity_date: date | None


@dataclass(frozen=True)
class RunningCoachPlannedWorkoutContext:
    scheduled_date: date
    workout_type: str
    title: str
    target_distance_km: float | None
    target_duration_minutes: int | None
    intensity: str | None
    status: str


@dataclass(frozen=True)
class RunningCoachUpcomingPlanContext:
    planned_workouts: list[RunningCoachPlannedWorkoutContext]
    active_plans: list[RunningPlanSummary]


@dataclass(frozen=True)
class RunningCoachPersonalizedContext:
    user: RunningCoachUserContext
    running_profile: RunningCoachProfileContext
    recent_training: RunningCoachRecentTrainingContext | None
    upcoming_plan: RunningCoachUpcomingPlanContext | None
    missing_data: list[str]
    loaded_sections: list[str]


@dataclass(frozen=True)
class RunningCoachContext:
    profile: RunningAthleteProfile
    sports: list[RunningSportProfile]
    recent_activities: list[RunningActivitySummary]
    active_plans: list[RunningPlanSummary]
    upcoming_sessions: list[RunningSessionSummary]
    weekly_mileage_km: float | None = None
    training_load_note: str | None = None
    personalized: RunningCoachPersonalizedContext | None = None


class RunningCoachRecommendationItem(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    details: str = Field(min_length=1, max_length=1000)
    priority: RecommendationPriority = "medium"


class RunningCoachWarning(BaseModel):
    level: WarningLevel = "none"
    message: str = Field(default="", max_length=1000)

    @field_validator("message")
    @classmethod
    def message_required_for_warning(cls, value: str, info) -> str:
        level = info.data.get("level")
        if level in {"caution", "urgent"} and not value.strip():
            raise ValueError("Warning message is required when warning level is caution or urgent.")
        return value.strip()


class RunningCoachStructuredResponse(BaseModel):
    answer: str = Field(min_length=1, max_length=3000)
    intent: RunningCoachIntent
    summary: str = Field(min_length=1, max_length=500)
    recommendations: list[RunningCoachRecommendationItem] = Field(default_factory=list, max_length=5)
    warning: RunningCoachWarning = Field(default_factory=RunningCoachWarning)
    missing_data: list[str] = Field(default_factory=list, max_length=10)
    suggested_questions: list[str] = Field(default_factory=list, max_length=2)

    @field_validator("missing_data", "suggested_questions")
    @classmethod
    def strip_list_values(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item.strip()]


@dataclass(frozen=True)
class RunningCoachResult:
    response: str
    recommendation: str
    rationale: str
    structured: RunningCoachStructuredResponse


ToolStatus = Literal["success", "error", "timeout", "skipped"]


@dataclass(frozen=True)
class ToolExecutionResult:
    name: str
    status: ToolStatus
    elapsed_ms: int
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None
