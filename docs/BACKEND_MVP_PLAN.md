# SLABAI Backend MVP Plan

## 0. Scope and Stack

This plan is derived from the current SLABAI front-end implementation under `src/slabai`, especially routes, pages, forms, TypeScript types, mock data, and `mockRepository.ts`.

Required backend stack:

- Python 3.11
- FastAPI
- SQLAlchemy 2
- Alembic
- PostgreSQL on Supabase
- Supabase Auth
- Pydantic
- Pytest
- LangGraph + LangChain for one simple AI Agent
- Langfuse, enabled or disabled by environment variable
- Docker
- GitHub Actions
- Railway as the expected deployment platform

MVP role model:

- `USER`
- `ADMIN`

Explicitly out of scope:

- NestJS
- Redis
- Celery
- Kafka
- Microservices
- Dynamic permissions
- Multi-agent systems
- Payment processing
- Full community product

## 1. Front-End Structure Analysis

### Repository Shape

- Root repository is still close to an AI course starter template.
- Existing root Python files (`main.py`, `src/agent.py`, `src/instrumentation.py`, `src/evaluation.py`) are demo/observability-oriented and not yet an API backend.
- Main product front-end lives in `src/slabai`.
- `src/slabai` is a Next.js 14 App Router application.
- The app currently uses mock data and browser storage instead of real APIs.
- No real global state store is implemented yet, even though `zustand` is listed in dependencies.

### Key Front-End Files

- `src/slabai/package.json`: Next.js, React, TypeScript, Vitest, Playwright.
- `src/slabai/src/lib/routes.ts`: canonical route list and sidebar navigation.
- `src/slabai/src/lib/types.ts`: front-end domain contracts.
- `src/slabai/src/lib/validation.ts`: Zod schemas for auth email, OTP, race goal, fitness goal, thresholds.
- `src/slabai/src/services/mockRepository.ts`: current data access layer and best source for future API boundaries.
- `src/slabai/mock/*.json`: seed shape for user, plan, calendar, insights, integrations, community, billing, help.
- `src/slabai/design/screen-map.json`: screen inventory, priority, actions, and states.
- `src/slabai/src/components/layout/AppShell.tsx`: authenticated app shell and current session guard.

### Current Data Flow

- Auth is mocked with `requestCode`, `verifyCode`, and `createMockSession`.
- Session is stored in `localStorage` under `slabai-session`.
- OTP email and remember flag are stored in `sessionStorage`.
- User profile, plan preferences, generated plan flag, integrations, and billing are stored in `localStorage`.
- Calendar, insights, community, help, and billing load from static JSON fallback.
- Authenticated routes check `getSession()` in `AppShell`; no server-side auth currently exists.

### Current Forms and Mutations

- Auth email submit requests a code.
- OTP submit verifies a six-digit code.
- Google auth button creates a mock session.
- Profile form autosaves user fields.
- Plan Builder saves preferences at each wizard step.
- Plan Builder review generates a deterministic mock plan and routes to Calendar.
- Devices & Apps connects/disconnects integrations.
- Billing adds a mock payment method, but payment is out of MVP backend scope.
- AI Coach Settings saves only local component state today.
- Calendar Add Workout modal is UI-only and does not persist.

## 2. Screen List

### Authentication and Landing

| Route | Screen | Current Behavior | MVP Backend Need |
|---|---|---|---|
| `/` | Home redirect | Redirects to Calendar in current working tree | Auth-aware landing/default route handled by front-end |
| `/register` | Register Options | Marketing + Google/email register choices | Supabase sign-up/sign-in wiring |
| `/register/email` | Register by Email | Submit email, request OTP | Supabase passwordless OTP |
| `/register/verify` | Register OTP | Verify code, create session | Supabase token exchange |
| `/login` | Login by Email | Submit email, remember flag | Supabase passwordless OTP |
| `/login/verify` | Login OTP | Verify code, create session | Supabase token exchange |

### Authenticated Product

