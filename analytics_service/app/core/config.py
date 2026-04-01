from pydantic_settings import BaseSettings
from urllib.parse import quote_plus

class Settings(BaseSettings):
    PROJECT_NAME: str = "Analytics Service"
    ENVIRONMENT: str = "local"

    # Postgres configuration — override via .env
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "analytics_db"

    # AI Configuration (Free Tier via Groq)
    GROQ_API_KEY: str = "gsk_placeholder"

    @property
    def DATABASE_URL(self) -> str:
        # Always PostgreSQL — password is URL-encoded to handle special chars like @
        pwd = quote_plus(self.POSTGRES_PASSWORD)
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{pwd}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

