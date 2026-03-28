from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Analytics Service"
    ENVIRONMENT: str = "local"
    # Postgres configuration
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "analytics"
    
    @property
    def DATABASE_URL(self) -> str:
        if self.ENVIRONMENT == "production":
            return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        return "sqlite+aiosqlite:///./analytics.db"
        
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
