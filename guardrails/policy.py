"""
Centralized Guardrail Policy Configuration.

All guardrail thresholds, limits, and topic blocklists are defined here.
Modify this file to tune the safety behavior without touching guard logic.
"""

GUARDRAIL_CONFIG = {
    # ── Input Limits ────────────────────────────────────────────────────────────
    "max_input_length": 1000,       # Max characters allowed in a user query
    "max_token_count": 256,         # Approximate max token count for input

    # ── Rate Limiting ────────────────────────────────────────────────────────────
    "rate_limit_per_minute": 10,    # Max requests per minute per user/IP
    "rate_limit_per_day": 200,      # Max requests per day per user/IP

    # ── LLM Guard Scanner Thresholds (0.0 → 1.0) ──────────────────────────────
    # Higher = more sensitive/strict
    "prompt_injection_threshold": 0.75,
    "toxicity_threshold": 0.75,
    "pii_threshold": 0.75,

    # ── Blocked Topics (input) ─────────────────────────────────────────────────
    # Queries mentioning these topics will be rejected
    "blocked_input_topics": [
        "how to hack",
        "create malware",
        "illegal weapons",
        "child exploitation",
        "bypass security",
    ],

    # ── Blocked Topics (output) ────────────────────────────────────────────────
    # Responses containing these patterns will be sanitized
    "blocked_output_patterns": [
        "system prompt",
        "ignore previous instructions",
        "as an AI language model, I must",
    ],

    # ── PII Types to Detect ────────────────────────────────────────────────────
    # These entity types will be detected and flagged by llm-guard
    "pii_entities": [
        "CREDIT_CARD",
        "PHONE_NUMBER",
        "EMAIL_ADDRESS",
        "PERSON",
        "LOCATION",
        "NRP",               # National Registration/Passport number
        "MEDICAL_LICENSE",
    ],

    # ── Output Limits ────────────────────────────────────────────────────────────
    "max_output_length": 3000,      # Max characters allowed in an AI response
}
