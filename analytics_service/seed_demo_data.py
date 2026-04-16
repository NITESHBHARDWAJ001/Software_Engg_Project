import argparse
import asyncio
import random
from datetime import datetime, timedelta

from sqlalchemy import delete, select

from app.db.database import Base, engine, async_session_maker
from app.models.models import (
    Competitor,
    Product,
    ProductPriceHistory,
    SocialPostSentiment,
    TrendReport,
)

DEMO_ORG_ID = "demo-org-001"
CATEGORIES = ["lehenga", "saree", "kurta_set", "anarkali", "dupatta"]
SENTIMENT_LABELS = ["Positive", "Neutral", "Negative"]
REELS_TEMPLATES = [
    "Instagram reel on festive drop got strong engagement",
    "Styling reel received mixed reactions on price point",
    "Bridal reel comments mention premium look and fit",
    "Influencer reel feedback highlights color accuracy",
    "Try-on reel generated purchase intent in comments",
]
CAMPAIGN_NAMES = [
    "Shaadi Season Spotlight",
    "Festive Glam Edit",
    "Wedding Capsule Launch",
    "Reel To Rack Campaign",
]


def _rand_price(category: str) -> float:
    ranges = {
        "lehenga": (2500, 12000),
        "saree": (1500, 9500),
        "kurta_set": (1200, 6000),
        "anarkali": (1800, 8000),
        "dupatta": (600, 2500),
    }
    low, high = ranges.get(category, (1000, 5000))
    return round(random.uniform(low, high), 2)


async def ensure_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def reset_demo_data(org_id: str) -> None:
    async with async_session_maker() as session:
        competitor_rows = await session.execute(
            select(Competitor.id).where(Competitor.org_id == org_id)
        )
        competitor_ids = [row[0] for row in competitor_rows.all()]

        if competitor_ids:
            product_rows = await session.execute(
                select(Product.id).where(Product.competitor_id.in_(competitor_ids))
            )
            product_ids = [row[0] for row in product_rows.all()]

            if product_ids:
                await session.execute(
                    delete(ProductPriceHistory).where(ProductPriceHistory.product_id.in_(product_ids))
                )

            await session.execute(
                delete(SocialPostSentiment).where(SocialPostSentiment.competitor_id.in_(competitor_ids))
            )
            await session.execute(delete(Product).where(Product.competitor_id.in_(competitor_ids)))
            await session.execute(delete(Competitor).where(Competitor.id.in_(competitor_ids)))

        await session.execute(delete(TrendReport).where(TrendReport.org_id == org_id))
        await session.commit()


