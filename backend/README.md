# SLABAI Backend

FastAPI backend for the SLABAI MVP. It owns the protected API, Supabase Auth verification, database access, and the read-only Running AI Coach.

## Stack

- Python 3.11+
- FastAPI with Swagger at `/docs`
- SQLAlchemy 2 async ORM
- Alembic migrations
- PostgreSQL on Supabase
- Supabase Auth JWT verification
- Pydantic request/response validation
- LangGraph for the Running AI Coach graph
- LangChain OpenAI adapter for model calls
- Langfuse tracing toggle via `LANGFUSE_ENABLED`
- Pytest, Ruff, and mypy

## Key Endpoints

- `GET /health`: lightweight liveness check.
- `GET /ready`: readiness check with database connectivity.
- `GET /docs`: Swagger UI.
- `POST /api/v1/ai/coach/chat`: Running AI Coach chat endpoint.

Protected endpoints require `Authorization: Bearer <Supabase access token>`.

## Running AI Coach

The coach lives under `app/ai/running_coach` and is called by `app/api/v1/ai.py`.

Flow:

1. Resolve the authenticated profile from the Supabase JWT.
2. Validate the chat request and trim frontend-provided history to the MVP limits.
3. Classify the running intent.
4. Load only the minimum useful context for that intent.
5. Let the graph choose read-only tools.
6. Run deterministic calculations in code where possible.
7. Apply scope and health safety checks.
8. Call the configured provider.
9. Validate structured output and fall back safely when needed.

The agent can read profile, running profile, recent runs, planned workouts, and summary calculations. It must not write database rows, create migrations, or change a training plan automatically.

## Environment Variables

Configure through `backend/.env` locally and deployment variables in production. Do not hard-code secrets.

Required:

```env
APP_NAME=SLABAI Backend
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_AUDIENCE=authenticated
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Running AI Coach:

```env
OPENAI_API_KEY=
LLM_PROVIDER=openai
LLM_MODEL=
LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
```

Optional:

```env
SUPABASE_JWT_SECRET=
DEBUG=false
```

`SUPABASE_JWT_SECRET` is only for HS256 fallback projects. Prefer JWKS when available. Never expose service-role keys, model API keys, database passwords, or access tokens to the frontend.

## Run Local

```bash
cd backend
cp .env.example .env
python -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Use:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/ready
http://127.0.0.1:8000/docs
```

## Database

Use the existing Supabase Postgres database. The Running AI Coach does not require new tables.

Run migrations from `backend/` only when intentionally changing schema:

```bash
alembic upgrade head
```

Development seed is manual only:

```bash
python scripts/seed_dev.py
```

Do not run seed commands in production.

## Test

Backend checks:

```bash
cd backend
ruff format --check .
ruff check .
mypy app
pytest
python scripts/evaluate_running_coach.py
```

The evaluation script is deterministic by default and does not call an LLM unless `RUN_LLM_JUDGE=true` is set together with judge credentials.

Frontend checks:

```bash
cd ../src/slabai
npm run typecheck
npm run build
```

## Safety And MVP Limits

- Current coach scope is running only.
- Responses default to Vietnamese and should stay concise.
- Missing data must be reported; the coach must not invent pace, heart rate, age, weight, or training history.
- Tool errors should lead to transparent, cautious answers.
- The coach is not a medical diagnostic tool.
- For chest pain, abnormal shortness of breath, fainting, severe pain, serious injury, or sustained abnormal heart rhythm, recommend stopping training and seeking appropriate medical support.

## Deployment

Railway config lives at the repository root in `railway.toml`.

Expected production behavior:

- Build with `backend/Dockerfile`.
- Run pre-deploy migration: `alembic upgrade head`.
- Start server: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT}`.
- Healthcheck: `/ready`.

Keep production configuration in environment variables only.
