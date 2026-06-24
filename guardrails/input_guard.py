"""
Input Guard — Scans user queries before they reach the LLM.

Uses llm-guard (Protect AI) scanners:
  - PromptInjection : detects attempts to hijack/override the system prompt
  - Toxicity        : detects toxic, hateful, or abusive content
  - TokenLimit      : rejects queries that exceed token budget
  - BanTopics       : blocks queries about specific forbidden subjects

Falls back gracefully if llm-guard is not installed (logs a warning).
"""
import logging
from typing import TypedDict

from guardrails.policy import GUARDRAIL_CONFIG

logger = logging.getLogger(__name__)


class InputScanResult(TypedDict):
    is_safe: bool
    sanitized_input: str
    reason: str
    scores: dict


def _build_scanners():
    """Build llm-guard input scanners. Returns None if library not installed."""
    try:
        from llm_guard.input_scanners import (
            PromptInjection,
            Toxicity,
            TokenLimit,
            BanTopics,
        )
        from llm_guard.input_scanners.prompt_injection import MatchType

        scanners = [
            PromptInjection(
                threshold=GUARDRAIL_CONFIG["prompt_injection_threshold"],
                match_type=MatchType.FULL,
            ),
            Toxicity(threshold=GUARDRAIL_CONFIG["toxicity_threshold"]),
            TokenLimit(limit=GUARDRAIL_CONFIG["max_token_count"]),
            BanTopics(
                topics=GUARDRAIL_CONFIG["blocked_input_topics"],
                threshold=0.6,
            ),
        ]
        logger.info("[InputGuard] llm-guard scanners loaded successfully.")
        return scanners
    except ImportError:
        logger.warning(
            "[InputGuard] llm-guard not installed. "
            "Running with basic length-check only. "
            "Install with: pip install llm-guard"
        )
        return None


# Initialise scanners once at module load time
_SCANNERS = _build_scanners()


def _fallback_scan(prompt: str) -> InputScanResult:
    """
    Minimal safety check used when llm-guard is not available.
    Checks length limit and basic keyword blocklist.
    """
    max_len = GUARDRAIL_CONFIG["max_input_length"]
    if len(prompt) > max_len:
        return InputScanResult(
            is_safe=False,
            sanitized_input=prompt,
            reason=f"Input exceeds maximum length of {max_len} characters.",
            scores={},
        )

    lower = prompt.lower()
    for topic in GUARDRAIL_CONFIG["blocked_input_topics"]:
        if topic in lower:
            return InputScanResult(
                is_safe=False,
                sanitized_input=prompt,
                reason=f"Input contains blocked topic: '{topic}'.",
                scores={},
            )

    return InputScanResult(
        is_safe=True,
        sanitized_input=prompt,
        reason="",
        scores={},
    )


def scan_input(prompt: str) -> InputScanResult:
    """
    Main entry point — scan a user query for safety issues.

    Args:
        prompt: The raw user input string.

    Returns:
        InputScanResult with `is_safe`, `sanitized_input`, `reason`, `scores`.

    Example:
        >>> result = scan_input("What is the price of PROD-101?")
        >>> result["is_safe"]
        True
    """
    if not prompt or not prompt.strip():
        return InputScanResult(
            is_safe=False,
            sanitized_input=prompt,
            reason="Input cannot be empty.",
            scores={},
        )

    # ── Use llm-guard if available ─────────────────────────────────────────────
    if _SCANNERS is not None:
        try:
            from llm_guard import scan_prompt

            sanitized, results, is_valid_map = scan_prompt(_SCANNERS, prompt)

            scores = {
                scanner_name: float(score)
                for scanner_name, score in results.items()
            }

            all_safe = all(is_valid_map.values())
            failed = [name for name, valid in is_valid_map.items() if not valid]

            if not all_safe:
                reason = f"Blocked by scanner(s): {', '.join(failed)}."
                logger.warning("[InputGuard] BLOCKED — %s | query='%s'", reason, prompt[:80])
            else:
                logger.info("[InputGuard] PASSED | query='%s'", prompt[:80])

            return InputScanResult(
                is_safe=all_safe,
                sanitized_input=sanitized,
                reason=reason if not all_safe else "",
                scores=scores,
            )

        except Exception as exc:
            logger.error("[InputGuard] Scanner error: %s — falling back to basic check.", exc)

    # ── Fallback ────────────────────────────────────────────────────────────────
    return _fallback_scan(prompt)