| Route | Screen | Current Behavior | MVP Backend Need |
|---|---|---|---|
| `/calendar` | Calendar | Month grid, workouts, search/filter, workout detail, community rail | Calendar API combining training sessions and activities |
| `/dashboard` | Dashboard | Placeholder | Aggregated summary from profile, activities, sessions, plans |
| `/plan-builder/sport` | Plan Builder Sport | Select sport | Save training plan draft preferences |
| `/plan-builder/goals` | Plan Builder Goals | Race or fitness goals | Save goals and races |
| `/plan-builder/schedule` | Plan Builder Schedule | Volume and schedule mode | Save schedule preferences |
| `/plan-builder/advanced` | Plan Builder Advanced | Thresholds and progression | Save thresholds and plan options |
| `/plan-builder/review` | Plan Builder Review | Generate plan | Create training plan and sessions |
| `/insights/profiles-zones` | Profiles & Zones | Pace curve and zone metrics | Derived insights from activities and thresholds |
| `/profile` | Profile | Autosave personal/athlete fields | User profile CRUD |
| `/settings/ai-coach` | AI Coach Settings | Local state only | Save coach preference and support agent context |
| `/settings/devices-apps` | Devices & Apps | Connect/disconnect mock integrations | Integration records and OAuth placeholders |
| `/community` | Community Feed | Mock feed/challenges/clubs | Not full MVP; optional read-only recent activities |
| `/help` | Help Center | Mock categories/search | Static content or front-end only |
| `/roadmap` | Roadmap | Placeholder | No backend for MVP |
| `/import-data` | Import Data | Placeholder | Optional activity import endpoint |
| `/settings/preferences` | Preferences | Placeholder | No MVP unless merged into profile/settings |
| `/settings/billing` | Billing | Mock only | Out of MVP; payment not implemented |

## 3. Mock Data Inventory

| File | Shape | Backend Interpretation |
|---|---|---|
| `mock/user.json` | `User` with id, name, email, DOB, gender, height, weight, primary sport, avatar | Seed for `profiles` table linked to Supabase Auth user id |
| `mock/plan-builder.json` | Sport, goal mode, races, fitness goal, volume, schedule mode, thresholds, progression | Draft `training_plans`, `training_goals`, `race_goals`, `athlete_thresholds` |
| `mock/calendar.json` | Date range and workouts | `training_sessions` plus completed `activities` |
| `mock/insights.json` | Sport, range, pace metrics, curve | Derived `insight_snapshots` or computed response from activities |
| `mock/integrations.json` | Provider status, permissions, last activity | `integrations` table |
| `mock/community.json` | Profile summary, feed activity, challenges, clubs | Mostly out of scope; recent public activities can be reused for Calendar rail |
| `mock/billing.json` | Subscription/payment mock | Out of backend MVP |
| `mock/help.json` | Help categories | Static content/front-end only for MVP |

## 4. Required Entities

### Core Auth and Account

- `profiles`
  - One row per Supabase Auth user.
  - Stores SLABAI-specific user profile and role.
- `user_settings`
  - Stores preferences not owned by Supabase Auth, such as locale, unit system, AI coach style.
- `integrations`
  - Stores provider connection state and permissions.

### Training Domain

- `sports`
  - Optional lookup table for `running`, `cycling`, `swimming`, `strength`, `rest`.
  - Can also be implemented as PostgreSQL enum for MVP.
- `training_goals`
  - Fitness or race goal grouping for a user.
- `race_goals`
  - Race-specific details when `goal_mode = race`.
- `athlete_thresholds`
  - Heart rate, pace, power thresholds per user and sport.
- `training_plans`
  - Generated or draft plan entity.
- `training_plan_preferences`
  - Stores the wizard configuration separately from generated plan sessions.
- `training_sessions`
  - Planned sessions shown on the Calendar.
- `activities`
  - Completed imported/manual activities.
- `activity_route_points`
  - Optional MVP table for simple route preview points.
