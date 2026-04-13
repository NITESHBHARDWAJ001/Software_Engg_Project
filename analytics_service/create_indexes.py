"""
Database Optimization Script for Analytics Service
Creates indexes and optimizations for dashboard queries
"""
import asyncio
from sqlalchemy import text
from app.db.database import engine

async def create_indexes():
    """Create indexes for faster dashboard queries"""
    indexes = [
        # Competitor queries
        "CREATE INDEX IF NOT EXISTS idx_competitor_org_id ON competitors(org_id);",
        
        # Product queries
        "CREATE INDEX IF NOT EXISTS idx_product_competitor_id ON products(competitor_id);",
        "CREATE INDEX IF NOT EXISTS idx_product_category ON products(category);",
        
        # Price history queries
        "CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON product_price_history(product_id);",
        "CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON product_price_history(recorded_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_price_history_product_recorded ON product_price_history(product_id, recorded_at DESC);",
        
        # Sentiment analysis queries
        "CREATE INDEX IF NOT EXISTS idx_sentiment_competitor_id ON social_post_sentiments(competitor_id);",
        "CREATE INDEX IF NOT EXISTS idx_sentiment_label ON social_post_sentiments(sentiment_label);",
        "CREATE INDEX IF NOT EXISTS idx_sentiment_analyzed_at ON social_post_sentiments(analyzed_at DESC);",
        
        # Trend report queries
        "CREATE INDEX IF NOT EXISTS idx_trend_report_org_id ON trend_report(org_id);",
        "CREATE INDEX IF NOT EXISTS idx_trend_report_generated_at ON trend_report(generated_at DESC);",
        
        # Composite indexes for common queries
        "CREATE INDEX IF NOT EXISTS idx_competitor_org_product ON competitors(org_id) INCLUDE (id, name, url);",
        "CREATE INDEX IF NOT EXISTS idx_sentiment_competitor_label ON social_post_sentiments(competitor_id, sentiment_label);",
    ]
    
    async with engine.begin() as conn:
        for index_sql in indexes:
            try:
                await conn.execute(text(index_sql))
                print(f"✓ {index_sql[:60]}...")
            except Exception as e:
                print(f"✗ Failed: {index_sql[:60]}... - {e}")
        
        await conn.commit()

async def main():
    print("Creating database indexes for analytics service...")
    await create_indexes()
    print("Database optimization complete!")

if __name__ == "__main__":
    asyncio.run(main())
