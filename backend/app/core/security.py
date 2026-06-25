from __future__ import annotations

from dataclasses import dataclass
from time import time
from typing import Any

import httpx
import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.core.config import Settings


@dataclass(frozen=True)
class SupabaseClaims:
    sub: str
    email: str | None
    role: str | None
    raw: dict[str, Any]


class SupabaseJWTVerifier:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._jwk_client: PyJWKClient | None = None

    def verify(self, token: str) -> SupabaseClaims:
        try:
            claims = self._decode(token)
        except jwt.PyJWTError as exc:
            print(f"JWT Verification Error: {exc}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {exc}",
            ) from exc

        subject = claims.get("sub")
        if not isinstance(subject, str) or not subject:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")

        email = claims.get("email")
        return SupabaseClaims(
            sub=subject,
            email=email if isinstance(email, str) else None,
            role=claims.get("role") if isinstance(claims.get("role"), str) else None,
            raw=claims,
        )

    def _decode(self, token: str) -> dict[str, Any]:
        if self.settings.supabase_jwt_secret:
            return jwt.decode(
                token,
                self.settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience=self.settings.supabase_jwt_audience,
                options={"verify_exp": True},
            )

        if not self.settings.supabase_jwks_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase JWKS URL is not configured.",
            )

        if self._jwk_client is None:
            self._jwk_client = PyJWKClient(str(self.settings.supabase_jwks_url))
        signing_key = self._jwk_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience=self.settings.supabase_jwt_audience,
            options={"verify_exp": True},
        )


async def fetch_jwks_health(settings: Settings) -> dict[str, Any]:
    if not settings.supabase_jwks_url:
        return {"configured": False}
    started = time()
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get(str(settings.supabase_jwks_url))
        response.raise_for_status()
    return {"configured": True, "latency_ms": round((time() - started) * 1000)}