- `insight_snapshots`
  - Optional persisted snapshots for pace/power zones. Can be computed live first.

### AI Agent

- `ai_conversations`
  - One conversation per user/session/topic.
- `ai_messages`
  - User and assistant messages.
- `ai_agent_runs`
  - Agent run status, metadata, Langfuse trace id if enabled.

### Admin

- `admin_audit_logs`
  - Minimal table for admin actions.

## 5. Minimal API Surface

All endpoints except health/docs should require Supabase JWT bearer auth. FastAPI verifies JWT with Supabase JWKS or Supabase auth client. Role is read from `profiles.role`.

### Health

- `GET /health`
  - Public liveness/readiness.

### Auth/Profile

- `GET /me`
  - Returns current profile and role.
- `PATCH /me`
  - Updates profile fields: first name, last name, DOB, gender, height, weight, primary sport, avatar URL.
- `GET /me/settings`
  - Returns app preferences and AI coach settings.
- `PATCH /me/settings`
  - Updates settings such as coach vibe and explanation style.

Auth OTP endpoints can remain Supabase client-side in the front-end. If the team wants backend-mediated auth later, add:

- `POST /auth/otp/request`
- `POST /auth/otp/verify`

For MVP, prefer direct Supabase Auth from the front-end and backend JWT verification.

### Integrations

- `GET /integrations`
- `POST /integrations/{provider}/connect`
- `POST /integrations/{provider}/disconnect`
- `PATCH /integrations/{provider}`

MVP can store connection state only. Real Garmin/Strava OAuth can be deferred.

### Plan Builder

- `GET /training/plan-preferences`
- `PUT /training/plan-preferences`
- `POST /training/plans/generate`
  - Creates a training plan and initial training sessions.
  - Calls the simple LangGraph/LangChain planner or deterministic fallback.
- `GET /training/plans`
- `GET /training/plans/{plan_id}`
- `PATCH /training/plans/{plan_id}`
- `DELETE /training/plans/{plan_id}` or archive via `status = archived`

### Calendar and Sessions

- `GET /calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&sport=&status=`
  - Returns planned sessions and completed activities in one Calendar payload.
- `POST /training/sessions`
- `GET /training/sessions/{session_id}`
- `PATCH /training/sessions/{session_id}`
- `DELETE /training/sessions/{session_id}`

### Activities

- `GET /activities?from=&to=&sport=`
- `POST /activities`
- `GET /activities/{activity_id}`
- `PATCH /activities/{activity_id}`
- `DELETE /activities/{activity_id}`
- `POST /activities/import`
  - MVP manual/import stub for uploaded provider data, no async queue.

### Dashboard

- `GET /dashboard/summary`
  - Total activities, weekly distance/time, upcoming sessions, current plan, streak.

### Insights

- `GET /insights/profiles-zones?sport=running&range=6w`
  - Returns metrics and curve in the current front-end shape.
- `POST /insights/recompute`
  - Optional USER endpoint for manual recompute; ADMIN can trigger broader recomputes.

### AI Agent

- `POST /ai/coach/chat`
  - Single-agent LangGraph workflow.
  - Input: message, optional context ids.
  - Output: assistant response, suggested actions, trace metadata.
- `GET /ai/coach/conversations`
- `GET /ai/coach/conversations/{conversation_id}`

Agent tools should be simple and local:

- Read profile.
- Read current training plan.
- Read upcoming sessions.
- Read recent activities.
- Read insights snapshot.

No multi-agent orchestration.

### Admin

All admin endpoints require `ADMIN`.

- `GET /admin/users`
- `GET /admin/users/{user_id}`
- `PATCH /admin/users/{user_id}/role`
- `GET /admin/training-plans`
- `GET /admin/activities`
- `GET /admin/agent-runs`
- `GET /admin/audit-logs`

## 6. Proposed Database Schema

Use UUID primary keys. `profiles.id` should match Supabase `auth.users.id`.

### Enums

