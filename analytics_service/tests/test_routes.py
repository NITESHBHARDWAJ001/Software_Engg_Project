import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete, select
from datetime import datetime, UTC

from main import app
from app.db.database import get_db, Base
from app.models import models
from app.api import routes


DATABASE_URL = "sqlite+aiosqlite:///:memory:"

AI_SUCCESS_CASES = [
    (
        "/api/v1/ai/stylist",
        "generate_personalized_outfit_recommendations",
        {
            "user_profile": {"style": "festive"},
            "occasion": "wedding",
            "budget": 5000,
            "preferences": ["silk"],
        },
        {"success": True, "recommendations": [{"look": "Classic silk set"}]},
        "recommendations",
    ),
    (
        "/api/v1/ai/size-fit",
        "predict_size_and_fit",
        {
            "measurements": {"chest": 38},
            "garment_type": "kurta",
            "gender": "male",
            "fit_preference": "relaxed",
        },
        {"success": True, "result": {"recommended_size": "L"}},
        "recommended_size",
    ),
    (
        "/api/v1/ai/trend-forecast",
        "forecast_fashion_trends",
        {
            "season": "festive",
            "region": "north",
            "product_category": "saree",
            "target_gender": "female",
            "price_segment": "premium",
        },
        {"success": True, "result": {"trend_direction": "up"}},
        "trend_direction",
    ),
    (
        "/api/v1/ai/design-copilot",
        "generate_design_copilot_concepts",
        {
            "collection_name": "Festive Bloom",
            "season": "summer",
            "region": "west",
            "target_gender": "female",
            "product_category": "lehenga",
        },
        {"success": True, "result": {"concepts": ["Mirrorwork revival"]}},
        "concepts",
    ),
    (
        "/api/v1/ai/dynamic-pricing",
        "generate_dynamic_pricing_recommendation",
        {
            "product_name": "Silk Saree",
            "category": "saree",
            "current_price": 3500,
            "cost_price": 1800,
            "stock_units": 10,
            "demand_signal": "high",
            "season": "festive",
        },
        {"success": True, "result": {"recommended_price": 3799}},
        "recommended_price",
    ),
    (
        "/api/v1/ai/discovery-feed",
        "generate_personalized_discovery_feed",
        {
            "customer_name": "Asha",
            "location": "Jaipur",
        },
        {"success": True, "result": {"feed_modules": ["Festive edits"]}},
        "feed_modules",
    ),
    (
        "/api/v1/ai/product-content",
        "generate_product_content_bundle",
        {
            "product_name": "Silk Kurta",
            "category": "kurta",
            "fabric": "silk",
            "color": "blue",
            "target_audience": "women",
            "tone": "premium",
        },
        {"success": True, "result": {"title": "Premium Silk Kurta"}},
        "title",
    ),
    (
        "/api/v1/ai/support-assistant",
        "generate_support_assistant_response",
        {
            "customer_question": "When will this ship?",
        },
        {"success": True, "result": {"response": "Ships in 3 days"}},
        "response",
    ),
    (
        "/api/v1/ai/visual-search",
        "generate_visual_search_matches",
        {
            "image_description": "red bridal lehenga",
            "target_category": "lehenga",
        },
        {"success": True, "result": {"matches": ["Bridal Red Edit"]}},
        "matches",
    ),
    (
        "/api/v1/ai/inventory-replenishment",
        "generate_inventory_replenishment_plan",
        {
            "sku": "SKU-1",
            "product_name": "Kurta",
            "category": "kurta",
            "current_stock": 5,
            "avg_weekly_sales": 8,
            "lead_time_days": 10,
            "season": "festive",
            "region": "north",
        },
        {"success": True, "result": {"reorder_units": 40}},
        "reorder_units",
    ),
]


class AppAsyncClient(AsyncClient):
    def __init__(self, *args, **kwargs):
        app_instance = kwargs.pop("app", None)
        if app_instance is not None and "transport" not in kwargs:
            kwargs["transport"] = ASGITransport(app=app_instance)
        super().__init__(*args, **kwargs)


AsyncClient = AppAsyncClient


def utc_now() -> datetime:
    return datetime.now(UTC)


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="module")
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


