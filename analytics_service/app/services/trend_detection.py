import logging
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import ProductPriceHistory, Product

logger = logging.getLogger(__name__)

async def detect_trends(db: AsyncSession):
    logger.info("Detecting trends using historical data...")
    
    # fetch historical data
    stmt = select(ProductPriceHistory.price, ProductPriceHistory.recorded_at, Product.category, Product.name).join(Product)
    result = await db.execute(stmt)
    records = result.all()
    
    if not records:
        return {"trending_keywords": [], "patterns": ["No historical patterns found."]}
        
    df = pd.DataFrame(records, columns=["price", "recorded_at", "category", "name"])
    
    if df.empty:
        return {"trending_keywords": [], "patterns": ["No historical patterns found."]}
        
    # Simple pandas analysis: find category with highest average price
    avg_price_by_cat = df.groupby("category")["price"].mean().to_dict()
    
    keys_list = list(avg_price_by_cat.keys())
    trending = []
    for i in range(min(3, len(keys_list))):
        trending.append(keys_list[i])
    patterns = [f"Category '{cat}' averages ${price:.2f}" for cat, price in avg_price_by_cat.items()]
    
    return {"trending_categories": trending, "patterns": patterns}
