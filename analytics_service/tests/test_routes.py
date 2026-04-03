import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import get_db, Base
from app.models import models


DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
async def async_test_db():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Provide a dependency override
    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        yield async_session
    finally:
        app.dependency_overrides.pop(get_db, None)
        await engine.dispose()


@pytest.fixture
async def seeded_db(async_test_db):
    async_session = async_test_db
    async with async_session() as session:
        # Seed a competitor
        comp = models.Competitor(org_id="org-1", name="TestComp", url="https://test.example")
        session.add(comp)
        await session.flush()

        # Add products
        p1 = models.Product(competitor_id=comp.id, name="P1", category="CatA", url="/p1", image_url="",
                            )
        p2 = models.Product(competitor_id=comp.id, name="P2", category="CatB", url="/p2", image_url="",
                            )
        session.add_all([p1, p2])
        await session.flush()

        # Price history
        from datetime import datetime, timedelta

        ph1 = models.ProductPriceHistory(product_id=p1.id, price=10.0, recorded_at=datetime.utcnow())
        ph2 = models.ProductPriceHistory(product_id=p2.id, price=20.0, recorded_at=datetime.utcnow())
        session.add_all([ph1, ph2])

        # Sentiment posts
        sp1 = models.SocialPostSentiment(competitor_id=comp.id, post_url="https://test.example/post/1",
                                         content_text="Great!", sentiment_score=0.9, sentiment_label="Positive")
        sp2 = models.SocialPostSentiment(competitor_id=comp.id, post_url="https://test.example/post/2",
                                         content_text="Bad fit", sentiment_score=0.1, sentiment_label="Negative")
        session.add_all([sp1, sp2])

        # Trend report
        tr = models.TrendReport(org_id="org-1", report_data={"ai_executive_summary": "Insights here"})
        session.add(tr)

        await session.commit()

    yield


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/health")
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"


@pytest.mark.asyncio
async def test_get_competitors_summary(seeded_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/v1/dashboard/competitors", params={"org_id": "org-1"})
        assert r.status_code == 200
        payload = r.json()
        assert payload["status"] == "success"
        data = payload["data"]
        assert isinstance(data, list) and len(data) >= 1
        comp = data[0]
        assert comp["name"] == "TestComp"
        assert "product_count" in comp and comp["product_count"] >= 0


@pytest.mark.asyncio
async def test_get_products_paginated(seeded_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/v1/dashboard/products", params={"org_id": "org-1", "page": 1, "limit": 1})
        assert r.status_code == 200
        payload = r.json()
        assert payload["status"] == "success"
        assert isinstance(payload["data"], list)
        assert payload["pagination"]["pages"] >= 1


@pytest.mark.asyncio
async def test_pricing_trends(seeded_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/v1/dashboard/pricing-trends", params={"org_id": "org-1", "days": 7})
        assert r.status_code == 200
        payload = r.json()
        assert payload["status"] == "success"
        assert isinstance(payload["data"], list)


@pytest.mark.asyncio
async def test_sentiment_breakdown(seeded_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/v1/dashboard/sentiment", params={"org_id": "org-1"})
        assert r.status_code == 200
        payload = r.json()
        assert payload["status"] == "success"
        assert payload["total"] >= 0
        assert "percentages" in payload


@pytest.mark.asyncio
async def test_get_top_insights(seeded_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/v1/dashboard/insights", params={"org_id": "org-1", "limit": 5})
        assert r.status_code == 200
        payload = r.json()
        assert payload["status"] == "success"
        assert isinstance(payload["data"], list)