@pytest_asyncio.fixture
async def seeded_db(async_test_db):
    async_session = async_test_db
    async with async_session() as session:
        await session.execute(delete(models.ProductPriceHistory))
        await session.execute(delete(models.SocialPostSentiment))
        await session.execute(delete(models.Product))
        await session.execute(delete(models.Competitor))
        await session.execute(delete(models.TrendReport))
        await session.execute(delete(models.StockContextEntry))
        await session.execute(delete(models.Organization))
        await session.commit()

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
        ph1 = models.ProductPriceHistory(product_id=p1.id, price=10.0, recorded_at=utc_now())
        ph2 = models.ProductPriceHistory(product_id=p2.id, price=20.0, recorded_at=utc_now())
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
async def test_root():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/v1/")
        assert r.status_code == 200
        assert r.json() == {"message": "Analytics Service API"}


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
async def test_get_competitor_details(seeded_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        summary = await ac.get("/api/v1/dashboard/competitors", params={"org_id": "org-1"})
        competitor_id = summary.json()["data"][0]["id"]

        r = await ac.get(f"/api/v1/dashboard/competitors/{competitor_id}", params={"org_id": "org-1"})

    assert r.status_code == 200
    payload = r.json()
    assert payload["status"] == "success"
    assert payload["data"]["name"] == "TestComp"
    assert payload["data"]["total_products"] == 2
    assert payload["data"]["products"][0]["currency"] == "USD"


@pytest.mark.asyncio
async def test_get_competitor_details_not_found(seeded_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/v1/dashboard/competitors/9999", params={"org_id": "org-1"})

    assert r.status_code == 200
    assert r.json() == {"status": "error", "message": "Competitor not found"}


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


@pytest.mark.asyncio
async def test_analyze_sentiment_passes_org_id(async_test_db, monkeypatch):
    captured = {}

    async def fake_scrape(url, org_id, db):
        captured["url"] = url
        captured["org_id"] = org_id
        return {"status": "success", "sentiment": {"label": "Positive", "score": 0.7}}

    monkeypatch.setattr(routes.scraper, "scrape_competitor_data", fake_scrape)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post(
            "/api/v1/analyze-sentiment",
            params={"url": "https://www.instagram.com/p/test-post/", "org_id": "org-99"},
        )

    assert r.status_code == 200
    payload = r.json()
    assert payload["message"] == "Sentiment analysis executed"
    assert captured == {
        "url": "https://www.instagram.com/p/test-post/",
        "org_id": "org-99",
    }


@pytest.mark.asyncio
async def test_analyze_reel_sentiment_uses_page_sentiment_fallback(async_test_db, monkeypatch):
    async def fake_scrape(url, org_id, db):
        return {
            "status": "success",
            "sentiment": {"label": "Positive", "score": 0.4215},
            "type": "social_post",
        }

    monkeypatch.setattr(routes.scraper, "scrape_competitor_data", fake_scrape)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post(
            "/api/v1/analyze-reel-sentiment",
            json={
                "org_id": "org-fallback",
                "reel_url": "https://www.instagram.com/reel/fallback/",
                "comments": [],
            },
        )

    assert r.status_code == 200
    payload = r.json()
    data = payload["data"]
    assert payload["status"] == "success"
    assert data["comments_analyzed"] == 0
    assert data["page_sentiment"] == {"label": "Positive", "score": 0.4215}
    assert data["sentiment_counts"] == {"Positive": 1, "Negative": 0, "Neutral": 0}
    assert data["sentiment_percentages"]["positive"] == 100.0


@pytest.mark.asyncio
async def test_analyze_reel_sentiment_counts_comment_labels(async_test_db, monkeypatch):
    async def fake_scrape(url, org_id, db):
        return {
            "status": "success",
            "sentiment": {"label": "Neutral", "score": 0.0},
            "type": "social_post",
        }

    monkeypatch.setattr(routes.scraper, "scrape_competitor_data", fake_scrape)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post(
            "/api/v1/analyze-reel-sentiment",
            json={
                "org_id": "org-comments",
                "reel_url": "https://www.instagram.com/reel/comments/",
                "comments": [
                    "I love this look",
                    "This is terrible quality",
                    "It is okay overall",
                ],
            },
        )

    assert r.status_code == 200
    payload = r.json()
    data = payload["data"]
    assert data["comments_analyzed"] == 3
    assert data["sentiment_counts"] == {"Positive": 2, "Negative": 1, "Neutral": 0}
    assert len(data["comment_details"]) == 3

    async_session = async_test_db
    async with async_session() as session:
        comp_result = await session.execute(
            select(models.Competitor).where(models.Competitor.org_id == "org-comments")
        )
        competitor = comp_result.scalar_one()

        sentiments_result = await session.execute(
            select(models.SocialPostSentiment).where(models.SocialPostSentiment.competitor_id == competitor.id)
        )
        stored = sentiments_result.scalars().all()

    assert len(stored) == 3


@pytest.mark.asyncio
async def test_trigger_scrape(async_test_db, monkeypatch):
    captured = {}

    async def fake_scrape(url, org_id, db):
        captured["url"] = url
        captured["org_id"] = org_id
        return {"status": "success", "items": 4}

    monkeypatch.setattr(routes.scraper, "scrape_competitor_data", fake_scrape)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post("/api/v1/scrape", params={"url": "https://shop.example", "org_id": "org-7"})

    assert r.status_code == 200
    assert r.json()["data"] == {"status": "success", "items": 4}
    assert captured == {"url": "https://shop.example", "org_id": "org-7"}


@pytest.mark.asyncio
async def test_trigger_analysis(monkeypatch):
    async def fake_analyze(db, org_id):
        return {"winner": "TestComp", "org_id": org_id}

    monkeypatch.setattr(routes.competitor_analysis, "analyze_competitors", fake_analyze)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post("/api/v1/analyze", params={"org_id": "org-1"})

    assert r.status_code == 200
    assert r.json()["data"] == {"winner": "TestComp", "org_id": "org-1"}


@pytest.mark.asyncio
async def test_get_trends(monkeypatch):
    async def fake_trends(db, org_id):
        return {"top_category": "saree", "org_id": org_id}

    monkeypatch.setattr(routes.trend_detection, "detect_trends", fake_trends)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/v1/trends", params={"org_id": "org-1"})

    assert r.status_code == 200
    assert r.json()["data"] == {"top_category": "saree", "org_id": "org-1"}


@pytest.mark.asyncio
async def test_create_report(monkeypatch):
    async def fake_trends(db, org_id):
        return {"trend": "festive"}

    async def fake_analysis(db, org_id):
        return {"analysis": "priced high"}

    async def fake_report(db, analysis, trends, org_id):
        return {"org_id": org_id, "analysis": analysis, "trends": trends}

    monkeypatch.setattr(routes.trend_detection, "detect_trends", fake_trends)
    monkeypatch.setattr(routes.competitor_analysis, "analyze_competitors", fake_analysis)
    monkeypatch.setattr(routes.report_generator, "generate_report", fake_report)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post("/api/v1/report", params={"org_id": "org-rpt"})

    assert r.status_code == 200
    assert r.json()["data"]["org_id"] == "org-rpt"
    assert r.json()["data"]["trends"] == {"trend": "festive"}


@pytest.mark.asyncio
async def test_generate_ad_copy(seeded_db, monkeypatch):
    async def fake_ad_copy(posts):
        return "Counter-message"

    monkeypatch.setattr(routes, "generate_defensive_copy", fake_ad_copy)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post("/api/v1/generate-ad-copy", params={"competitor_domain": "test.example"})

    assert r.status_code == 200
    payload = r.json()
    assert payload["competitor_targeted"] == "test.example"
    assert payload["negative_weaknesses_analyzed"] == 1
    assert payload["ai_ad_copy"] == "Counter-message"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "path,attr_name,request_payload,mock_payload,expected_key",
    AI_SUCCESS_CASES,
)
async def test_ai_endpoints_success(monkeypatch, path, attr_name, request_payload, mock_payload, expected_key):
    async def fake_impl(**kwargs):
        return mock_payload

    monkeypatch.setattr(routes, attr_name, fake_impl)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post(path, json=request_payload)

    assert r.status_code == 200
    payload = r.json()
    assert payload["status"] == "success"
    assert expected_key in payload["data"]


@pytest.mark.asyncio
@pytest.mark.parametrize("path,attr_name,request_payload,_,__", AI_SUCCESS_CASES)
async def test_ai_endpoints_failure(monkeypatch, path, attr_name, request_payload, _, __):
    async def fake_impl(**kwargs):
        return {"success": False, "error": "boom"}

    monkeypatch.setattr(routes, attr_name, fake_impl)

    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post(path, json=request_payload)

    assert r.status_code == 500
    assert r.json()["detail"] == "boom"


@pytest.mark.asyncio
async def test_ai_validation_errors():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        stylist = await ac.post(
            "/api/v1/ai/stylist",
            json={"user_profile": {}, "occasion": "w", "budget": 0},
        )
        size_fit = await ac.post(
            "/api/v1/ai/size-fit",
            json={
                "measurements": {},
                "garment_type": "kurta",
                "gender": "other",
                "fit_preference": "relaxed",
            },
        )
        inventory = await ac.post(
            "/api/v1/ai/inventory-replenishment",
            json={
                "sku": "SKU-1",
                "product_name": "Kurta",
                "category": "kurta",
                "current_stock": 5,
                "avg_weekly_sales": 8,
                "lead_time_days": 10,
                "season": "festive",
                "region": "north",
                "service_level": "urgent",
            },
        )

    assert stylist.status_code == 422
    assert size_fit.status_code == 422
    assert inventory.status_code == 422


@pytest.mark.asyncio
async def test_upsert_and_delete_organization(async_test_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        create_resp = await ac.post(
            "/api/v1/orgs/upsert",
            json={"org_id": "org-admin", "name": "Org Admin", "email": "admin@example.com"},
        )
        update_resp = await ac.post(
            "/api/v1/orgs/upsert",
            json={"org_id": "org-admin", "name": "Org Admin 2", "phone": "12345"},
        )
        delete_resp = await ac.delete("/api/v1/orgs/org-admin")

    assert create_resp.status_code == 200
    assert create_resp.json()["data"]["name"] == "Org Admin"
    assert update_resp.json()["data"]["name"] == "Org Admin 2"
    assert update_resp.json()["data"]["phone"] == "12345"
    assert delete_resp.json() == {"status": "success", "deleted": True}


@pytest.mark.asyncio
async def test_delete_organization_missing(async_test_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.delete("/api/v1/orgs/missing-org")

    assert r.status_code == 200
    assert r.json() == {"status": "success", "deleted": False}


@pytest.mark.asyncio
async def test_stock_context_ingest_and_manual_check(async_test_db):
    payload = {
        "org_id": "org-stock",
        "source_mode": "manual",
        "items": [
            {"sku": "SKU-1", "name": "Blue Kurta", "category": "kurta", "current_stock": 8},
            {"sku": "SKU-2", "name": "Red Saree", "category": "saree", "current_stock": 3, "note": "low stock"},
        ],
    }

    async with AsyncClient(app=app, base_url="http://test") as ac:
        ingest = await ac.post("/api/v1/stock-context/ingest", json=payload)
        manual = await ac.get("/api/v1/stock-context/manual-check", params={"org_id": "org-stock"})

    assert ingest.status_code == 200
    assert ingest.json()["data"] == {
        "org_id": "org-stock",
        "source_mode": "MANUAL",
        "inserted": 2,
    }
    assert manual.status_code == 200
    rows = manual.json()["data"]
    assert len(rows) == 2
    assert {row["sku"] for row in rows} == {"SKU-1", "SKU-2"}


@pytest.mark.asyncio
async def test_seed_sample_data(async_test_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post(
            "/api/v1/seed/sample-data",
            json={"org_id": "org-seed", "seed_tag": "unit"},
        )

    assert r.status_code == 200
    payload = r.json()
    assert payload["status"] == "success"
    assert payload["data"] == {
        "org_id": "org-seed",
        "seed_tag": "unit",
        "competitors_created": 2,
        "products_created": 4,
        "sentiments_created": 4,
    }

    async_session = async_test_db
    async with async_session() as session:
        org = (
            await session.execute(select(models.Organization).where(models.Organization.org_id == "org-seed"))
        ).scalar_one()
        competitors = (
            await session.execute(select(models.Competitor).where(models.Competitor.org_id == "org-seed"))
        ).scalars().all()

    assert org.name == "Seed Org unit"
    assert len(competitors) == 2
