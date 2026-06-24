"""
Guardrails Package — AI Safety Layer using llm-guard (Protect AI).

Modules:
    policy       — Centralized configuration for all guardrails
    input_guard  — Scan and validate user inputs before they reach the LLM
    output_guard — Scan and sanitize LLM outputs before returning to users
    rate_limiter — In-memory rate limiting per user/IP
"""
from guardrails.policy import GUARDRAIL_CONFIG
from guardrails.input_guard import scan_input
from guardrails.output_guard import scan_output
from guardrails.rate_limiter import RateLimiter

__all__ = [
    "GUARDRAIL_CONFIG",
    "scan_input",
    "scan_output",
    "RateLimiter",
]