- `user_role`: `USER`, `ADMIN`
- `sport_type`: `running`, `cycling`, `swimming`, `strength`, `rest`
- `gender_type`: `male`, `female`, `other`, `prefer-not-to-say`
- `goal_mode`: `race`, `fitness`
- `race_priority`: `A`, `B`, `C`
- `training_volume`: `low`, `mid`, `high`
- `schedule_mode`: `ai-optimized`, `custom`
- `build_progression`: `maintain`, `normal`, `aggressive`
- `plan_status`: `draft`, `generated`, `active`, `archived`
- `session_status`: `planned`, `completed`, `skipped`
- `integration_provider`: `garmin`, `strava`, `apple-health`, `coros`
- `integration_status`: `connected`, `not-connected`, `connecting`, `error`
- `ai_message_role`: `user`, `assistant`, `system`, `tool`
- `agent_run_status`: `started`, `succeeded`, `failed`

### `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | Supabase Auth user id |
| `email` | text unique not null | From auth |
| `first_name` | text | |
| `last_name` | text | |
| `avatar_url` | text nullable | Supabase Storage URL later |
| `date_of_birth` | date nullable | |
| `gender` | gender_type nullable | |
| `height_cm` | integer nullable | |
| `weight_kg` | numeric nullable | |
| `primary_sport` | sport_type not null default `running` | |
| `role` | user_role not null default `USER` | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `user_settings`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk profiles | unique |
| `coach_vibe` | text | `casual` or `professional` |
| `explanation_style` | text | `short` or `detailed` |
| `unit_system` | text | `metric` default |
| `timezone` | text | default from client |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `integrations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk profiles | |
| `provider` | integration_provider | unique with user |
| `status` | integration_status | |
| `permissions` | jsonb | string array |
| `provider_account_id` | text nullable | |
| `access_token_ref` | text nullable | Store encrypted reference, not plaintext in MVP if possible |
| `last_activity_at` | timestamptz nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `training_plan_preferences`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk profiles | unique active draft |
| `sport` | sport_type | running/cycling/swimming |
| `goal_mode` | goal_mode | |
| `fitness_focus` | text nullable | `5k`, `10k`, `half-marathon`, `general-fitness`, `endurance` |
| `fitness_duration_weeks` | integer nullable | 4 to 24 |
| `volume` | training_volume | |
| `schedule_mode` | schedule_mode | |
| `heart_rate_bpm` | integer nullable | |
| `pace_seconds_per_km` | integer nullable | |
| `power_watts` | integer nullable | |
| `build_progression` | build_progression | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `race_goals`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `preference_id` | uuid fk training_plan_preferences | |
| `user_id` | uuid fk profiles | |
| `event_type` | text | `5K`, `10K`, etc. |
| `race_name` | text | |
| `race_date` | date | |
| `priority` | race_priority | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `training_plans`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk profiles | |
| `preference_id` | uuid fk nullable | |
| `name` | text | |
| `sport` | sport_type | |
| `status` | plan_status | |
| `starts_on` | date | |
| `ends_on` | date nullable | |
| `generated_by` | text | `agent`, `deterministic`, `manual` |
| `generation_metadata` | jsonb | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `training_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk profiles | |
| `plan_id` | uuid fk training_plans nullable | |
| `scheduled_date` | date | |
| `sport` | sport_type | |
| `title` | text | |
| `description` | text nullable | |
| `duration_minutes` | integer nullable | |
| `distance_km` | numeric nullable | |
| `intensity` | text nullable | |
| `status` | session_status | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `activities`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk profiles | |
| `integration_id` | uuid fk integrations nullable | |
| `external_id` | text nullable | unique with provider if present |
| `sport` | sport_type | |
| `title` | text | |
| `description` | text nullable | |
| `distance_km` | numeric nullable | |
| `duration_seconds` | integer nullable | |
| `pace_seconds_per_km` | integer nullable | |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz nullable | |
| `raw_payload` | jsonb nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `activity_route_points`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `activity_id` | uuid fk activities | |
| `sequence` | integer | |
| `x` | numeric | Current front-end normalized route map |
| `y` | numeric | Current front-end normalized route map |

