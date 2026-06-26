# SLABAI

SLABAI is a training assistant MVP with a Next.js frontend, a FastAPI backend, Supabase Auth/Postgres, and a read-only Running AI Coach.

## Structure

```text
backend/       FastAPI backend, AI Coach, database models, Alembic migrations
src/slabai/    Next.js frontend
docs/          Architecture, audits, and evaluation notes
railway.toml   Railway deployment config for the backend
```

## Running AI Coach Architecture

The chatbot in `src/slabai` talks only to the SLABAI backend. It never calls an LLM provider directly and never exposes server-side model keys in `NEXT_PUBLIC_*` variables.

Runtime flow:

1. The frontend gets the current Supabase session and sends `Authorization: Bearer <access_token>`.
2. The frontend posts the current message, `conversation_id`, and up to 10 recent user/assistant messages to `POST /api/v1/ai/coach/chat`.
3. FastAPI verifies the Supabase JWT and resolves the current profile.
4. `backend/app/ai/running_coach` classifies intent, loads the minimum useful context, runs read-only tools, applies safety checks, calls the configured LLM provider, validates structured output, and returns a typed coach response.
5. Conversation history for the MVP stays in frontend `localStorage`; the backend does not create conversation tables.

Core backend module:

```text
backend/app/ai/running_coach/
  context_loader.py  Minimal user, running, activity, and plan context
  graph.py           LangGraph orchestration
  prompts.py         System prompt and dynamic prompt assembly
  providers.py       LLM provider adapter
  schemas.py         Internal and structured response schemas
  safety.py          Scope, health, and redaction helpers
  service.py         Service boundary used by the API route
  tools.py           Read-only tools and deterministic calculations
```

The agent is read-only. It can inspect profile, running profile, recent running activity, upcoming workouts, and deterministic summaries, but it must not write database rows or change a training plan automatically.

## Configuration

Backend variables are configured in `backend/.env` locally and in deployment variables in production.

Required backend values:

```env
APP_NAME=SLABAI Backend
ENVIRONMENT=production
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_AUDIENCE=authenticated
CORS_ORIGINS=https://app.slabai.com,https://slabai.com
```

Running AI Coach values:

```env
OPENAI_API_KEY=
LLM_PROVIDER=openai
LLM_MODEL=
LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
```

Frontend values are configured in `src/slabai/.env.local` locally and in the frontend hosting environment in production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>
```

Do not expose `OPENAI_API_KEY`, database passwords, access tokens, refresh tokens, or service-role keys to the frontend. `.env` and `.env.local` are ignored by git.

## Run Local

Backend:

```bash
cd backend
cp .env.example .env
python -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Frontend:

```bash
cd src/slabai
cp .env.example .env.local
npm install
npm run dev
```

Useful URLs:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/ready
http://127.0.0.1:8000/docs
http://localhost:3000
```

## Database

Use the existing Supabase project and existing schema. Do not create a new Supabase project for the AI Coach. Migrations are run only through the backend Alembic workflow:

```bash
cd backend
alembic upgrade head
```

The Running AI Coach cleanup does not add tables or migrations.

## Test And Evaluation

Backend:

```bash
cd backend
ruff format --check .
ruff check .
mypy app
pytest
python scripts/evaluate_running_coach.py
```

Frontend:

```bash
cd src/slabai
npm run typecheck
npm run build
```

The evaluation dataset is in `backend/evals/running_coach_cases.jsonl`. The evaluation script uses deterministic checks by default. LLM-as-judge is opt-in with `RUN_LLM_JUDGE=true` and must not run by default in CI.

## MVP Limits

- The coach supports running only in the current MVP.
- It gives short, friendly Vietnamese guidance by default.
- It uses available profile, running profile, activity, calendar, and plan data, and must say what is missing instead of inventing pace, heart rate, age, weight, or training history.
- It can warn about simple training risk signals, but it does not diagnose health conditions or injuries.
- For chest pain, abnormal shortness of breath, fainting, severe pain, serious injury, or sustained abnormal heart rhythm, the coach should recommend stopping training and seeking appropriate medical support.

Running AI Coach is not a medical diagnostic tool.

## Deployment Notes

Railway uses `railway.toml`, builds `backend/Dockerfile`, runs `alembic upgrade head`, starts `uvicorn app.main:app --host 0.0.0.0 --port ${PORT}`, and checks `/ready`.

Set production variables from the configuration section above. Do not configure development seed commands in production.
