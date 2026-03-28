import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.models import Competitor, Product, ProductPriceHistory

logger = logging.getLogger(__name__)

async def analyze_competitors(db: AsyncSession):
    logger.info("Analyzing competitor data from database...")
    stmt = select(Product).options(selectinload(Product.competitor), selectinload(Product.price_history))
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    if not products:
        return {"analysis_status": "complete", "insights": ["No competitor data found."], "metrics": {}}
        
    insights = []
    category_prices = {}
    competitor_counts = {}
    
    for p in products:
        # Extract the highest fidelity recent price
        latest_price = 0.0
        if p.price_history:
            latest_price = sorted(p.price_history, key=lambda x: x.recorded_at, reverse=True)[0].price
            
        c_name = p.competitor.name if p.competitor else "Unknown"
        competitor_counts[c_name] = competitor_counts.get(c_name, 0) + 1
        
        if p.category not in category_prices:
            category_prices[p.category] = []
        category_prices[p.category].append({"name": p.name, "price": latest_price, "competitor": c_name})
        
    metrics = {
        "total_competitors_tracked": len(competitor_counts),
        "total_products_tracked": len(products),
        "competitor_catalog_sizes": competitor_counts
    }
    
    for category, items in category_prices.items():
        if len(items) > 1:
            prices = [float(item["price"]) for item in items if float(item["price"]) > 0]
            if prices:
                avg_price = sum(prices) / len(prices)
                min_price_item = min(items, key=lambda x: float(x["price"]))
                max_price_item = max(items, key=lambda x: float(x["price"]))
                insights.append(
                    f"In '{category}', average price is ${avg_price:.2f}. "
                    f"Lowest: {min_price_item['competitor']} at ${float(min_price_item['price']):.2f}. "
                    f"Highest: {max_price_item['competitor']} at ${float(max_price_item['price']):.2f}."
                )
            else:
                insights.append(f"Category '{category}' has items but no numerical pricing available.")
        else:
            insights.append(f"Category '{category}' lacks competitor saturation for pricing variance analysis.")
            
    return {"analysis_status": "complete", "metrics": metrics, "insights": insights}
