from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from app.db.database import get_db
from app.services import scraper, competitor_analysis, trend_detection, report_generator
from app.services.ai_generative import generate_defensive_copy
from app.services.fashion_ai import (
    generate_personalized_outfit_recommendations,
    predict_size_and_fit,
    forecast_fashion_trends,
    generate_design_copilot_concepts,
    generate_dynamic_pricing_recommendation,
    generate_personalized_discovery_feed,
    generate_product_content_bundle,
    generate_support_assistant_response,
    generate_visual_search_matches,
    generate_inventory_replenishment_plan,
)
from app.models.models import SocialPostSentiment, Competitor, Product, ProductPriceHistory, TrendReport

router = APIRouter()


class StylistRequest(BaseModel):
    user_profile: Dict[str, Any]
    occasion: str = Field(..., min_length=2)
    budget: float = Field(..., gt=0)
    preferences: Optional[List[str]] = None

class SizeFitRequest(BaseModel):
    measurements: Dict[str, Any]
    garment_type: str = Field(..., min_length=2)
    gender: str = Field(..., pattern="^(male|female)$")
    fit_preference: str = Field(..., pattern="^(fitted|relaxed|loose)$")
    brand_region: Optional[str] = None


class TrendForecastRequest(BaseModel):
    season: str = Field(..., min_length=2)
    region: str = Field(..., min_length=2)
    product_category: str = Field(..., min_length=2)
    target_gender: str = Field(..., pattern="^(male|female|unisex)$")
    price_segment: str = Field(..., min_length=2)


class DesignCopilotRequest(BaseModel):
    collection_name: str = Field(..., min_length=2)
    season: str = Field(..., min_length=2)
    region: str = Field(..., min_length=2)
    target_gender: str = Field(..., pattern="^(male|female|unisex)$")
    product_category: str = Field(..., min_length=2)
    inspiration_keywords: Optional[List[str]] = None


class DynamicPricingRequest(BaseModel):
    product_name: str = Field(..., min_length=2)
    category: str = Field(..., min_length=2)
    current_price: float = Field(..., gt=0)
    cost_price: float = Field(..., gt=0)
    stock_units: int = Field(..., ge=0)
    demand_signal: str = Field(..., min_length=2)
    season: str = Field(..., min_length=2)
    competitor_prices: Optional[List[float]] = None


class DiscoveryFeedRequest(BaseModel):
    customer_name: str = Field(..., min_length=2)
    location: str = Field(..., min_length=2)
    browsing_history: Optional[List[str]] = None
    purchase_history: Optional[List[str]] = None
    upcoming_occasions: Optional[List[str]] = None
    preferred_categories: Optional[List[str]] = None


class ProductContentRequest(BaseModel):
    product_name: str = Field(..., min_length=2)
    category: str = Field(..., min_length=2)
    fabric: str = Field(..., min_length=2)
    color: str = Field(..., min_length=2)
    embellishments: Optional[List[str]] = None
    target_audience: str = Field(..., min_length=2)
    tone: str = Field(..., min_length=2)
    languages: Optional[List[str]] = None


class SupportAssistantRequest(BaseModel):
    customer_question: str = Field(..., min_length=3)
    product_context: Optional[Dict[str, Any]] = None
    size_context: Optional[Dict[str, Any]] = None
    shipping_policy: Optional[str] = None
    return_policy: Optional[str] = None


class VisualSearchRequest(BaseModel):
    image_description: Optional[str] = None
    image_url: Optional[str] = None
    target_category: Optional[str] = None
    occasion: Optional[str] = None
    budget: Optional[float] = Field(default=None, gt=0)
    region: Optional[str] = None
    style_preferences: Optional[List[str]] = None


class InventoryReplenishmentRequest(BaseModel):
    sku: str = Field(..., min_length=2)
    product_name: str = Field(..., min_length=2)
    category: str = Field(..., min_length=2)
    current_stock: int = Field(..., ge=0)
    avg_weekly_sales: float = Field(..., ge=0)
    lead_time_days: int = Field(..., ge=0)
    season: str = Field(..., min_length=2)
    region: str = Field(..., min_length=2)
    current_open_po_units: int = Field(default=0, ge=0)
    service_level: str = Field(default="medium", pattern="^(low|medium|high)$")
from app.models.models import SocialPostSentiment, Competitor, Product, ProductPriceHistory, TrendReport, Organization, StockContextEntry

router = APIRouter()

