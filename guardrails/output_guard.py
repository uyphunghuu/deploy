"""
Output Guard — Scans LLM responses before returning them to users.

Uses llm-guard (Protect AI) output scanners:
  - Toxicity    : detects toxic or harmful content in the AI response
  - Sensitive   : detects accidental exposure of sensitive information
  - BanTopics   : blocks responses about forbidden subjects
  - LanguageSame: ensures the AI responds in the same language as the user

Falls back gracefully if llm-guard is not installed.
"""
import logging
import re
from typing import TypedDict

from guardrails.policy import GUARDRAIL_CONFIG

logger = logging.getLogger(__name__)


class OutputScanResult(TypedDict):
    is_safe: bool
    sanitized_output: str
    warnings: list
    scores: dict


def _build_output_scanners():
    """Build llm-guard output scanners. Returns None if library not installed."""
    try:
        from llm_guard.output_scanners import (
            Toxicity,
            Sensitive,
            BanTopics,
            LanguageSame,
        )

        scanners = [
            Toxicity(threshold=GUARDRAIL_CONFIG["toxicity_threshold"]),
            Sensitive(redact=True),          # Redact PII automatically
            BanTopics(
                topics=GUARDRAIL_CONFIG["blocked_input_topics"],
                threshold=0.6,
            ),
            LanguageSame(
                valid_languages=["en", "vi"],   # English and Vietnamese
                threshold=0.6,
            ),
        ]
        logger.info("[OutputGuard] llm-guard output scanners loaded successfully.")
        return scanners
    except ImportError:
        logger.warning(
            "[OutputGuard] llm-guard not installed. "
            "Running with basic pattern-check only. "
            "Install with: pip install llm-guard"
        )
        return None


# Initialise scanners once at module load time
_OUTPUT_SCANNERS = _build_output_scanners()


def _basic_pattern_check(output: str) -> list:
    """
    Check output against the blocked pattern list from policy.
    Returns a list of warning strings for any matches found.
    """
    warnings = []
    lower = output.lower()
    for pattern in GUARDRAIL_CONFIG["blocked_output_patterns"]:
        if pattern.lower() in lower:
            warnings.append(f"Output contains blocked pattern: '{pattern}'")
            logger.warning("[OutputGuard] Blocked pattern found: '%s'", pattern)
    return warnings


def _truncate_if_needed(output: str) -> str:
    """Truncate output to max_output_length if it exceeds the limit."""
    max_len = GUARDRAIL_CONFIG["max_output_length"]
    if len(output) > max_len:
        logger.info("[OutputGuard] Output truncated from %d to %d chars.", len(output), max_len)
        return output[:max_len] + "\n\n[Response truncated for safety.]"
    return output


def scan_output(response: str, prompt: str = "") -> OutputScanResult:
    """
    Main entry point — scan an LLM response for safety issues.

    Args:
        response: The raw LLM output string.
        prompt:   The original user prompt (required by some llm-guard scanners).

    Returns:
        OutputScanResult with `is_safe`, `sanitized_output`, `warnings`, `scores`.

    Example:
        >>> result = scan_output("PROD-102 is out of stock. Price is $250.")
        >>> result["is_safe"]
        True
    """
    if not response:
        return OutputScanResult(
            is_safe=True,
            sanitized_output="",
            warnings=[],
            scores={},
        )

    warnings = []

    # ── Use llm-guard if available ─────────────────────────────────────────────
    if _OUTPUT_SCANNERS is not None:
        try:
            from llm_guard import scan_output as llm_guard_scan_output

            sanitized, results, is_valid_map = llm_guard_scan_output(
                _OUTPUT_SCANNERS, prompt, response
            )

            scores = {
                scanner_name: float(score)
                for scanner_name, score in results.items()
            }

            failed = [name for name, valid in is_valid_map.items() if not valid]
            all_safe = len(failed) == 0

            if failed:
                warnings.append(f"Output flagged by scanner(s): {', '.join(failed)}")
                logger.warning("[OutputGuard] Flagged by: %s", failed)
            else:
                logger.info("[OutputGuard] PASSED")

            # Always run pattern check on top of llm-guard
            pattern_warnings = _basic_pattern_check(sanitized)
            warnings.extend(pattern_warnings)

            # Truncate if needed
            sanitized = _truncate_if_needed(sanitized)

            return OutputScanResult(
                is_safe=all_safe and len(pattern_warnings) == 0,
                sanitized_output=sanitized,
                warnings=warnings,
                scores=scores,
            )

        except Exception as exc:
            logger.error("[OutputGuard] Scanner error: %s — falling back to basic check.", exc)

    # ── Fallback: basic pattern check + truncation ─────────────────────────────
    pattern_warnings = _basic_pattern_check(response)
    warnings.extend(pattern_warnings)
    sanitized = _truncate_if_needed(response)

    return OutputScanResult(
        is_safe=len(pattern_warnings) == 0,
        sanitized_output=sanitized,
        warnings=warnings,
        scores={},
    )