### `insight_snapshots`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk profiles | |
| `sport` | sport_type | |
| `range_key` | text | `6w`, `12w`, `24w` |
| `metrics` | jsonb | threshold pace values |
| `curve` | jsonb | duration/pace points |
| `computed_at` | timestamptz | |

### `ai_conversations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk profiles | |
| `title` | text nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `ai_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `conversation_id` | uuid fk ai_conversations | |
| `role` | ai_message_role | |
| `content` | text | |
| `metadata` | jsonb | |
| `created_at` | timestamptz | |

### `ai_agent_runs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk profiles | |
| `conversation_id` | uuid fk nullable | |
| `status` | agent_run_status | |
| `input` | jsonb | |
| `output` | jsonb nullable | |
| `error` | text nullable | |
| `langfuse_trace_id` | text nullable | only when enabled |
| `created_at` | timestamptz | |
| `completed_at` | timestamptz nullable | |

### `admin_audit_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `admin_user_id` | uuid fk profiles | |
| `action` | text | |
| `target_type` | text | |
| `target_id` | uuid nullable | |
| `metadata` | jsonb | |
| `created_at` | timestamptz | |

## 7. Frontend Screen to Backend Mapping

| Frontend Screen | User Action | API | Database Table | Role |
|---|---|---|---|---|
| Register Options | Register with Google/email | Supabase Auth client | `profiles` created by webhook or first `/me` call | Public then USER |
| Register Email | Submit email | Supabase OTP request | Supabase Auth | Public |
| Register Verify | Verify OTP | Supabase OTP verify | Supabase Auth, `profiles` | Public then USER |
| Login Email | Submit email | Supabase OTP request | Supabase Auth | Public |
| Login Verify | Verify OTP | Supabase OTP verify | Supabase Auth | Public then USER |
| AppShell | Load current session/profile | `GET /me` | `profiles` | USER, ADMIN |
| Calendar | Load calendar range | `GET /calendar` | `training_sessions`, `activities`, `activity_route_points` | USER |
| Calendar | Search/filter | `GET /calendar?from=&to=&sport=&status=` | `training_sessions`, `activities` | USER |
| Calendar | Open workout detail | `GET /training/sessions/{id}` | `training_sessions` | USER |
| Calendar | Add workout | `POST /training/sessions` | `training_sessions` | USER |
| Dashboard | View summary | `GET /dashboard/summary` | `profiles`, `training_plans`, `training_sessions`, `activities` | USER |
| Plan Builder Sport | Select sport / next | `PUT /training/plan-preferences` | `training_plan_preferences` | USER |
| Plan Builder Goals | Add/edit race or fitness goal | `PUT /training/plan-preferences` | `training_plan_preferences`, `race_goals` | USER |
| Plan Builder Schedule | Select volume/schedule | `PUT /training/plan-preferences` | `training_plan_preferences` | USER |
| Plan Builder Advanced | Set thresholds/progression | `PUT /training/plan-preferences` | `training_plan_preferences` | USER |
| Plan Builder Review | Generate plan | `POST /training/plans/generate` | `training_plans`, `training_sessions`, `ai_agent_runs` | USER |
| Insights | Load pace/profile zones | `GET /insights/profiles-zones` | `activities`, `athlete_thresholds` or `insight_snapshots` | USER |
| Insights | Ask AI Coach | `POST /ai/coach/chat` | `ai_conversations`, `ai_messages`, `ai_agent_runs` | USER |
| Profile | Load profile | `GET /me` | `profiles` | USER |
| Profile | Autosave fields | `PATCH /me` | `profiles` | USER |
| AI Coach Settings | Save style/vibe | `PATCH /me/settings` | `user_settings` | USER |
| Devices & Apps | List integrations | `GET /integrations` | `integrations` | USER |
| Devices & Apps | Connect provider | `POST /integrations/{provider}/connect` | `integrations` | USER |
| Devices & Apps | Disconnect provider | `POST /integrations/{provider}/disconnect` | `integrations` | USER |
| Import Data | Import activity data | `POST /activities/import` | `activities`, `activity_route_points`, `integrations` | USER |
| Community Feed | View minimal recent activities | `GET /activities?visibility=public` or defer | `activities` | USER |
| Help Center | Search help categories | Static front-end or `GET /help/categories` optional | none or `help_categories` later | USER |
| Billing | View/add payment mock | Out of MVP | none | USER |
| Admin Users | List/manage users | `GET /admin/users`, `PATCH /admin/users/{id}/role` | `profiles`, `admin_audit_logs` | ADMIN |
| Admin Plans | Inspect plans | `GET /admin/training-plans` | `training_plans`, `training_sessions` | ADMIN |
| Admin Activities | Inspect activities | `GET /admin/activities` | `activities` | ADMIN |
| Admin AI Runs | Inspect agent runs | `GET /admin/agent-runs` | `ai_agent_runs` | ADMIN |

