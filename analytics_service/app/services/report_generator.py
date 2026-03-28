import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import TrendReport
import datetime

logger = logging.getLogger(__name__)

async def generate_report(db: AsyncSession, analysis_results: dict, trends: dict, report_format="pdf"):
    logger.info(f"Generating report in {report_format} format...")
    
    report_data = {
        "analysis": analysis_results,
        "trends": trends,
        "summary": "Analytics Competitor & Trend Report",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    
    report = TrendReport(
        generated_at=datetime.datetime.utcnow(),
        report_data=report_data
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    
    return {"status": "success", "report_id": report.id, "report_data": report_data}
