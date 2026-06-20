from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Database Configuration (Turso or local SQLite)
    DB_URL: str = "sqlite:///:memory:"
    DB_AUTH_TOKEN: Optional[str] = None

    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"

    # Default FireBoard API Credentials (optional, can be overridden per session)
    FIREBOARD_USERNAME: Optional[str] = None
    FIREBOARD_PASSWORD: Optional[str] = None

    # JWT Settings
    JWT_SECRET: str = "supersecretjwttokenkeyfordevelopmentonly"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Environment
    ENVIRONMENT: str = "development"

    # Settings configurations
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
