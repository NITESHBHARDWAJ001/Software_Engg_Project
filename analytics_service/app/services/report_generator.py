import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import TrendReport
from app.services.ai_generative import generate_executive_summary
import datetime

logger = logging.getLogger(__name__)

async def generate_report(db: AsyncSession, analysis_results: dict, trends: dict, org_id: str, report_format="json"):
    logger.info(f"[{org_id}] Generating full analytics report...")
    
    ai_summary = await generate_executive_summary({"analysis": analysis_results, "trends": trends})
    
    report_data = {
        "analysis": analysis_results,
        "trends": trends,
        "ai_executive_summary": ai_summary,
        "summary": "Analytics Competitor & Trend Report",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    
    report = TrendReport(
        org_id=org_id,
        generated_at=datetime.datetime.utcnow(),
        report_data=report_data
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    return {"status": "success", "report_id": report.id, "report_data": report_data}
