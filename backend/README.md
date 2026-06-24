# Backend API — SlabAI

FastAPI server that exposes the AI Agent as a REST API, with full CORS support and Prometheus metrics.

## Architecture

```
Frontend (Next.js :3000)
        ↓  HTTP
  guardrails/ (input scan)
        ↓
  backend/routers/chat.py  →  src/agent.py  →  OpenAI GPT-4o
        ↓
  guardrails/ (output scan)
        ↓
  Response returned
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` | Root info |
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/metrics` | Prometheus metrics |
| `POST` | `/api/chat` | Chat with AI agent |
| `GET`  | `/api/products` | List all products |
| `GET`  | `/api/products/{id}` | Get product by ID |

### Chat Request Body

```json
{
  "query": "Is PROD-102 in stock?",
  "user_id": "optional-user-id"
}
```

### Chat Response

```json
{
  "response": "PROD-102 is currently out of stock...",
  "is_safe": true,
  "latency_ms": 1240.5,
  "token_usage": {
    "prompt_tokens": 120,
    "completion_tokens": 85,
    "total_tokens": 205
  },
  "guardrail_warnings": []
}
```

## Running

### 1. Install dependencies

```bash
pip install -r backend/requirements.txt
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in OPENAI_API_KEY
```

### 3. Start the server

```bash
# From project root
uvicorn backend.main:app --reload --port 8000
```

### 4. View interactive docs

Open: http://localhost:8000/docs

## Error Codes

| Status | Code | Meaning |
|--------|------|---------|
| `400` | `input_blocked` | Query blocked by guardrails |
| `429` | `rate_limit_exceeded` | Too many requests |
| `503` | `agent_unavailable` | OpenAI API key not configured |
| `500` | `agent_error` | Internal agent error |