## 8. Assumptions and Open Questions

### Assumptions

- Supabase Auth is the source of identity.
- Backend stores app role in `profiles.role`, not in a dynamic permission system.
- Front-end will eventually replace `mockRepository.ts` with an API client.
- Calendar should merge planned sessions and completed activities into one response compatible with the current `CalendarPayload`.
- Plan generation can start deterministic and later use LangGraph/LangChain for richer generation.
- Langfuse should be toggled with an environment variable such as `LANGFUSE_ENABLED=true|false`.
- Railway deploys the FastAPI service; Supabase hosts PostgreSQL and Auth.
- Payment/billing remains mock or hidden in MVP.
- Community remains lightweight and activity-based, not a full social network.

### Open Questions

- Should the front-end use Supabase Auth directly, or should FastAPI expose thin auth endpoints for OTP request/verify?
- Should Supabase Row Level Security be enabled for backend-owned tables, or should all data access go through FastAPI service credentials only?
- Should plan generation be considered AI output from day one, or deterministic first with the AI Agent only for chat/explanations?
- What exact source will activities come from first: manual entry, mock import, Strava, Garmin, or file upload?
- Does the MVP require avatar upload through Supabase Storage?
- What Dashboard metrics are required for the first release?
- Should `strength` and `rest` be first-class sport enum values or session types?
- How should locale/timezone be handled for users outside Asia/Bangkok?
- Should admin UI be built in the existing Next.js app or only exposed through API/docs initially?

### Current Repository Risks

- Real secrets appear to exist in local `.env` files. They should not be committed, and production secrets should be rotated if already exposed.
- README still describes the course starter template, not SLABAI product setup.
- Root Python demo code is not aligned with the required FastAPI backend.
- `zustand` is installed but unused.
- Mock data contains mojibake/encoding artifacts in Vietnamese text in several files.
- Billing UI exists but payment is explicitly out of MVP, so it should remain disabled/mock.

## 9. Implementation Plan

### Phase 1: Backend Skeleton

- Create backend package, for example `backend/app`.
- Add FastAPI application factory.
- Add Pydantic settings.
- Add health endpoint.
- Add Dockerfile for Python 3.11.
- Add local Docker Compose for API only, with Supabase DB configured through env instead of a local DB by default.
- Add GitHub Actions workflow for lint/type/test.
- Add Railway start command.

Recommended dependencies:

- `fastapi`
- `uvicorn[standard]`
- `pydantic-settings`
- `sqlalchemy>=2`
- `alembic`
- `asyncpg`
- `python-jose` or `pyjwt[crypto]`
- `httpx`
- `supabase` or direct JWT/JWKS verification
- `pytest`
- `pytest-asyncio`
- `ruff`
- `mypy`
- `langchain`
- `langgraph`
- `langfuse`

### Phase 2: Database and Auth Foundation

