import sys
import asyncio
import logging
from app.core.config import settings

# Setup Basic Structured Logging Profile
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Fix NotImplementedError for Playwright on Windows
if sys.platform == "win32" and sys.version_info < (3, 14):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api import routes
from app.services.scheduler import start_scheduler, stop_scheduler
from app.db.database import engine
from app.models.models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Startup actions
    start_scheduler()
    yield
    # Shutdown actions
    stop_scheduler()

app = FastAPI(
    title="Analytics Service",
    description="Service for scraping, competitor analysis, trend detection, and report generation",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(routes.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy"}
