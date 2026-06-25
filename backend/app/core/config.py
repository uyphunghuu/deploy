from functools import lru_cache

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SLABAI Backend"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    debug: bool = False

    database_url: str = Field(..., validation_alias="DATABASE_URL")

    supabase_url: AnyHttpUrl | None = None
    supabase_jwks_url: AnyHttpUrl | None = None
    supabase_jwt_audience: str = "authenticated"
    supabase_jwt_secret: str | None = None

    cors_origins: str | list[str] = []

    openai_api_key: str | None = None
    llm_provider: str = "openai"
    llm_model: str = "gpt-4o-mini"
    langfuse_enabled: bool = False
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    langfuse_host: str = "https://cloud.langfuse.com"

    # Integrations
    strava_client_id: str | None = None
    strava_client_secret: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
