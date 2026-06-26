# Running AI Coach Conversion Audit

Status: legacy chatbot cleanup completed after the Running AI Coach integration and tests.

## Current Architecture

SLABAI now uses one chatbot runtime:

- Frontend: `src/slabai` keeps the chat UI and sends authenticated requests to the backend.
- Backend route: `POST /api/v1/ai/coach/chat`.
- Auth: the backend resolves the current user from the existing Supabase JWT flow.
- Agent: `backend/app/ai/running_coach`.
- Data: existing profile, sport profile, activity, calendar, and training plan models.
- Memory MVP: frontend-owned `conversation_id` and localStorage history; backend validates and trims the latest user/assistant messages.

No separate chatbot backend, separate frontend app, data collection pipeline, or product knowledge base remains in the runtime.

## Cleanup Confirmation

Before deletion:

- No runtime imports or references from `backend`, `src/slabai`, root README, root env example, or project docs depended on the legacy chatbot files.
- Backend test passed.
- Frontend production build passed.
- No user `.env` file was found inside the legacy chatbot folder; only an example env file was part of the legacy files.
- Root `.gitignore` ignores `.env`, so root and nested `.env` files stay out of git.

The reusable ideas have been carried into the new backend implementation:

- Provider boundary: `providers.py`.
- Prompt separation: `prompts.py`.
- Structured schema and parser: `schemas.py` and `graph.py`.
- Message/history handling: FastAPI request schema plus frontend chat service.
- Error fallback and retry-friendly boundaries: provider and graph error handling.
- Read-only tool orchestration: `tools.py` plus LangGraph.

## Removed Legacy Surface

The full legacy chatbot folder was removed. The deletion covered 681 files:

- 7 old Python runtime files.
- 608 old crawled or compiled banking documents.
- 21 old standalone frontend files.
- 2 old prompt/skill files.
- 39 auxiliary taste-skill files that lived only under the legacy folder.
- 4 old root metadata files in the legacy folder.

Removed categories:

- Old domain prompt.
- Old banking product data.
- Old data collection and compile pipeline.
- Old direct model-provider client and streaming path.
- Old standalone chatbot UI.
- Old standalone package and dependency manifests.
- Old README and text describing the removed chatbot.

## Kept Files

No file from the removed legacy chatbot folder is kept.

The active SLABAI implementation is kept:

- `backend/app/ai/running_coach/*`
- `backend/app/api/v1/ai.py`
- `backend/app/schemas.py`
- `src/slabai/src/services/chat-service.ts`
- `src/slabai/src/hooks/use-chat.ts`
- `src/slabai/src/components/chatbot/*`
- Running Coach tests under `backend/tests/test_running_coach_*`
- Evaluation dataset and script under `backend/evals` and `backend/scripts`

## Target Architecture

The target state is now the current state:

```text
src/slabai chatbot UI
  -> ApiChatService
  -> Supabase bearer token
  -> FastAPI POST /api/v1/ai/coach/chat
  -> RunningCoachService
  -> LangGraph read-only agent
  -> context loader + tools + safety + provider
  -> validated structured response
```

The model provider is configured only through backend environment variables:

- `OPENAI_API_KEY`
- `LLM_PROVIDER`
- `LLM_MODEL`
- `LANGFUSE_ENABLED`

No frontend code should call a model provider directly.

## Risks

- Some full-repo lint/type-check commands can still surface unrelated existing issues outside Running Coach.
- The MVP stores conversation history in localStorage, so cross-device chat history is not available yet.
- LLM output still requires validation and fallback; tests cover invalid structured output and model/tool failures.
- The coach is not a medical diagnostic tool and must keep safety language conservative.

## Verification

Required verification after cleanup:

```bash
cd backend
ruff format --check .
ruff check .
mypy app
pytest
python scripts/evaluate_running_coach.py

cd ../src/slabai
npm run typecheck
npm run build
```

The evaluation script is deterministic by default and must not call an LLM in CI unless explicitly enabled.