- Configure SQLAlchemy 2 async engine.
- Configure Alembic.
- Add enums and base tables: `profiles`, `user_settings`, `integrations`.
- Implement Supabase JWT verification dependency.
- Implement role dependency: `require_user`, `require_admin`.
- Implement `GET /me`, `PATCH /me`, `GET/PATCH /me/settings`.
- Add tests for auth dependency, profile CRUD, role checks.

### Phase 3: Training Preferences and Plan Builder

- Add `training_plan_preferences` and `race_goals`.
- Implement `GET /training/plan-preferences`.
- Implement `PUT /training/plan-preferences`.
- Mirror current Zod constraints in Pydantic schemas.
- Add tests for fitness mode, race mode, threshold validation, ownership.

### Phase 4: Training Plans, Sessions, and Calendar

- Add `training_plans`, `training_sessions`.
- Implement `POST /training/plans/generate`.
- Start with deterministic generation matching current demo behavior.
- Add `GET /calendar`.
- Add session CRUD endpoints.
- Add tests for generated sessions and calendar date range filtering.

### Phase 5: Activities and Insights

- Add `activities` and optional `activity_route_points`.
- Implement activity CRUD and import stub.
- Implement `GET /dashboard/summary`.
- Implement `GET /insights/profiles-zones`.
- Compute basic pace curve from activities when enough data exists; otherwise return empty/insufficient-data response.
- Optionally persist `insight_snapshots`.
- Add tests for activity ownership, summary, and insights.

### Phase 6: Integrations

- Implement `GET /integrations`.
- Implement provider connect/disconnect endpoints as state transitions.
- Store permissions and last activity timestamp.
- Keep real OAuth out of MVP unless one provider becomes a hard launch requirement.
- Add tests for provider state transitions.

### Phase 7: Simple AI Agent

- Add LangGraph single-agent workflow.
- Tools:
  - `get_profile`
  - `get_current_plan`
  - `get_upcoming_sessions`
  - `get_recent_activities`
  - `get_latest_insights`
- Add `POST /ai/coach/chat`.
- Store conversations, messages, and agent runs.
- Add Langfuse integration behind `LANGFUSE_ENABLED`.
- Add graceful no-op tracing when Langfuse env vars are missing.
- Add tests with mocked LLM/tool calls.

### Phase 8: Admin MVP

- Add admin endpoints for users, plans, activities, and agent runs.
- Add `admin_audit_logs`.
- Enforce `ADMIN` role only.
- Add tests for USER forbidden and ADMIN allowed.

### Phase 9: Deployment and Front-End Integration

- Add production env documentation:
  - `DATABASE_URL`
  - `SUPABASE_URL`
  - `SUPABASE_JWKS_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
  - `LANGFUSE_ENABLED`
  - `LANGFUSE_PUBLIC_KEY`
  - `LANGFUSE_SECRET_KEY`
  - `LANGFUSE_HOST`
  - `CORS_ORIGINS`
- Configure Railway variables.
- Configure CORS for Next.js app.
- Replace `mockRepository.ts` behind a small API adapter.
- Keep mock fallback during transition if useful.

## 10. MVP Acceptance Criteria

- A Supabase-authenticated user can load and update their profile.
- A user can save plan builder preferences across all five steps.
- A user can generate a training plan and see sessions on Calendar.
- A user can create/update/delete a training session.
- A user can create/import a basic activity.
- Dashboard summary returns useful aggregates.
- Insights endpoint returns current front-end compatible metrics and curve.
- Devices & Apps can list/connect/disconnect providers as MVP state.
- AI Coach answers using one LangGraph/LangChain workflow and records runs.
- Langfuse can be enabled/disabled by env without code changes.
- ADMIN can inspect users, plans, activities, and agent runs.
- USER cannot access admin endpoints.
- Pytest suite covers auth, profile, plans, calendar, activities, insights, agent, and admin role checks.
- Docker image starts on Railway with Python 3.11.
