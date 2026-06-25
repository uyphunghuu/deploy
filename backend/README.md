# SLABAI Backend MVP

FastAPI backend for the SLABAI MVP. The backend is isolated under `backend/` and is deployed as a Docker service.

## Stack

- Python 3.11
- FastAPI with Swagger at `/docs`
- SQLAlchemy 2 async ORM
- Alembic migrations
- PostgreSQL on Supabase
- Supabase Auth JWT verification
- Pydantic request/response validation
- Pytest
- LangGraph + minimal LangChain for the AI Coach MVP
- Langfuse toggle via `LANGFUSE_ENABLED`
- Docker
- Railway deployment

## Endpoints

- `GET /health`: lightweight liveness check, no database call.
- `GET /ready`: readiness check, verifies database connectivity.
- `GET /docs`: Swagger UI.
- Protected product APIs live under `/api/v1`.

## Environment Variables

Do not hard-code secrets. Configure these through `.env` locally and Railway variables in production.

Required:

- `APP_NAME`: display name, for example `SLABAI Backend`.
- `ENVIRONMENT`: `development`, `staging`, or `production`.
- `API_V1_PREFIX`: default `/api/v1`.
- `DATABASE_URL`: Supabase Postgres URL using asyncpg, for example `postgresql+asyncpg://...`.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_JWKS_URL`: `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`.
- `SUPABASE_JWT_AUDIENCE`: usually `authenticated`.
- `CORS_ORIGINS`: comma-separated front-end origins, for example `https://app.slabai.com,https://slabai.com`.

Optional:

- `SUPABASE_JWT_SECRET`: only if the project requires HS256 fallback. Prefer JWKS when available.
- `OPENAI_API_KEY`: required when using the OpenAI AI Coach provider.
- `LLM_PROVIDER`: default `openai`.
- `LLM_MODEL`: default `gpt-4o-mini`.
- `LANGFUSE_ENABLED`: `true` or `false`.
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_HOST`: default `https://cloud.langfuse.com`.

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the front-end. Do not store passwords, refresh tokens, access tokens, API keys, or service-role keys in application tables.

## 1. Run Local

From the repository root:

```bash
cd backend
cp .env.example .env
python -m venv .venv
.venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

Use a Supabase Postgres URL with the async SQLAlchemy dialect:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

## 2. Run Migration

From `backend/`:

```bash
alembic upgrade head
```

Railway migration command:

```bash
alembic upgrade head
```

Development seed is manual only:

```bash
python scripts/seed_dev.py
```

Do not run `scripts/seed_dev.py` in production.

## 3. Run Backend

Local development:

```bash
uvicorn app.main:app --reload
```

Production startup command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Docker from repository root:

```bash
docker build -f backend/Dockerfile -t slabai-backend .
docker run --env-file backend/.env -p 8000:8000 slabai-backend
```

## 4. Run Frontend

From `src/slabai/`:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Required front-end values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

For production, set `NEXT_PUBLIC_API_BASE_URL` to the Railway backend URL.

## 5. Run Tests

Backend checks:

```bash
cd backend
ruff format --check .
ruff check .
mypy app
pytest
```

Frontend checks:

```bash
cd src/slabai
npm run typecheck
npm run build
```

GitHub Actions runs backend format check, lint, type-check, and tests on backend changes.

## 6. Deploy Railway

Railway config is in the repository root at `railway.toml`.

Expected Railway behavior:

- Build with `backend/Dockerfile`.
- Run pre-deploy migration: `alembic upgrade head`.
- Start production server: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT}`.
- Healthcheck path: `/ready`.

Railway variables to configure:

```env
APP_NAME=SLABAI Backend
ENVIRONMENT=production
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_AUDIENCE=authenticated
CORS_ORIGINS=https://app.slabai.com,https://slabai.com
OPENAI_API_KEY=...
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
```

Do not configure or run development seed commands in Railway production.

## 7. Configure Supabase

1. Create or select the Supabase project.
2. Copy the project URL into `SUPABASE_URL`.
3. Configure `SUPABASE_JWKS_URL` as `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`.
4. Use the Supabase Postgres connection string for `DATABASE_URL`, converted to `postgresql+asyncpg://`.
5. Enable email OTP and Google OAuth providers as needed in Supabase Auth.
6. Add the front-end production URL to Supabase Auth redirect URLs.
7. Add the same front-end production URL to backend `CORS_ORIGINS`.
8. Keep the service role key server-side only. It is not required by the current backend MVP.

## Security Notes

- Supabase Auth owns registration, login, sessions, and refresh tokens.
- Backend verifies bearer JWTs and never returns auth secrets.
- `profiles.role` supports only `USER` and `ADMIN`.
- `profiles.status = SUSPENDED` blocks protected API usage.
- User endpoints are scoped by `user_id`.
- `/api/v1/admin/*` requires `ADMIN`.
- Pagination `limit` is capped at 100.
- CORS origins are environment-driven.
- AI Agent traces are sanitized and must not include access tokens, full email addresses, secrets, or unnecessary sensitive health data.
