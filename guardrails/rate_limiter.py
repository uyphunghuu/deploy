"""
Rate Limiter — In-memory sliding window rate limiting per user/IP.

Uses a simple deque-based sliding window approach — no Redis required.
Suitable for single-process deployments. For multi-process, swap with
a Redis-backed implementation.
"""
import time
import logging
from collections import defaultdict, deque
from threading import Lock
from typing import Dict, Deque

from guardrails.policy import GUARDRAIL_CONFIG

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Sliding window rate limiter.

    Tracks request timestamps per user_id and enforces:
      - max N requests per minute (short-term burst protection)
      - max M requests per day   (daily quota)

    Thread-safe via a per-user lock.

    Usage:
        limiter = RateLimiter()

        if not limiter.allow("user-123"):
            raise HTTPException(429, "Too many requests")
    """

    def __init__(
        self,
        per_minute: int | None = None,
        per_day: int | None = None,
    ):
        self.per_minute = per_minute or GUARDRAIL_CONFIG["rate_limit_per_minute"]
        self.per_day = per_day or GUARDRAIL_CONFIG["rate_limit_per_day"]

        # user_id → deque of POSIX timestamps
        self._minute_windows: Dict[str, Deque[float]] = defaultdict(deque)
        self._day_windows:    Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _prune(self, window: Deque[float], horizon: float) -> None:
        """Remove timestamps older than `horizon` from the deque."""
        while window and window[0] < horizon:
            window.popleft()

    def allow(self, user_id: str) -> bool:
        """
        Check whether a request from `user_id` is within rate limits.

        Returns True if allowed, False if throttled.
        """
        now = time.time()
        minute_horizon = now - 60
        day_horizon    = now - 86_400  # 24 hours

        with self._lock:
            minute_window = self._minute_windows[user_id]
            day_window    = self._day_windows[user_id]

            self._prune(minute_window, minute_horizon)
            self._prune(day_window,    day_horizon)

            minute_count = len(minute_window)
            day_count    = len(day_window)

            if minute_count >= self.per_minute:
                logger.warning(
                    "[RateLimiter] BLOCKED (per-minute) user=%s count=%d limit=%d",
                    user_id, minute_count, self.per_minute
                )
                return False

            if day_count >= self.per_day:
                logger.warning(
                    "[RateLimiter] BLOCKED (per-day) user=%s count=%d limit=%d",
                    user_id, day_count, self.per_day
                )
                return False

            # Record this request
            minute_window.append(now)
            day_window.append(now)

        logger.debug(
            "[RateLimiter] ALLOWED user=%s minute=%d/%d day=%d/%d",
            user_id, minute_count + 1, self.per_minute,
            day_count + 1, self.per_day
        )
        return True

    def remaining(self, user_id: str) -> dict:
        """Return remaining request counts for a user (for X-RateLimit headers)."""
        now = time.time()
        with self._lock:
            minute_window = self._minute_windows[user_id]
            day_window    = self._day_windows[user_id]
            self._prune(minute_window, now - 60)
            self._prune(day_window,    now - 86_400)
            return {
                "remaining_per_minute": max(0, self.per_minute - len(minute_window)),
                "remaining_per_day":    max(0, self.per_day    - len(day_window)),
            }

    def reset(self, user_id: str) -> None:
        """Manually reset limits for a user (admin use)."""
        with self._lock:
            self._minute_windows[user_id].clear()
            self._day_windows[user_id].clear()
        logger.info("[RateLimiter] Reset limits for user=%s", user_id)
