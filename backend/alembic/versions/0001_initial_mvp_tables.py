"""Initial SLABAI MVP tables.

Revision ID: 0001_initial_mvp_tables
Revises:
Create Date: 2026-06-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial_mvp_tables"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("first_name", sa.String(length=120), nullable=True),
        sa.Column("last_name", sa.String(length=120), nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(length=32), nullable=True),
        sa.Column("height_cm", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Numeric(5, 2), nullable=True),
        sa.Column(
            "primary_sport",
            sa.Enum("running", "cycling", "swimming", "strength", "rest", native_enum=False),
            nullable=False,
        ),
        sa.Column("role", sa.Enum("USER", "ADMIN", native_enum=False), nullable=False),
        sa.Column("status", sa.Enum("ACTIVE", "SUSPENDED", native_enum=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_profiles")),
        sa.UniqueConstraint("email", name=op.f("uq_profiles_email")),
    )
    op.create_index(op.f("ix_profiles_email"), "profiles", ["email"], unique=False)

    op.create_table(
        "user_sports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "sport",
            sa.Enum("running", "cycling", "swimming", "strength", "rest", native_enum=False),
            nullable=False,
        ),
        sa.Column("goal_mode", sa.Enum("race", "fitness", native_enum=False), nullable=False),
        sa.Column("fitness_focus", sa.String(length=64), nullable=True),
        sa.Column("fitness_duration_weeks", sa.Integer(), nullable=True),
        sa.Column("race_goal", sa.JSON(), nullable=True),
        sa.Column("volume", sa.String(length=16), nullable=False),
        sa.Column("schedule_mode", sa.String(length=32), nullable=False),
        sa.Column("heart_rate_bpm", sa.Integer(), nullable=True),
        sa.Column("pace_seconds_per_km", sa.Integer(), nullable=True),
        sa.Column("power_watts", sa.Integer(), nullable=True),
        sa.Column("build_progression", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["profiles.id"],
            name=op.f("fk_user_sports_user_id_profiles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_sports")),
        sa.UniqueConstraint("user_id", "sport", name="uq_user_sports_user_id_sport"),
    )
    op.create_index(op.f("ix_user_sports_user_id"), "user_sports", ["user_id"], unique=False)

    op.create_table(
        "activities",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "sport",
            sa.Enum("running", "cycling", "swimming", "strength", "rest", native_enum=False),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("distance_km", sa.Numeric(8, 2), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("pace_seconds_per_km", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source", sa.String(length=40), nullable=False),
        sa.Column("external_id", sa.String(length=180), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["profiles.id"],
            name=op.f("fk_activities_user_id_profiles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_activities")),
    )
    op.create_index(op.f("ix_activities_external_id"), "activities", ["external_id"], unique=False)
    op.create_index(op.f("ix_activities_started_at"), "activities", ["started_at"], unique=False)
    op.create_index(op.f("ix_activities_user_id"), "activities", ["user_id"], unique=False)

    op.create_table(
        "training_plans",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column(
            "sport",
            sa.Enum("running", "cycling", "swimming", "strength", "rest", native_enum=False),
            nullable=False,
        ),
        sa.Column("status", sa.Enum("draft", "generated", "active", "archived", native_enum=False), nullable=False),
        sa.Column("starts_on", sa.Date(), nullable=False),
        sa.Column("ends_on", sa.Date(), nullable=True),
        sa.Column("generated_by", sa.String(length=40), nullable=False),
        sa.Column("generation_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["profiles.id"],
            name=op.f("fk_training_plans_user_id_profiles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_training_plans")),
    )
    op.create_index(op.f("ix_training_plans_user_id"), "training_plans", ["user_id"], unique=False)

    op.create_table(
        "training_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=True),
        sa.Column("scheduled_date", sa.Date(), nullable=False),
        sa.Column(
            "sport",
            sa.Enum("running", "cycling", "swimming", "strength", "rest", native_enum=False),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("distance_km", sa.Numeric(8, 2), nullable=True),
        sa.Column("intensity", sa.String(length=80), nullable=True),
        sa.Column("status", sa.Enum("planned", "completed", "skipped", native_enum=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["plan_id"],
            ["training_plans.id"],
            name=op.f("fk_training_sessions_plan_id_training_plans"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["profiles.id"],
            name=op.f("fk_training_sessions_user_id_profiles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_training_sessions")),
    )
    op.create_index(op.f("ix_training_sessions_plan_id"), "training_sessions", ["plan_id"], unique=False)
    op.create_index(op.f("ix_training_sessions_scheduled_date"), "training_sessions", ["scheduled_date"], unique=False)
    op.create_index(op.f("ix_training_sessions_user_id"), "training_sessions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_training_sessions_user_id"), table_name="training_sessions")
    op.drop_index(op.f("ix_training_sessions_scheduled_date"), table_name="training_sessions")
    op.drop_index(op.f("ix_training_sessions_plan_id"), table_name="training_sessions")
    op.drop_table("training_sessions")
    op.drop_index(op.f("ix_training_plans_user_id"), table_name="training_plans")
    op.drop_table("training_plans")
    op.drop_index(op.f("ix_activities_user_id"), table_name="activities")
    op.drop_index(op.f("ix_activities_started_at"), table_name="activities")
    op.drop_index(op.f("ix_activities_external_id"), table_name="activities")
    op.drop_table("activities")
    op.drop_index(op.f("ix_user_sports_user_id"), table_name="user_sports")
    op.drop_table("user_sports")
    op.drop_index(op.f("ix_profiles_email"), table_name="profiles")
    op.drop_table("profiles")
