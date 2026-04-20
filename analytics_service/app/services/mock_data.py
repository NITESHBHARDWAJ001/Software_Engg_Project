"""
Mock data fallback for analytics service.
When no real data exists for an org, these mocks are returned.
This enables the service to work without requiring prior seeding.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ============ COMPETITORS MOCK DATA ============

MOCK_COMPETITORS = [
    {
        "name": "RangMahal Couture",
        "url": "https://rangmahal.example.com",
        "products": 45,
        "avg_price": 5200.50,
    },
    {
        "name": "Noor Ethnics",
        "url": "https://noor.example.com",
        "products": 38,
        "avg_price": 4800.75,
    },
    {
        "name": "ThreadStory India",
        "url": "https://threadstory.example.com",
        "products": 52,
        "avg_price": 5950.00,
    },
]


def get_mock_competitors_summary() -> Dict[str, Any]:
    """Get mock competitors summary for dashboard."""
    now = utc_now()
    summary = []
    
    for comp in MOCK_COMPETITORS:
        summary.append({
            "id": hash(comp["name"]) % 1000000,  # Fake but consistent ID
            "name": comp["name"],
            "url": comp["url"],
            "product_count": comp["products"],
            "avg_price": comp["avg_price"],
            "last_scraped": (now - timedelta(hours=2)).isoformat(),
        })
    
    return {"status": "success", "data": summary}


def get_mock_competitor_details(competitor_name: str = None) -> Dict[str, Any]:
    """Get mock competitor details."""
    comp = MOCK_COMPETITORS[0]  # Default to first
    if competitor_name:
        for c in MOCK_COMPETITORS:
            if competitor_name.lower() in c["name"].lower():
                comp = c
                break
    
    products = [
        {
            "id": i,
            "name": f"{category.replace('_', ' ').title()} {i}",
            "category": category,
            "price": 2500 + (i * 150),
            "currency": "INR",
            "image_url": f"https://example.com/image/{i}.jpg",
        }
        for i, category in enumerate(
            ["lehenga", "saree", "kurta_set", "anarkali", "dupatta"] * 10
        )[:50]
    ]
    
    return {
        "status": "success",
        "data": {
            "id": hash(comp["name"]) % 1000000,
            "name": comp["name"],
            "url": comp["url"],
            "total_products": comp["products"],
            "products": products,
        },
    }


# ============ PRICING TRENDS MOCK DATA ============

def get_mock_pricing_trends(days: int = 30) -> Dict[str, Any]:
    """Get mock pricing trends over N days."""
    now = utc_now()
    categories = ["lehenga", "saree", "kurta_set", "anarkali", "dupatta"]
    trends = []
    
    for i in range(days):
        date = now - timedelta(days=days - i)
        for cat in categories:
            base_price = {
                "lehenga": 6500,
                "saree": 4200,
                "kurta_set": 2800,
                "anarkali": 4500,
                "dupatta": 1200,
            }.get(cat, 3000)
            
            # Add slight variation
            price = base_price + (i * 50) + (hash(cat + date.isoformat()) % 500)
            
            trends.append({
                "date": date.isoformat(),
                "category": cat,
                "avg_price": round(price, 2),
                "competitor_count": len(MOCK_COMPETITORS),
            })
    
    return {"status": "success", "data": trends}


# ============ SENTIMENT MOCK DATA ============

def get_mock_sentiment() -> Dict[str, Any]:
    """Get mock sentiment analysis."""
    now = utc_now()
    
    sentiment_data = []
    for i in range(10):
        posted_at = now - timedelta(days=i)
        sentiment_data.append({
            "post_url": f"https://instagram.com/p/{1000000000 + i}",
            "platform": "instagram",
            "sentiment_label": ["Positive", "Neutral", "Negative"][i % 3],
            "sentiment_score": 0.7 + (i * 0.02),
            "posted_at": posted_at.isoformat(),
        })
    
    return {
        "status": "success",
        "data": {
            "posts": sentiment_data,
            "summary": {
                "positive": 65,
                "neutral": 22,
                "negative": 13,
            },
        },
    }


# ============ INSIGHTS MOCK DATA ============

def get_mock_insights() -> Dict[str, Any]:
    """Get mock insights."""
    return {
        "status": "success",
        "data": {
            "insights": [
                "Top performing category: Lehenga with 40% higher engagement",
                "Reels with behind-the-scenes content receive 2.5x engagement",
                "Premium pricing (₹5000+) attracts quality audience",
                "Competitor bundles drive 35% conversion uplift",
                "Instagram Reels are 3x more effective than static posts",
                "Festive season products show 45% higher intent",
            ],
            "trends": [
                "bridal",
                "festive",
                "everyday",
                "sustainable",
            ],
            "generated_at": utc_now().isoformat(),
        },
    }


# ============ PRODUCTS MOCK DATA ============

def get_mock_products() -> Dict[str, Any]:
    """Get mock products listing."""
    categories = ["lehenga", "saree", "kurta_set", "anarkali", "dupatta"]
    products = []
    
    for i, cat in enumerate(categories * 4):
        products.append({
            "id": i + 1,
            "name": f"{cat.replace('_', ' ').title()} Design {i + 1}",
            "category": cat,
            "price": 2000 + (i * 200),
            "currency": "INR",
            "competitor": MOCK_COMPETITORS[i % len(MOCK_COMPETITORS)]["name"],
            "image_url": f"https://example.com/product/{i}.jpg",
        })
    
    return {"status": "success", "data": products}


# ============ REEL SENTIMENT MOCK DATA ============

def get_mock_reel_sentiment(url: str = None) -> Dict[str, Any]:
    """Get mock reel sentiment analysis."""
    return {
        "status": "success",
        "data": {
            "url": url or "https://instagram.com/reels/example",
            "page_sentiment": {
                "label": "Positive",
                "score": 0.82,
            },
            "comment_sentiments": {
                "positive": 58,
                "neutral": 28,
                "negative": 14,
            },
            "summary": {
                "avg_sentiment": 0.75,
                "total_comments": 100,
                "engagement_quality": "high",
            },
            "analyzed_at": utc_now().isoformat(),
        },
    }


# ============ SCRAPE MOCK DATA ============

def get_mock_scrape_result(url: str) -> Dict[str, Any]:
    """Get mock scrape result."""
    return {
        "status": "success",
        "data": {
            "url": url,
            "title": "New Collection - Ethnic Fashion",
            "description": "Explore our latest ethnic wear collection with premium fabrics.",
            "og_image": "https://example.com/og-image.jpg",
            "og_description": "Premium ethnic wear for all occasions",
            "products_found": 45,
            "last_updated": utc_now().isoformat(),
        },
    }


# ============ AI REPORT MOCK DATA ============

def get_mock_ai_report(url: str = None) -> Dict[str, Any]:
    """Get mock AI-generated report."""
    return {
        "status": "success",
        "report_data": {
            "competitor_url": url or "https://competitor.example.com",
            "analysis": {
                "positioning": {
                    "segment": "Premium Ethnic Wear",
                    "target_audience": "affluent women aged 25-45",
                    "key_differentiators": [
                        "Handcrafted embellishments",
                        "Sustainable fabrics",
                        "Celebrity endorsements",
                    ],
                },
                "pricing_strategy": {
                    "average_price": 5200,
                    "price_range": [2500, 12000],
                    "premium_index": 1.45,
                },
                "content_strategy": {
                    "primary_platforms": ["Instagram", "Pinterest"],
                    "content_types": ["Reels", "Stories", "Carousels"],
                    "posting_frequency": "5-7 posts per week",
                },
                "risks_opportunities": {
                    "risks": [
                        "High inventory turnover pressure",
                        "Seasonal demand volatility",
                    ],
                    "opportunities": [
                        "Bridal customization service",
                        "Sustainable fashion trend",
                    ],
                },
                "recommended_response": {
                    "immediate_actions": [
                        "Launch comparable premium line",
                        "Increase Reel content frequency",
                    ],
                    "long_term_strategy": [
                        "Develop influencer partnerships",
                        "Build subscription box model",
                    ],
                },
            },
            "generated_at": utc_now().isoformat(),
        },
    }


# ============ HELPER: CHECK IF SHOULD USE MOCK DATA ============

async def should_use_mock_data(db_result_count: int) -> bool:
    """
    Determine if mock data should be used.
    Returns True if database has no results.
    """
    return db_result_count == 0


# ============ HELPER: MERGE MOCK WITH REAL DATA ============

def merge_with_fallback(real_data: List[Dict], mock_data: List[Dict], limit: int = None) -> List[Dict]:
    """
    Use real data if available, otherwise use mock data.
    
    Args:
        real_data: Data from database
        mock_data: Fallback mock data
        limit: Maximum number of items to return
    
    Returns:
        Combined data (real + mock if needed)
    """
    if real_data:
        result = real_data
    else:
        result = mock_data
    
    if limit:
        result = result[:limit]
    
    return result