class OrganizationUpsert(BaseModel):
    org_id: str
    name: str | None = None
    slug: str | None = None
    email: str | None = None
    phone: str | None = None

class StockContextItem(BaseModel):
    sku: str
    name: str
    category: str | None = None
    current_stock: int = 0
    note: str | None = None

class StockContextIngest(BaseModel):
    org_id: str
    source_mode: str = "AUTO"
    items: list[StockContextItem]

class SeedSampleDataIn(BaseModel):
    org_id: str
    seed_tag: str | None = None

@router.get("/")
def read_root():
    return {"message": "Analytics Service API"}


@router.post("/ai/stylist")
async def ai_personal_stylist(payload: StylistRequest):
    result = await generate_personalized_outfit_recommendations(
        user_profile=payload.user_profile,
        occasion=payload.occasion,
        budget=payload.budget,
        preferences=payload.preferences,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Stylist generation failed"))

    return {"status": "success", "data": {"recommendations": result.get("recommendations", [])}}

@router.post("/ai/size-fit")
async def ai_size_fit_predictor(payload: SizeFitRequest):
    result = await predict_size_and_fit(
        measurements=payload.measurements,
        garment_type=payload.garment_type,
        gender=payload.gender,
        fit_preference=payload.fit_preference,
        brand_region=payload.brand_region,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Size prediction failed"))
    return {"status": "success", "data": result.get("result", {})}


@router.post("/ai/trend-forecast")
async def ai_trend_forecast(payload: TrendForecastRequest):
    result = await forecast_fashion_trends(
        season=payload.season,
        region=payload.region,
        product_category=payload.product_category,
        target_gender=payload.target_gender,
        price_segment=payload.price_segment,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Trend forecast failed"))
    return {"status": "success", "data": result.get("result", {})}


@router.post("/ai/design-copilot")
async def ai_design_copilot(payload: DesignCopilotRequest):
    result = await generate_design_copilot_concepts(
        collection_name=payload.collection_name,
        season=payload.season,
        region=payload.region,
        target_gender=payload.target_gender,
        product_category=payload.product_category,
        inspiration_keywords=payload.inspiration_keywords,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Design concept generation failed"))
    return {"status": "success", "data": result.get("result", {})}


@router.post("/ai/dynamic-pricing")
async def ai_dynamic_pricing(payload: DynamicPricingRequest):
    result = await generate_dynamic_pricing_recommendation(
        product_name=payload.product_name,
        category=payload.category,
        current_price=payload.current_price,
        cost_price=payload.cost_price,
        stock_units=payload.stock_units,
        demand_signal=payload.demand_signal,
        season=payload.season,
        competitor_prices=payload.competitor_prices,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Dynamic pricing failed"))
    return {"status": "success", "data": result.get("result", {})}


@router.post("/ai/discovery-feed")
async def ai_discovery_feed(payload: DiscoveryFeedRequest):
    result = await generate_personalized_discovery_feed(
        customer_name=payload.customer_name,
        location=payload.location,
        browsing_history=payload.browsing_history,
        purchase_history=payload.purchase_history,
        upcoming_occasions=payload.upcoming_occasions,
        preferred_categories=payload.preferred_categories,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Discovery feed generation failed"))
    return {"status": "success", "data": result.get("result", {})}


@router.post("/ai/product-content")
async def ai_product_content(payload: ProductContentRequest):
    result = await generate_product_content_bundle(
        product_name=payload.product_name,
        category=payload.category,
        fabric=payload.fabric,
        color=payload.color,
        embellishments=payload.embellishments,
        target_audience=payload.target_audience,
        tone=payload.tone,
        languages=payload.languages,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Product content generation failed"))
    return {"status": "success", "data": result.get("result", {})}


@router.post("/ai/support-assistant")
async def ai_support_assistant(payload: SupportAssistantRequest):
    result = await generate_support_assistant_response(
        customer_question=payload.customer_question,
        product_context=payload.product_context,
        size_context=payload.size_context,
        shipping_policy=payload.shipping_policy,
        return_policy=payload.return_policy,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Support assistant response failed"))
    return {"status": "success", "data": result.get("result", {})}


@router.post("/ai/visual-search")
async def ai_visual_search(payload: VisualSearchRequest):
    result = await generate_visual_search_matches(
        image_description=payload.image_description,
        image_url=payload.image_url,
        target_category=payload.target_category,
        occasion=payload.occasion,
        budget=payload.budget,
        region=payload.region,
        style_preferences=payload.style_preferences,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Visual search failed"))
    return {"status": "success", "data": result.get("result", {})}


@router.post("/ai/inventory-replenishment")
async def ai_inventory_replenishment(payload: InventoryReplenishmentRequest):
    result = await generate_inventory_replenishment_plan(
        sku=payload.sku,
        product_name=payload.product_name,
        category=payload.category,
        current_stock=payload.current_stock,
        avg_weekly_sales=payload.avg_weekly_sales,
        lead_time_days=payload.lead_time_days,
        season=payload.season,
        region=payload.region,
        current_open_po_units=payload.current_open_po_units,
        service_level=payload.service_level,
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Inventory replenishment prediction failed"))
    return {"status": "success", "data": result.get("result", {})}
@router.post("/orgs/upsert")
async def upsert_organization(payload: OrganizationUpsert, db: AsyncSession = Depends(get_db)):
    stmt = select(Organization).where(Organization.org_id == payload.org_id)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()

    if org:
        if payload.name is not None:
            org.name = payload.name
        if payload.slug is not None:
            org.slug = payload.slug
        if payload.email is not None:
            org.email = payload.email
        if payload.phone is not None:
            org.phone = payload.phone
    else:
        org = Organization(
            org_id=payload.org_id,
            name=payload.name,
            slug=payload.slug,
            email=payload.email,
            phone=payload.phone,
        )
        db.add(org)

    await db.commit()
    await db.refresh(org)

    return {
        "status": "success",
        "data": {
            "org_id": org.org_id,
            "name": org.name,
            "slug": org.slug,
            "email": org.email,
            "phone": org.phone,
        },
    }

@router.delete("/orgs/{org_id}")
async def delete_organization(org_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Organization).where(Organization.org_id == org_id)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()
    if not org:
        return {"status": "success", "deleted": False}

    await db.delete(org)
    await db.commit()
    return {"status": "success", "deleted": True}

@router.post("/stock-context/ingest")
async def ingest_stock_context(payload: StockContextIngest, db: AsyncSession = Depends(get_db)):
    inserted = 0
    for item in payload.items:
        entry = StockContextEntry(
            org_id=payload.org_id,
            source_mode=payload.source_mode.upper(),
            sku=item.sku,
            name=item.name,
            category=item.category,
            current_stock=item.current_stock,
            note=item.note,
        )
        db.add(entry)
        inserted += 1

    await db.commit()

    return {
        "status": "success",
        "data": {
            "org_id": payload.org_id,
            "source_mode": payload.source_mode.upper(),
            "inserted": inserted,
        },
    }

@router.get("/stock-context/manual-check")
async def get_stock_context_manual_check(org_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(StockContextEntry)
        .where(StockContextEntry.org_id == org_id)
        .order_by(desc(StockContextEntry.captured_at))
        .limit(50)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return {
        "status": "success",
        "data": [
            {
                "id": row.id,
                "org_id": row.org_id,
                "source_mode": row.source_mode,
                "sku": row.sku,
                "name": row.name,
                "category": row.category,
                "current_stock": row.current_stock,
                "note": row.note,
                "captured_at": row.captured_at.isoformat() if row.captured_at else None,
            }
            for row in rows
        ],
    }

@router.post("/seed/sample-data")
async def seed_sample_data(payload: SeedSampleDataIn, db: AsyncSession = Depends(get_db)):
    seed_tag = payload.seed_tag or str(int(datetime.utcnow().timestamp()))

    org_stmt = select(Organization).where(Organization.org_id == payload.org_id)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()
    if not org:
        org = Organization(org_id=payload.org_id, name=f"Seed Org {seed_tag}")
        db.add(org)
        await db.flush()

    competitor_specs = [
        {
            "name": f"seed-fashion-a-{seed_tag}",
            "url": f"seed-fashion-a-{seed_tag}.local",
            "products": [
                {"name": "Seed Kurta Premium", "category": "kurtas", "price": 99.0},
                {"name": "Seed Saree Silk", "category": "sarees", "price": 149.5},
            ],
        },
        {
            "name": f"seed-fashion-b-{seed_tag}",
            "url": f"seed-fashion-b-{seed_tag}.local",
            "products": [
                {"name": "Seed Kurta Classic", "category": "kurtas", "price": 79.0},
                {"name": "Seed Jacket Heritage", "category": "jackets", "price": 119.0},
            ],
        },
    ]

    competitors_created = 0
    products_created = 0
    sentiments_created = 0

    for spec in competitor_specs:
        comp = Competitor(org_id=payload.org_id, name=spec["name"], url=spec["url"])
        db.add(comp)
        await db.flush()
        competitors_created += 1

        for idx, pd in enumerate(spec["products"]):
            product = Product(
                competitor_id=comp.id,
                name=pd["name"],
                category=pd["category"],
                url=f"https://{spec['url']}/products/{seed_tag}-{idx}",
                image_url=f"https://{spec['url']}/images/{seed_tag}-{idx}.jpg",
            )
            db.add(product)
            await db.flush()
            products_created += 1

            db.add(
                ProductPriceHistory(
                    product_id=product.id,
                    price=pd["price"],
                    currency="USD",
                    recorded_at=datetime.utcnow() - timedelta(days=3),
                )
            )
            db.add(
                ProductPriceHistory(
                    product_id=product.id,
                    price=round(pd["price"] * 1.05, 2),
                    currency="USD",
                    recorded_at=datetime.utcnow() - timedelta(days=1),
                )
            )

        for label, score, suffix in [("Negative", -0.72, "n"), ("Positive", 0.64, "p")]:
            db.add(
                SocialPostSentiment(
                    competitor_id=comp.id,
                    post_url=f"https://social.seed/{spec['url']}/{suffix}/{seed_tag}",
                    content_text=f"Seed {label.lower()} sentiment sample for {spec['name']}",
                    sentiment_score=score,
                    sentiment_label=label,
                    analyzed_at=datetime.utcnow(),
                )
            )
            sentiments_created += 1

    db.add(
        TrendReport(
            org_id=payload.org_id,
            generated_at=datetime.utcnow(),
            report_data={
                "summary": "Seeded analytics report",
                "ai_executive_summary": "Seeded report summary for dashboard validation.",
                "seed_tag": seed_tag,
            },
        )
    )

    await db.commit()

    return {
        "status": "success",
        "data": {
            "org_id": payload.org_id,
            "seed_tag": seed_tag,
            "competitors_created": competitors_created,
            "products_created": products_created,
            "sentiments_created": sentiments_created,
        },
    }

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

# ============ DASHBOARD ENDPOINTS ============

@router.get("/dashboard/competitors")
async def get_competitors_summary(org_id: str, db: AsyncSession = Depends(get_db)):
    """Get all competitors with product count and average pricing"""
    stmt = select(Competitor).filter(Competitor.org_id == org_id)
    result = await db.execute(stmt)
    competitors = result.scalars().all()
    
    summary = []
    for comp in competitors:
        product_count = await db.execute(
            select(func.count(Product.id)).filter(Product.competitor_id == comp.id)
        )
        count = product_count.scalar() or 0
        
        avg_price_stmt = (
            select(func.avg(ProductPriceHistory.price))
            .join(Product, ProductPriceHistory.product_id == Product.id)
            .filter(Product.competitor_id == comp.id)
        )
        avg_price_result = await db.execute(avg_price_stmt)
        avg_price = float(avg_price_result.scalar() or 0)

        last_scraped_stmt = (
            select(func.max(ProductPriceHistory.recorded_at))
            .join(Product, ProductPriceHistory.product_id == Product.id)
            .filter(Product.competitor_id == comp.id)
        )
        last_scraped_result = await db.execute(last_scraped_stmt)
        last_scraped = last_scraped_result.scalar()
        
        summary.append({
            "id": comp.id,
            "name": comp.name,
            "url": comp.url,
            "product_count": count,
            "avg_price": round(avg_price, 2),
            "last_scraped": last_scraped.isoformat() if last_scraped else None
        })
    
    return {"status": "success", "data": summary}

@router.get("/dashboard/competitors/{competitor_id}")
async def get_competitor_details(competitor_id: int, org_id: str, db: AsyncSession = Depends(get_db)):
    """Get detailed info about a specific competitor"""
    comp_stmt = select(Competitor).filter(
        Competitor.id == competitor_id,
        Competitor.org_id == org_id
    )
    comp_result = await db.execute(comp_stmt)
    competitor = comp_result.scalar()
    
    if not competitor:
        return {"status": "error", "message": "Competitor not found"}
    
    products_stmt = select(Product).filter(Product.competitor_id == competitor_id)
    products_result = await db.execute(products_stmt)
    products = products_result.scalars().all()
    
    return {
        "status": "success",
        "data": {
            "id": competitor.id,
            "name": competitor.name,
            "url": competitor.url,
            "total_products": len(products),
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "price": p.price,
                    "currency": p.currency,
                    "image_url": p.image_url
                }
                for p in products[:50]  # limit to 50
            ]
        }
    }

@router.get("/dashboard/pricing-trends")
async def get_pricing_trends(org_id: str, days: int = 30, db: AsyncSession = Depends(get_db)):
    """Get pricing trends over the last N days"""
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    stmt = select(ProductPriceHistory).options(
        selectinload(ProductPriceHistory.product).selectinload(Product.competitor)
    ).join(
        Product, ProductPriceHistory.product_id == Product.id
    ).join(
        Competitor, Product.competitor_id == Competitor.id
    ).filter(
        Competitor.org_id == org_id,
        ProductPriceHistory.recorded_at >= cutoff_date
    ).order_by(ProductPriceHistory.recorded_at)
    
    result = await db.execute(stmt)
    price_history = result.scalars().all()
    
    # Aggregate by date and competitor
    trends = {}
    for record in price_history:
        date_str = record.recorded_at.date().isoformat()
        if date_str not in trends:
            trends[date_str] = {"date": date_str, "competitors": {}}
        
        comp_name = record.product.competitor.name if record.product.competitor else "Unknown"
        if comp_name not in trends[date_str]["competitors"]:
            trends[date_str]["competitors"][comp_name] = []
        
        trends[date_str]["competitors"][comp_name].append(float(record.price))
    
    # Calculate averages per date per competitor
    data = []
    for date_str in sorted(trends.keys()):
        entry = {"date": date_str}
        for comp_name, prices in trends[date_str]["competitors"].items():
            entry[comp_name] = round(sum(prices) / len(prices), 2)
        data.append(entry)
    
    return {"status": "success", "data": data, "days": days}

@router.get("/dashboard/sentiment")
async def get_sentiment_breakdown(org_id: str, db: AsyncSession = Depends(get_db)):
    """Get sentiment analysis breakdown"""
    stmt = select(
        SocialPostSentiment.sentiment_label,
        func.count(SocialPostSentiment.id)
    ).join(
        Competitor, SocialPostSentiment.competitor_id == Competitor.id
    ).filter(
        Competitor.org_id == org_id
    ).group_by(SocialPostSentiment.sentiment_label)
    
    result = await db.execute(stmt)
    sentiments = result.all()
    
    data = {}
    total = 0
    for label, count in sentiments:
        data[label or "Unknown"] = count
        total += count
    
    return {
        "status": "success",
        "data": data,
        "total": total,
        "percentages": {k: round((v / total * 100), 2) if total > 0 else 0 for k, v in data.items()}
    }

@router.get("/dashboard/insights")
async def get_top_insights(org_id: str, limit: int = 5, db: AsyncSession = Depends(get_db)):
    """Get top AI insights from latest reports"""
    stmt = select(TrendReport).filter(
        TrendReport.org_id == org_id
    ).order_by(desc(TrendReport.generated_at)).limit(limit)
    
    result = await db.execute(stmt)
    reports = result.scalars().all()
    
    insights = []
    for report in reports:
        if hasattr(report, 'report_data') and isinstance(report.report_data, dict):
            if 'ai_executive_summary' in report.report_data:
                insights.append({
                    "generated_at": report.generated_at.isoformat(),
                    "summary": report.report_data['ai_executive_summary']
                })
    
    return {"status": "success", "data": insights}

@router.get("/dashboard/products")
async def get_products_paginated(org_id: str, page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Get products with pagination and filtering"""
    offset = (page - 1) * limit
    
    stmt = select(Product).options(
        selectinload(Product.competitor),
        selectinload(Product.price_history),
    ).join(
        Competitor, Product.competitor_id == Competitor.id
    ).filter(
        Competitor.org_id == org_id
    ).order_by(Product.id.desc()).offset(offset).limit(limit)
    
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    # Count total
    count_stmt = select(func.count(Product.id)).join(
        Competitor, Product.competitor_id == Competitor.id
    ).filter(Competitor.org_id == org_id)
    
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0
    
    data = []
    for p in products:
        latest_entry = None
        if p.price_history:
            latest_entry = max(p.price_history, key=lambda x: x.recorded_at)

        data.append(
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "price": float(latest_entry.price) if latest_entry else 0,
                "currency": latest_entry.currency if latest_entry else "USD",
                "image_url": p.image_url,
                "competitor": p.competitor.name if p.competitor else "Unknown",
            }
        )
    
    return {
        "status": "success",
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }
