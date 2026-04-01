from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.services import scraper, competitor_analysis, trend_detection, report_generator
from app.services.ai_generative import generate_defensive_copy
from app.models.models import SocialPostSentiment

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Analytics Service API"}

@router.post("/scrape")
async def trigger_scrape(url: str, org_id: str, db: AsyncSession = Depends(get_db)):
    result = await scraper.scrape_competitor_data(url, org_id, db)
    return {"message": "Scraping completed", "data": result}

@router.post("/analyze")
async def trigger_analysis(org_id: str, db: AsyncSession = Depends(get_db)):
    result = await competitor_analysis.analyze_competitors(db, org_id)
    return {"message": "Analysis completed", "data": result}

@router.get("/trends")
async def get_trends(org_id: str, db: AsyncSession = Depends(get_db)):
    result = await trend_detection.detect_trends(db, org_id)
    return {"message": "Trends detected", "data": result}

@router.post("/report")
async def create_report(org_id: str, db: AsyncSession = Depends(get_db)):
    trends = await trend_detection.detect_trends(db, org_id)
    analysis = await competitor_analysis.analyze_competitors(db, org_id)
    result = await report_generator.generate_report(db, analysis, trends, org_id)
    return {"message": "Report generated", "data": result}

@router.post("/analyze-sentiment")
async def analyze_sentiment(url: str, db: AsyncSession = Depends(get_db)):
    """
    Dedicated endpoint for social media NLP sentiment analysis.
    The internal router automatically intercepts social URLs and diverts them from the product pipeline.
    """
    result = await scraper.scrape_competitor_data(url, db)
    return {"message": "Sentiment analysis executed", "data": result}

@router.post("/generate-ad-copy")
async def create_defensive_ad(competitor_domain: str, db: AsyncSession = Depends(get_db)):
    """
    Finds highly NEGATIVE sentiments specific to a competitor inside our DB
    and utilizes OpenAI (GPT-4) to compose hyper-effective counter-marketing ad copy.
    """
    stmt = select(SocialPostSentiment).where(
        SocialPostSentiment.sentiment_label == "Negative",
        SocialPostSentiment.post_url.like(f"%{competitor_domain}%")
    ).order_by(SocialPostSentiment.analyzed_at.desc()).limit(15)
    
    result = await db.execute(stmt)
    negative_posts = result.scalars().all()
    
    ad_copy = await generate_defensive_copy(negative_posts)
    
    return {
        "competitor_targeted": competitor_domain,
        "negative_weaknesses_analyzed": len(negative_posts),
        "ai_ad_copy": ad_copy
    }