async def seed_demo_data(org_id: str) -> None:
    now = datetime.utcnow()

    competitors_seed = [
        ("RangMahal Couture", "https://rangmahal.example.com"),
        ("Noor Ethnics", "https://noor.example.com"),
        ("ThreadStory India", "https://threadstory.example.com"),
    ]

    async with async_session_maker() as session:
        competitors = []
        for name, url in competitors_seed:
            comp = Competitor(org_id=org_id, name=name, url=url)
            session.add(comp)
            competitors.append(comp)

        await session.flush()

        product_count = 0
        sentiment_count = 0
        reels_sentiment_count = 0
        price_points = 0

        for comp in competitors:
            for idx in range(1, 11):
                category = random.choice(CATEGORIES)
                product_name = f"{category.title().replace('_', ' ')} {idx} - {comp.name.split()[0]}"
                product_url = f"{comp.url}/products/{category}-{idx}-{random.randint(1000, 9999)}"
                image_url = f"{comp.url}/images/{category}-{idx}.jpg"

                product = Product(
                    competitor_id=comp.id,
                    name=product_name,
                    category=category,
                    url=product_url,
                    image_url=image_url,
                )
                session.add(product)
                await session.flush()
                product_count += 1

                base_price = _rand_price(category)
                for week_back in [28, 21, 14, 7, 0]:
                    drift = random.uniform(-0.08, 0.1)
                    hist_price = round(base_price * (1 + drift), 2)
                    session.add(
                        ProductPriceHistory(
                            product_id=product.id,
                            price=hist_price,
                            currency="INR",
                            recorded_at=now - timedelta(days=week_back),
                        )
                    )
                    price_points += 1

            for pidx in range(1, 21):
                label = random.choices(SENTIMENT_LABELS, weights=[0.55, 0.3, 0.15])[0]
                score = {
                    "Positive": round(random.uniform(0.2, 1.0), 3),
                    "Neutral": round(random.uniform(-0.2, 0.2), 3),
                    "Negative": round(random.uniform(-1.0, -0.2), 3),
                }[label]
                session.add(
                    SocialPostSentiment(
                        competitor_id=comp.id,
                        post_url=f"https://social.example.com/{comp.name.lower().replace(' ', '-')}/post-{pidx}",
                        content_text=f"Demo sentiment post {pidx} for {comp.name}",
                        sentiment_score=score,
                        sentiment_label=label,
                        analyzed_at=now - timedelta(hours=random.randint(1, 240)),
                    )
                )
                sentiment_count += 1

            # Reels-focused sentiment records for demoing reel sentiment analytics.
            for ridx in range(1, 9):
                label = random.choices(SENTIMENT_LABELS, weights=[0.5, 0.3, 0.2])[0]
                score = {
                    "Positive": round(random.uniform(0.2, 1.0), 3),
                    "Neutral": round(random.uniform(-0.2, 0.2), 3),
                    "Negative": round(random.uniform(-1.0, -0.2), 3),
                }[label]
                reel_text = random.choice(REELS_TEMPLATES)
                session.add(
                    SocialPostSentiment(
                        competitor_id=comp.id,
                        post_url=(
                            f"https://instagram.com/reel/{comp.name.lower().replace(' ', '-')}-{ridx}"
                        ),
                        content_text=f"[REEL] {reel_text} | competitor={comp.name} | clip={ridx}",
                        sentiment_score=score,
                        sentiment_label=label,
                        analyzed_at=now - timedelta(hours=random.randint(1, 120)),
                    )
                )
                sentiment_count += 1
                reels_sentiment_count += 1

        report_payload = {
            "window": "last_30_days",
            "summary": "Demo trend report seeded for dashboard preview",
            "top_categories": ["lehenga", "saree", "kurta_set"],
            "price_pressure": "moderate",
            "sentiment_trend": "positive",
            "reels_sentiment": {
                "total_reels_analyzed": reels_sentiment_count,
                "top_positive_theme": "bridal styling and color richness",
                "top_negative_theme": "price sensitivity in premium segment",
                "engagement_note": "reels with try-on hooks show stronger positive sentiment",
            },
            "campaign_performance": [
                {
                    "campaign_name": CAMPAIGN_NAMES[0],
                    "channel": "instagram_reels",
                    "impressions": 145000,
                    "click_through_rate": 0.038,
                    "conversion_rate": 0.024,
                    "roas": 3.1,
                },
                {
                    "campaign_name": CAMPAIGN_NAMES[1],
                    "channel": "meta_ads",
                    "impressions": 112000,
                    "click_through_rate": 0.031,
                    "conversion_rate": 0.019,
                    "roas": 2.6,
                },
                {
                    "campaign_name": CAMPAIGN_NAMES[2],
                    "channel": "influencer_reels",
                    "impressions": 98000,
                    "click_through_rate": 0.044,
                    "conversion_rate": 0.028,
                    "roas": 3.5,
                },
            ],
            "campaign_recommendations": [
                "Shift 10-15% budget toward influencer reels with proven bridal conversions",
                "Retarget high-intent viewers from reel watchlist with matching catalog SKUs",
                "Use regional language hooks for festival creatives in west and north India",
            ],
        }
        session.add(TrendReport(org_id=org_id, report_data=report_payload, generated_at=now))

        await session.commit()

    print(f"Seed complete for org_id={org_id}")
    print(f"Competitors: {len(competitors_seed)}")
    print(f"Products: {product_count}")
    print(f"Price history points: {price_points}")
    print(f"Social sentiment posts: {sentiment_count}")
    print(f"Reels sentiment posts: {reels_sentiment_count}")
    print("Trend reports: 1")


async def main(reset: bool, org_id: str) -> None:
    await ensure_tables()
    if reset:
        await reset_demo_data(org_id)
        print(f"Cleared old demo data for org_id={org_id}")
    await seed_demo_data(org_id)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed demo data for analytics service")
    parser.add_argument("--reset", action="store_true", help="Delete existing demo rows for the org before seeding")
    parser.add_argument("--org-id", default=DEMO_ORG_ID, help="Organization ID to seed")
    args = parser.parse_args()

    asyncio.run(main(reset=args.reset, org_id=args.org_id))
