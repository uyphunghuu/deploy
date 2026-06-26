from __future__ import annotations

import re

NON_RUNNING_SPORT_TERMS = (
    "cycling",
    "bike",
    "biking",
    "swim",
    "swimming",
    "bơi",
    "đạp xe",
    "đap xe",
    "triathlon",
)

URGENT_HEALTH_TERMS = (
    "chest pain",
    "đau ngực",
    "dizzy",
    "chóng mặt",
    "faint",
    "ngất",
    "shortness of breath",
    "khó thở",
    "khó thở bất thường",
    "severe pain",
    "đau dữ dội",
    "serious injury",
    "chấn thương nghiêm trọng",
    "abnormal heart rhythm",
    "nhịp tim bất thường",
)

SECRET_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9_\-]{12,}"),
    re.compile(r"Bearer\s+[A-Za-z0-9._\-]{12,}", re.IGNORECASE),
)


def build_scope_note(message: str) -> str | None:
    normalized = message.lower()
    if any(term in normalized for term in NON_RUNNING_SPORT_TERMS):
        return (
            "The athlete asked about another sport. Keep the answer focused on running only and explain that this "
            "MVP only supports running guidance."
        )
    return None


def build_health_note(message: str) -> str | None:
    normalized = message.lower()
    if any(term in normalized for term in URGENT_HEALTH_TERMS):
        return (
            "The athlete mentioned a potentially serious symptom. Recommend stopping intense training and seeking "
            "qualified medical help."
        )
    return None


def redact_sensitive_text(text: str) -> str:
    safe = text
    for pattern in SECRET_PATTERNS:
        safe = pattern.sub("[redacted]", safe)
    return safe
