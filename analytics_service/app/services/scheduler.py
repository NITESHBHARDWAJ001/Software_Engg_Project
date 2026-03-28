from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging
import asyncio
from sqlalchemy.future import select
from app.db.database import async_session_maker
from app.models.models import Competitor
from app.services.scraper import scrape_competitor_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def scrape_all_tracked_competitors():
    logger.info("Executing scheduled task: Scraping all tracked competitors")
    async with async_session_maker() as db:
        result = await db.execute(select(Competitor))
        competitors = result.scalars().all()
        for comp in competitors:
            try:
                await scrape_competitor_data(comp.url, db)
            except Exception as e:
                logger.error(f"Scheduled scrape failed for {comp.url}: {e}")

def start_scheduler():
    logger.info("Starting scheduler...")
    # Production schedule: Scrape catalog every 12 hours automatically
    scheduler.add_job(scrape_all_tracked_competitors, 'interval', hours=12)
    
    if not scheduler.running:
        scheduler.start()

def stop_scheduler():
    logger.info("Stopping scheduler...")
    if scheduler.running:
        scheduler.shutdown()
