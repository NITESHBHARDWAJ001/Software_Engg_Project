#!/usr/bin/env python
"""
Comprehensive analytics service seed script.
Seeds demo data for multiple orgs with all analytics data types.

Usage:
  python seed_all_analytics.py                           # Seed default org IDs
  python seed_all_analytics.py --org-ids org1 org2 org3  # Seed specific orgs
  python seed_all_analytics.py --reset --org-ids org1    # Reset then seed one org
  python seed_all_analytics.py --auto --count 3          # Auto-generate 3 random org IDs
  python seed_all_analytics.py --list-orgs               # Show existing orgs in DB
  python seed_all_analytics.py --from-backend            # Seed all orgs from backend (requires backend running)

Options:
  --org-ids ORG_IDS           Specific org IDs to seed
  --auto                      Auto-generate random org IDs (default: 1)
  --count N                   Number of orgs to generate with --auto (default: 1)
  --list-orgs                 List all organizations in database
  --from-backend              Fetch org IDs from backend API
  --backend-url URL           Backend URL (default: http://localhost:4002)
  --reset                     Clear existing data before seeding
"""

import argparse
import asyncio
import random
import uuid
import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy import delete, select
from app.db.database import Base, engine, async_session_maker
from app.models.models import (
    Organization,
    Competitor,
    Product,
    ProductPriceHistory,
    SocialPostSentiment,
    TrendReport,
    StockContextEntry,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_org_ids(count: int = 1) -> list[str]:
    """Generate random org IDs."""
    return [f"auto-org-{uuid.uuid4().hex[:8]}" for _ in range(count)]


async def list_existing_orgs() -> list[str]:
    """List all org IDs in the database."""
    async with async_session_maker() as session:
        result = await session.execute(select(Organization.org_id).order_by(Organization.org_id))
        org_ids = [row[0] for row in result.all()]
    return org_ids


async def fetch_orgs_from_backend(backend_url: str = "http://localhost:4002") -> list[str]:
    """Fetch all organizations from backend API."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Try multiple endpoints that might list orgs
            endpoints = [
                "/api/v1/organizations",
                "/api/v1/organizations/list",
                "/api/organizations",
            ]
            
            for endpoint in endpoints:
                url = f"{backend_url}{endpoint}"
                try:
                    response = await client.get(url)
                    if response.status_code == 200:
                        data = response.json()
                        # Extract org_ids from response
                        if isinstance(data, dict) and "data" in data:
                            data = data["data"]
                        if isinstance(data, list):
                            org_ids = [
                                org.get("org_id", org.get("id", str(org)))
                                for org in data
                                if org
                            ]
                            return org_ids
                except (httpx.RequestError, ValueError):
                    continue
            
            print(f"  ⚠️  Could not fetch orgs from backend at {backend_url}")
            return []
    except Exception as e:
        print(f"  ✗ Error fetching from backend: {e}")
        return []


DEFAULT_ORG_IDS = [
    "demo-org-001",
    "demo-org-002",
    "844bea82-3378-4b38-b39e-7410d12c624c",  # From earlier conversation
]

CATEGORIES = ["lehenga", "saree", "kurta_set", "anarkali", "dupatta"]
SENTIMENT_LABELS = ["Positive", "Neutral", "Negative"]
COMPETITORS_SEED = [
    ("RangMahal Couture", "https://rangmahal.example.com"),
    ("Noor Ethnics", "https://noor.example.com"),
    ("ThreadStory India", "https://threadstory.example.com"),
]


def _rand_price(category: str) -> float:
    """Generate random price within category range."""
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
    """Create all required tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables ensured")


async def reset_org_data(org_id: str) -> None:
    """Delete all analytics data for an org."""
    async with async_session_maker() as session:
        # Get competitor IDs for this org
        competitor_rows = await session.execute(
            select(Competitor.id).where(Competitor.org_id == org_id)
        )
        competitor_ids = [row[0] for row in competitor_rows.all()]

        if competitor_ids:
            # Delete price history for products
            product_rows = await session.execute(
                select(Product.id).where(Product.competitor_id.in_(competitor_ids))
            )
            product_ids = [row[0] for row in product_rows.all()]

            if product_ids:
                await session.execute(
                    delete(ProductPriceHistory).where(ProductPriceHistory.product_id.in_(product_ids))
                )

            # Delete sentiment data
            await session.execute(
                delete(SocialPostSentiment).where(SocialPostSentiment.competitor_id.in_(competitor_ids))
            )

            # Delete products and competitors
            await session.execute(delete(Product).where(Product.competitor_id.in_(competitor_ids)))
            await session.execute(delete(Competitor).where(Competitor.id.in_(competitor_ids)))

        # Delete trend reports and stock context
        await session.execute(delete(TrendReport).where(TrendReport.org_id == org_id))
        await session.execute(delete(StockContextEntry).where(StockContextEntry.org_id == org_id))

        await session.commit()
    print(f"  ✓ Reset data for {org_id}")


async def seed_org(org_id: str) -> None:
    """Seed complete demo analytics data for an org."""
    print(f"\n📊 Seeding {org_id}...")
    now = utc_now()

    async with async_session_maker() as session:
        # Ensure organization exists
        org_check = await session.execute(
            select(Organization).where(Organization.org_id == org_id)
        )
        if not org_check.scalar():
            org = Organization(org_id=org_id, name=f"Demo Org {org_id[:8]}")
            session.add(org)

        # Create competitors
        competitors = []
        for comp_name, comp_url in COMPETITORS_SEED:
            comp = Competitor(org_id=org_id, name=comp_name, url=comp_url)
            session.add(comp)
            competitors.append(comp)

        await session.flush()

        # Create products and price history
        products_created = 0
        price_history_created = 0

        for comp in competitors:
            for _ in range(30):
                category = random.choice(CATEGORIES)
                product = Product(
                    competitor_id=comp.id,
                    name=f"{category.replace('_', ' ').title()} {random.randint(1, 999)}",
                    category=category,
                    url=f"https://example.com/product/{random.randint(1000, 9999)}",
                )
                session.add(product)
                await session.flush()

                # Add price history (3-5 months back)
                for days_ago in range(5, 0, -1):
                    price_date = now - timedelta(days=days_ago * 30)
                    price = _rand_price(category)
                    price_history = ProductPriceHistory(
                        product_id=product.id,
                        price=price,
                        currency="INR",
                        recorded_at=price_date,
                    )
                    session.add(price_history)
                    price_history_created += 1

                products_created += 1

        print(f"  ✓ Created {products_created} products with {price_history_created} price history records")

        # Create social sentiment posts
        sentiment_created = 0
        for comp in competitors:
            for _ in range(28):
                sentiment = random.choice(SENTIMENT_LABELS)
                post = SocialPostSentiment(
                    competitor_id=comp.id,
                    org_id=org_id,
                    platform="instagram",
                    post_url=f"https://instagram.com/p/{random.randint(10000000, 99999999)}",
                    caption=f"Trending {category} collection - {sentiment.lower()} sentiment",
                    sentiment_label=sentiment,
                    sentiment_score=random.uniform(0, 1),
                    post_type="reel",
                    posted_at=now - timedelta(days=random.randint(1, 60)),
                    created_at=utc_now(),
                )
                session.add(post)
                sentiment_created += 1

        print(f"  ✓ Created {sentiment_created} social sentiment posts")

        # Create reel-specific sentiment data
        reel_sentiment_created = 0
        for comp in competitors:
            for _ in range(8):
                sentiment = random.choice(SENTIMENT_LABELS)
                post = SocialPostSentiment(
                    competitor_id=comp.id,
                    org_id=org_id,
                    platform="instagram",
                    post_url=f"https://instagram.com/reels/{random.randint(10000000, 99999999)}",
                    caption=f"Reel engagement test - {sentiment.lower()} audience response",
                    sentiment_label=sentiment,
                    sentiment_score=random.uniform(0, 1),
                    post_type="reel",
                    posted_at=now - timedelta(days=random.randint(1, 30)),
                    created_at=utc_now(),
                )
                session.add(post)
                reel_sentiment_created += 1

        print(f"  ✓ Created {reel_sentiment_created} reel sentiment records")

        # Create trend report
        trend_data = {
            "analysis": {
                "insights": [
                    f"Top {random.choice(CATEGORIES)} products getting 40% higher engagement",
                    "Reels with behind-the-scenes content get 2x engagement",
                    "Price positioning in premium range attracts qualified audience",
                    "Competitor bundles are driving 35% conversion lift",
                ],
                "competitors": [comp.name for comp in competitors],
            },
            "trends": {
                "top_category": random.choice(CATEGORIES),
                "sentiment_distribution": {
                    "positive": random.randint(40, 60),
                    "neutral": random.randint(15, 35),
                    "negative": random.randint(5, 15),
                },
                "reels_sentiment": {
                    "average_engagement_rate": round(random.uniform(2.5, 8.5), 2),
                    "trending_styles": ["bridal", "festive", "everyday"],
                },
            },
            "timestamp": now.isoformat(),
        }

        trend_report = TrendReport(
            org_id=org_id,
            generated_at=now,
            report_data=trend_data,
        )
        session.add(trend_report)
        print(f"  ✓ Created trend report")

        # Create stock context entries
        stock_created = 0
        for sku_num in range(20):
            stock_entry = StockContextEntry(
                org_id=org_id,
                sku=f"SKU{random.randint(10000, 99999)}",
                product_name=f"{random.choice(CATEGORIES).replace('_', ' ').title()} Variant {sku_num}",
                category=random.choice(CATEGORIES),
                current_stock=random.randint(5, 150),
                note=f"Demo stock entry - replenish if below 20 units",
                created_at=utc_now(),
                updated_at=utc_now(),
            )
            session.add(stock_entry)
            stock_created += 1

        print(f"  ✓ Created {stock_created} stock context entries")

        await session.commit()


async def main():
    parser = argparse.ArgumentParser(
        description="Seed analytics service with demo data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--org-ids",
        nargs="+",
        help="Specific org IDs to seed",
    )
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Generate random org IDs",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=1,
        help="Number of random org IDs to generate (with --auto)",
    )
    parser.add_argument(
        "--list-orgs",
        action="store_true",
        help="List existing organizations in database",
    )
    parser.add_argument(
        "--from-backend",
        action="store_true",
        help="Fetch organization IDs from backend API",
    )
    parser.add_argument(
        "--backend-url",
        default="http://localhost:4002",
        help="Backend API URL (default: http://localhost:4002)",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset existing data before seeding",
    )

    args = parser.parse_args()

    await ensure_tables()

    org_ids = []

    # Handle --list-orgs first (just show and exit)
    if args.list_orgs:
        print("📋 Existing organizations in database:")
        orgs = await list_existing_orgs()
        if orgs:
            for org_id in orgs:
                print(f"  • {org_id}")
        else:
            print("  (none)")
        return

    # Handle --from-backend
    if args.from_backend:
        print(f"🔄 Fetching org IDs from backend ({args.backend_url})...")
        org_ids = await fetch_orgs_from_backend(args.backend_url)
        if org_ids:
            print(f"  ✓ Found {len(org_ids)} organization(s)")
        else:
            print("  ✗ No organizations found")
            return

    # Handle --auto
    elif args.auto:
        print(f"🔄 Generating {args.count} random org ID(s)...")
        org_ids = generate_org_ids(args.count)
        for org_id in org_ids:
            print(f"  • {org_id}")

    # Handle --org-ids
    elif args.org_ids:
        org_ids = args.org_ids

    # Default: use DEFAULT_ORG_IDS
    else:
        org_ids = DEFAULT_ORG_IDS
        print(f"ℹ️  Using default org IDs:")
        for org_id in org_ids:
            print(f"  • {org_id}")

    # Seed each org
    print(f"\n🌱 Seeding {len(org_ids)} organization(s)...")
    for org_id in org_ids:
        if args.reset:
            await reset_org_data(org_id)
        await seed_org(org_id)

    print(f"\n✅ Seeding complete for {len(org_ids)} org(s)")


if __name__ == "__main__":
    asyncio.run(main())
