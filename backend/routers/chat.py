"""
Chat Router — handles AI agent interactions with guardrails protection.
POST /api/chat  → runs the AI agent workflow through input + output guards
"""
import time
import sys
import os
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.agent import run_agent_workflow
from guardrails.input_guard import scan_input
from guardrails.output_guard import scan_output
from guardrails.rate_limiter import RateLimiter

router = APIRouter()
rate_limiter = RateLimiter()

# ── Request / Response Schemas ─────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="User query to the AI agent")
    user_id: Optional[str] = Field(None, description="Optional user ID for rate limiting")

class ChatResponse(BaseModel):
    response: str
    is_safe: bool
    latency_ms: float
    token_usage: dict
    guardrail_warnings: list[str] = []

# ── Chat Endpoint ──────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest):
    """
    Main chat endpoint. Processes user queries through:
    1. Rate limiter  — enforce request limits per IP
    2. Input guard   — LLM Guard scanners on the query
    3. AI agent      — OpenAI GPT-4o with tool calling
    4. Output guard  — LLM Guard scanners on the response
    """
    start_time = time.time()
    client_ip = request.client.host
    user_id = body.user_id or client_ip

    # ── Step 1: Rate Limiting ──────────────────────────────────────────────────
    if not rate_limiter.allow(user_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "rate_limit_exceeded",
                "message": "Too many requests. Please wait before sending another message.",
                "retry_after_seconds": 60
            }
        )

    # ── Step 2: Input Guard ────────────────────────────────────────────────────
    input_result = scan_input(body.query)
    if not input_result["is_safe"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "input_blocked",
                "message": "Your message was flagged by our safety filters.",
                "reason": input_result["reason"]
            }
        )

    # ── Step 3: Run AI Agent ───────────────────────────────────────────────────
    try:
        agent_result = run_agent_workflow(body.query)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "agent_unavailable", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "agent_error", "message": "The AI agent encountered an error."}
        )

    # ── Step 4: Output Guard ───────────────────────────────────────────────────
    output_result = scan_output(agent_result["response"])
    final_response = output_result["sanitized_output"]
    warnings = output_result.get("warnings", [])

    latency_ms = (time.time() - start_time) * 1000

    return ChatResponse(
        response=final_response,
        is_safe=output_result["is_safe"],
        latency_ms=round(latency_ms, 2),
        token_usage=agent_result.get("token_usage", {}),
        guardrail_warnings=warnings,
    )
