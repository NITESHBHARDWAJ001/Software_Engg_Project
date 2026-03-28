from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services import scraper, competitor_analysis, trend_detection, report_generator

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Analytics Service API"}

@router.post("/scrape")
async def trigger_scrape(url: str, db: AsyncSession = Depends(get_db)):
    result = await scraper.scrape_competitor_data(url, db)
    return {"message": "Scraping completed", "data": result}

@router.post("/analyze")
async def trigger_analysis(db: AsyncSession = Depends(get_db)):
    result = await competitor_analysis.analyze_competitors(db)
    return {"message": "Analysis completed", "data": result}

@router.get("/trends")
async def get_trends(db: AsyncSession = Depends(get_db)):
    result = await trend_detection.detect_trends(db)
    return {"message": "Trends detected", "data": result}

@router.post("/report")
async def create_report(db: AsyncSession = Depends(get_db)):
    trends = await trend_detection.detect_trends(db)
    analysis = await competitor_analysis.analyze_competitors(db)
    result = await report_generator.generate_report(db, analysis, trends)
    return {"message": "Report generated", "data": result}
