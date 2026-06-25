# SLABAI

SLABAI is a training assistant MVP with a Next.js front-end, a FastAPI backend, Supabase Auth/Postgres, and a simple LangGraph AI Coach.

## Structure

```text
backend/      FastAPI backend, Alembic migrations, Docker deployment
src/slabai/   Next.js front-end
docs/         Architecture and planning docs
railway.toml  Railway deployment config for the backend
```

## Deployment Readiness

The backend deployment setup includes:

- Dockerfile: `backend/Dockerfile`
- Railway config: `railway.toml`
- GitHub Actions backend CI: `.github/workflows/backend-ci.yml`
- Health endpoint: `GET /health`
- Readiness endpoint: `GET /ready`
- Migration command: `alembic upgrade head`
- Production startup command: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT}`
- Environment documentation: `backend/.env.example` and this README
- CORS via `CORS_ORIGINS`
- No hard-coded secrets in deployment files
- No production seed command

## Environment Variables

Backend variables are configured in `backend/.env` locally and Railway variables in production.

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

AI Coach values:

```env
OPENAI_API_KEY=
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
```

Front-end variables are configured in `src/slabai/.env.local` locally and in the front-end hosting environment in production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_BASE_URL=https://<railway-backend-domain>
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the front-end. Do not commit `.env`, `.env.local`, access tokens, API keys, service-role keys, or database passwords.

## 1. Run Local

Install backend dependencies:

```bash
cd backend
cp .env.example .env
python -m venv .venv
.venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

Install front-end dependencies:

```bash
cd src/slabai
cp .env.example .env.local
npm install
```

## 2. Run Migration

From `backend/`:

```bash
alembic upgrade head
```

Use the async SQLAlchemy dialect in `DATABASE_URL`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

Development seed is manual only:

```bash
python scripts/seed_dev.py
```

Do not run the seed script in production.

## 3. Run Backend

From `backend/`:

```bash
uvicorn app.main:app --reload
```

Useful URLs:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/ready
http://127.0.0.1:8000/docs
```

## 4. Run Frontend

From `src/slabai/`:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 5. Run Tests

Backend:

```bash
cd backend
ruff format --check .
ruff check .
mypy app
pytest
```

Front-end:

```bash
cd src/slabai
npm run typecheck
npm run build
```

GitHub Actions runs backend format, lint, type-check, and tests for backend changes.

## 6. Deploy Railway

Railway uses `railway.toml`:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
preDeployCommand = "alembic upgrade head"
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"
healthcheckPath = "/ready"
```

Set Railway variables from the backend environment section above.

Important:

- Railway runs migrations with `alembic upgrade head`.
- Railway starts the API with the production startup command.
- Railway healthcheck uses `/ready`.
- Do not configure `python scripts/seed_dev.py` in Railway production.

## 7. Configure Supabase

1. Create or select the Supabase project.
2. Enable the required auth providers, such as email OTP and Google OAuth.
3. Add local and production front-end URLs to Supabase Auth redirect URLs.
4. Copy the project URL to `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy the anon key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Configure `SUPABASE_JWKS_URL` as `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`.
7. Use the Supabase Postgres connection string for `DATABASE_URL`, converted to `postgresql+asyncpg://`.
8. Set backend `CORS_ORIGINS` to include the production front-end domain.
9. Keep the service role key server-side only. It is not required by the current MVP backend.

## More Detail

Backend-specific notes are in `backend/README.md`.
