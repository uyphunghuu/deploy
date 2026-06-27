from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import JSON, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, Uuid
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Role(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class SportType(str, enum.Enum):
    running = "running"
    cycling = "cycling"
    swimming = "swimming"
    strength = "strength"
    rest = "rest"


class GoalMode(str, enum.Enum):
    race = "race"
    fitness = "fitness"


class PlanStatus(str, enum.Enum):
    draft = "draft"
    generated = "generated"
    active = "active"
    archived = "archived"


class SessionStatus(str, enum.Enum):
    planned = "planned"
    completed = "completed"
    skipped = "skipped"


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(120))
    last_name: Mapped[str | None] = mapped_column(String(120))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(32))
    height_cm: Mapped[int | None] = mapped_column(Integer)
    weight_kg: Mapped[float | None] = mapped_column(Numeric(5, 2))
    primary_sport: Mapped[SportType] = mapped_column(Enum(SportType, native_enum=False), default=SportType.running)
    role: Mapped[Role] = mapped_column(Enum(Role, native_enum=False), default=Role.USER, nullable=False)
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus, native_enum=False),
        default=AccountStatus.ACTIVE,
        nullable=False,
    )

    sports: Mapped[list[UserSport]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    activities: Mapped[list[Activity]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    training_plans: Mapped[list[TrainingPlan]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    training_sessions: Mapped[list[TrainingSession]] = relationship(
        back_populates="profile",
        cascade="all, delete-orphan",
    )
    integration_credentials: Mapped[list[IntegrationCredential]] = relationship(
        back_populates="profile", cascade="all, delete-orphan"
    )


class UserSport(Base, TimestampMixin):
    __tablename__ = "user_sports"
    __table_args__ = (UniqueConstraint("user_id", "sport", name="uq_user_sports_user_id_sport"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    sport: Mapped[SportType] = mapped_column(Enum(SportType, native_enum=False), nullable=False)
    goal_mode: Mapped[GoalMode] = mapped_column(Enum(GoalMode, native_enum=False), default=GoalMode.fitness)
    fitness_focus: Mapped[str | None] = mapped_column(String(64))
    fitness_duration_weeks: Mapped[int | None] = mapped_column(Integer)
    race_goal: Mapped[dict[str, Any] | None] = mapped_column(MutableDict.as_mutable(JSON))
    volume: Mapped[str] = mapped_column(String(16), default="low", nullable=False)
    schedule_mode: Mapped[str] = mapped_column(String(32), default="ai-optimized", nullable=False)
    heart_rate_bpm: Mapped[int | None] = mapped_column(Integer)
    pace_seconds_per_km: Mapped[int | None] = mapped_column(Integer)
    power_watts: Mapped[int | None] = mapped_column(Integer)
    build_progression: Mapped[str] = mapped_column(String(32), default="normal", nullable=False)

    profile: Mapped[Profile] = relationship(back_populates="sports")


class Activity(Base, TimestampMixin):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    sport: Mapped[SportType] = mapped_column(Enum(SportType, native_enum=False), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    distance_km: Mapped[float | None] = mapped_column(Numeric(8, 2))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    pace_seconds_per_km: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    source: Mapped[str] = mapped_column(String(40), default="manual", nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(180), index=True)
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(MutableDict.as_mutable(JSON))

    profile: Mapped[Profile] = relationship(back_populates="activities")


class TrainingPlan(Base, TimestampMixin):
    __tablename__ = "training_plans"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    sport: Mapped[SportType] = mapped_column(Enum(SportType, native_enum=False), nullable=False)
    status: Mapped[PlanStatus] = mapped_column(Enum(PlanStatus, native_enum=False), default=PlanStatus.draft)
    starts_on: Mapped[date] = mapped_column(Date, nullable=False)
    ends_on: Mapped[date | None] = mapped_column(Date)
    generated_by: Mapped[str] = mapped_column(String(40), default="deterministic", nullable=False)
    generation_metadata: Mapped[dict[str, Any] | None] = mapped_column(MutableDict.as_mutable(JSON))

    profile: Mapped[Profile] = relationship(back_populates="training_plans")
    sessions: Mapped[list[TrainingSession]] = relationship(back_populates="plan", cascade="all, delete-orphan")


class TrainingSession(Base, TimestampMixin):
    __tablename__ = "training_sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    plan_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("training_plans.id", ondelete="SET NULL"), index=True)
    scheduled_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    sport: Mapped[SportType] = mapped_column(Enum(SportType, native_enum=False), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    distance_km: Mapped[float | None] = mapped_column(Numeric(8, 2))
    intensity: Mapped[str | None] = mapped_column(String(80))
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus, native_enum=False), default=SessionStatus.planned)

    profile: Mapped[Profile] = relationship(back_populates="training_sessions")
    plan: Mapped[TrainingPlan | None] = relationship(back_populates="sessions")


class IntegrationCredential(Base, TimestampMixin):
    __tablename__ = "integration_credentials"
    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_integration_credentials_user_id_provider"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    athlete_id: Mapped[str | None] = mapped_column(String(64))

    profile: Mapped[Profile] = relationship(back_populates="integration_credentials")
