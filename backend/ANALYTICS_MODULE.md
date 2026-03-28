# Analytics & Competitive Intelligence Module

Advanced analytics system with web scraping, competitor monitoring, and market trend analysis powered by FastAPI.

---

## 🎯 Module Overview

The Analytics Module is a **separate FastAPI microservice** that complements the main Express.js backend, handling:

1. **Web Scraping** - Collect competitor data, pricing, product trends
2. **Market Analysis** - Competitive positioning, gap analysis
3. **Trend Detection** - Identify fashion trends using reels & social data
4. **Performance Metrics** - ROI tracking, sales patterns, customer behavior
5. **Intelligence Reports** - Automated reports on market opportunities

### Architecture Decision: Separate FastAPI Service

```
┌─────────────────────────────────────────────────────────┐
│         Main Backend (Express.js)                        │
│                                                          │
│  ├─ Auth, Customers, Inventory, Finance, etc.          │
│  └─ REST APIs (CRUD operations)                        │
│                                                          │
│      ↕ (Communication via HTTP/REST calls)             │
│                                                          │
│  ┌─────────────────────────────────────────────┐       │
│  │   Analytics Service (FastAPI)               │       │
│  │                                             │       │
│  │   ├─ Heavy computations                    │       │
│  │   ├─ Web scraping jobs                     │       │
│  │   ├─ TrendAnalysis                         │       │
│  │   ├─ CompetitorTracking                    │       │
│  │   └─ Report generation                     │       │
│  │                                             │       │
│  │   Port: 4001 (separate from main API)      │       │
│  └─────────────────────────────────────────────┘       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Why Separate Service?

✅ **Isolation:** Heavy scraping/computation doesn't block main API
✅ **Scalability:** Can scale analytics independently
✅ **Technology:** Python/FastAPI better for data science tasks
✅ **Scheduling:** Background jobs run separately
✅ **Performance:** Asynchronous web scraping with better libraries

---

## 🏗️ FastAPI Service Architecture

### Project Structure

```
analytics/                  ← New directory (separate from backend/)
├── main.py               ← FastAPI app entry point
├── requirements.txt      ← Python dependencies
├── .env                  ← Analytics config
├── docker-compose.yml    ← Optional: Run alongside main API
│
├── app/
│   ├── __init__.py
│   ├── config.py         ← Settings & configuration
│   ├── database.py       ← SQLAlchemy setup (if using DB)
│   ├── models.py         ← Pydantic models
│   ├── dependencies.py   ← Shared dependencies
│   │
│   ├── services/         ← Business logic layer
│   │   ├── __init__.py
│   │   ├── scraper.py    ← Web scraping logic
│   │   ├── competitor.py ← Competitor analysis
│   │   ├── trend.py      ← Trend detection
│   │   ├── analytics.py  ← Performance analytics
│   │   └── report.py     ← Report generation
│   │
│   ├── routers/          ← API endpoints
│   │   ├── __init__.py
│   │   ├── competitors.py
│   │   ├── trends.py
│   │   ├── analytics.py
│   │   ├── scraping.py
│   │   └── reports.py
│   │
│   ├── schemas/          ← Pydantic schemas
│   │   ├── __init__.py
│   │   ├── competitor.py
│   │   ├── trend.py
│   │   ├── scraping.py
│   │   └── report.py
│   │
│   ├── jobs/             ← Background job scheduling
│   │   ├── __init__.py
│   │   ├── scheduler.py  ← APScheduler setup
│   │   └── tasks.py      ← Scheduled tasks
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       └── helpers.py
│
├── tests/
│   ├── test_scraper.py
│   ├── test_competitor.py
│   └── test_trends.py
└── README.md
```

---

## 📦 FastAPI Dependencies

### requirements.txt

```txt
# Core
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0

# Web Scraping
beautifulsoup4==4.12.2
selenium==4.15.2
playwright==1.40.0
requests==2.31.0
aiohttp==3.9.1

# Data Processing
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.3.2

# Job Scheduling
apscheduler==3.10.4

# Database (optional)
sqlalchemy==2.0.23
psycopg2-binary==2.9.9  # PostgreSQL driver

# Utilities
python-dotenv==1.0.0
httpx==0.25.2
aiofiles==23.2.1

# Development
pytest==7.4.3
pytest-asyncio==0.21.1
black==23.12.1
flake8==6.1.0

# Logging
loguru==0.7.2
```

---

## 🕷️ Web Scraping Strategy

### What to Scrape

#### 1. **Competitor E-Commerce Sites**

```
Target Sites:
  ├─ Ethnic fashion platforms (Saree-specific)
  │  ├─ Product name, SKU, price
  │  ├─ Description, materials, care instructions
  │  ├─ Customer reviews/ratings
  │  └─ Inventory status (available/out of stock)
  │
  ├─ Fashion marketplaces
  │  ├─ Best-sellers, trending products
  │  ├─ Price trends (historical)
  │  ├─ Customer segments buying
  │  └─ Seasonal patterns
  │
  └─ Social platforms (if public)
     ├─ Product tags/hashtags
     ├─ User engagement metrics
     ├─ Trending designs
     └─ Influencer mentions
```

#### 2. **Social Media & Trends**

```
Instagram/TikTok Reels:
  ├─ Hashtag trends (#SareeStyle, #EthnicWear)
  ├─ Video view counts & engagement
  ├─ Creator mentions & product appearances
  ├─ Color trends, design patterns
  └─ Seasonal style preferences

Pinterest:
  ├─ Saree board trends
  ├─ Save/like patterns
  ├─ Related product searches
  └─ Fashion consumer segments
```

#### 3. **Pricing Intelligence**

```
Competitor Pricing Model:
  ├─ Price ranges by category
  ├─ Discount patterns (seasonal, promotional)
  ├─ Price vs. quality positioning
  ├─ Margin estimation
  └─ Currency conversion (for international)
```

### Scraping Technologies

#### Option 1: BeautifulSoup + Requests (Simple Sites)

```python
from bs4 import BeautifulSoup
import requests
import asyncio

async def scrape_competitor_products(competitor_url):
    """Scrape product listing from competitor site"""
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(competitor_url, headers=headers) as response:
            html = await response.text()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    products = []
    for item in soup.find_all('div', class_='product-item'):
        product = {
            'name': item.find('h2', class_='product-name').text.strip(),
            'price': item.find('span', class_='price').text.strip(),
            'category': item.find('span', class_='category').text.strip(),
            'rating': item.find('div', class_='rating')['data-rating'],
            'reviews': int(item.find('span', class_='review-count').text),
            'url': item.find('a')['href'],
            'scraped_at': datetime.now()
        }
        products.append(product)
    
    return products
```

#### Option 2: Selenium (JavaScript-Rendered Sites)

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import asyncio

async def scrape_dynamic_products(competitor_url):
    """Scrape products from JavaScript-heavy sites"""
    
    driver = webdriver.Chrome()
    
    try:
        driver.get(competitor_url)
        
        # Wait for products to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, "product-item"))
        )
        
        # Scroll to load lazy-loaded images
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        await asyncio.sleep(2)
        
        products = []
        for element in driver.find_elements(By.CLASS_NAME, "product-item"):
            product = {
                'name': element.find_element(By.CLASS_NAME, "name").text,
                'price': element.find_element(By.CLASS_NAME, "price").text,
                'image_url': element.find_element(By.TAG_NAME, "img").get_attribute("src"),
                'in_stock': element.find_element(By.CLASS_NAME, "stock").text != "Out of Stock",
                'scraped_at': datetime.now()
            }
            products.append(product)
        
        return products
    
    finally:
        driver.quit()
```

#### Option 3: Playwright (Modern, Async-Friendly)

```python
from playwright.async_api import async_playwright

async def scrape_with_playwright(competitor_url):
    """Modern async scraping with Playwright"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto(competitor_url, wait_until='networkidle')
        
        # Wait for products to load
        await page.wait_for_selector('.product-item')
        
        products = await page.eval_on_selector_all(
            '.product-item',
            '''(elements) => {
                return elements.map(el => ({
                    name: el.querySelector('.name').textContent,
                    price: el.querySelector('.price').textContent,
                    image: el.querySelector('img').src,
                    rating: el.dataset.rating
                }));
            }'''
        )
        
        await browser.close()
        return products
```

### Responsible Scraping Practices

```python
class ResponsibleScraper:
    """Ethical web scraping implementation"""
    
    def __init__(self):
        self.request_delay = 2  # seconds between requests
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            # ... rotate user agents
        ]
    
    async def scrape(self, url):
        """Scrape with rate limiting and politeness"""
        
        # Check robots.txt
        robot_parser = RobotFileParser()
        robot_parser.set_url(f"{url}/robots.txt")
        robot_parser.read()
        
        if not robot_parser.can_fetch(self.user_agent, url):
            logger.warning(f"robots.txt disallows scraping: {url}")
            return None
        
        # Rate limiting
        await asyncio.sleep(self.request_delay)
        
        # Rotate user agent
        headers = {'User-Agent': random.choice(self.user_agents)}
        
        # Make request
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=10) as response:
                if response.status != 200:
                    logger.error(f"Failed to scrape {url}: {response.status}")
                    return None
                
                return await response.text()
```

---

## 📊 Data Models for Analytics

### Competitor Model

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CompetitorProduct(BaseModel):
    """Scraped competitor product"""
    
    id: str
    competitor_id: str
    product_name: str
    sku: Optional[str]
    category: str
    price: float
    currency: str = "USD"
    original_price: Optional[float]
    discount_percentage: Optional[float]
    
    description: Optional[str]
    materials: Optional[List[str]]
    colors: List[str]
    sizes: Optional[List[str]]
    
    rating: Optional[float]
    review_count: int = 0
    
    in_stock: bool
    estimated_sales: Optional[int]  # Estimated from reviews
    
    image_urls: List[str]
    product_url: str
    
    scraped_at: datetime
    last_updated: datetime

class Competitor(BaseModel):
    """Competitor tracking"""
    
    id: str
    name: str
    website: str
    category: str  # "E-commerce", "Social", "Influencer"
    
    monthly_products_count: int
    avg_price: float
    market_segment: str
    
    products: List[CompetitorProduct]
    
    last_scraped: datetime
    scrape_frequency: str = "weekly"  # daily, weekly, monthly
```

### Trend Model

```python
class TrendData(BaseModel):
    """Social media & market trends"""
    
    trend_id: str
    trend_name: str  # e.g., "Pastel Sarees", "Minimalist Designs"
    
    category: str  # Color, Design, Material, Style
    intensity: float  # 0-100 (how trending)
    
    # Data sources
    instagram_mentions: int
    instagram_engagement: float  # avg likes/views
    
    tiktok_views: int
    tiktok_hashtag_count: int
    
    pinterest_saves: int
    pinterest_repins: int
    
    trending_since: datetime
    peak_date: Optional[datetime]
    
    related_products: List[str]  # SKUs in our inventory matching trend
    related_creators: List[str]  # Influencers promoting
    
    forecast: Optional[str]  # "rising", "stable", "declining"

class MarketTrend(BaseModel):
    """Macro market trends"""
    
    trend_id: str
    description: str
    
    # Trend metrics
    competitors_adopting: int
    price_impact: Optional[float]  # Price changes due to trend
    volume_impact: float  # Sales volume change %
    
    seasonal_pattern: str  # "spring", "wedding-season", "year-round"
    
    opportunities: List[str]  # Business opportunities
    threats: List[str]  # Competitive threats
```

### Analytics Report Model

```python
class AnalyticsReport(BaseModel):
    """Generated analytics report"""
    
    report_id: str
    organization_id: str
    
    report_type: str  # "competitive", "trend", "opportunity", "performance"
    period: str  # "weekly", "monthly", "quarterly"
    
    # Key metrics
    total_competitors_tracked: int
    products_analyzed: int
    trends_identified: int
    
    # Findings
    top_opportunities: List[dict]
    competitive_threats: List[dict]
    recommended_actions: List[str]
    
    # Benchmarking
    our_metrics: dict  # Our prices, ratings, etc.
    competitor_avg: dict
    our_vs_competitor: dict  # Comparisons
    
    generated_at: datetime
    generated_by: str  # "scheduled_job" or user_id
```

---

## 📡 FastAPI Endpoints

### Competitor Analysis Endpoints

```python
# app/routers/competitors.py

from fastapi import APIRouter, BackgroundTasks, HTTPException
from typing import List

router = APIRouter(prefix="/api/v1/analytics/competitors", tags=["competitors"])

@router.post("/track")
async def add_competitor_to_track(
    org_id: str,
    competitor_data: dict,
    background_tasks: BackgroundTasks
):
    """
    Add competitor to tracking list
    
    POST /api/v1/analytics/competitors/track
    {
        "name": "Competitor Fashion",
        "website": "https://example.com",
        "scrape_frequency": "daily"
    }
    """
    competitor_id = await save_competitor(org_id, competitor_data)
    
    # Start background scraping job
    background_tasks.add_task(
        scrape_competitor_products,
        competitor_id, org_id
    )
    
    return {
        "success": True,
        "competitor_id": competitor_id,
        "message": "Competitor added. Scraping job started."
    }

@router.get("/list/{org_id}")
async def list_competitors(org_id: str):
    """
    GET /api/v1/analytics/competitors/list/{org_id}
    
    Returns:
    {
        "competitors": [
            {
                "id": "comp_1",
                "name": "Competitor A",
                "product_count": 150,
                "avg_price": 299.99,
                "last_scraped": "2026-03-19T10:00:00Z"
            }
        ]
    }
    """
    competitors = await get_org_competitors(org_id)
    return {"competitors": competitors}

@router.get("/products/{competitor_id}")
async def get_competitor_products(
    competitor_id: str,
    org_id: str,
    category: Optional[str] = None,
    sort_by: str = "price"  # price, rating, popularity
):
    """
    GET /api/v1/analytics/competitors/products/{competitor_id}?category=Sarees&sort_by=rating
    
    Returns: List of competitor's products with metadata
    """
    products = await get_competitor_products_data(
        competitor_id, org_id, category, sort_by
    )
    return {"products": products}

@router.get("/pricing-analysis/{org_id}")
async def pricing_analysis(org_id: str):
    """
    GET /api/v1/analytics/competitors/pricing-analysis/{org_id}
    
    Compare our prices vs competitors
    
    Returns:
    {
        "our_avg_price": 299.99,
        "competitor_avg": 289.50,
        "price_gap": -3.3,  # percentage (we're 3.3% higher)
        "recommendations": [
            "Consider reducing prices on Saree category (competitors avg: $250)",
            "Premium pricing justified for Royal Collection (market avg: $350)"
        ]
    }
    """
    analysis = await analyze_pricing(org_id)
    return analysis

@router.get("/market-share/{org_id}")
async def market_share_analysis(org_id: str):
    """
    GET /api/v1/analytics/competitors/market-share/{org_id}
    
    Estimate market share and positioning
    
    Returns:
    {
        "estimated_market_share": 12.5,
        "market_leader": "Competitor A",
        "our_positioning": "mid-market",
        "competitive_advantages": [
            "Better customer reviews",
            "More product variety"
        ],
        "weaknesses": [
            "Higher shipping costs",
            "Slower delivery"
        ]
    }
    """
    analysis = await analyze_market_share(org_id)
    return analysis
```

### Trend Analysis Endpoints

```python
# app/routers/trends.py

router = APIRouter(prefix="/api/v1/analytics/trends", tags=["trends"])

@router.get("/current/{org_id}")
async def get_current_trends(org_id: str):
    """
    GET /api/v1/analytics/trends/current/{org_id}
    
    Get currently trending styles, colors, materials
    
    Returns:
    {
        "trends": [
            {
                "name": "Pastel Colors",
                "intensity": 85,
                "sources": {
                    "instagram_mentions": 50000,
                    "instagram_engagement": 12.5,
                    "tiktok_hashtags": 125000
                },
                "forecast": "rising",
                "our_inventory_match": 25  # % of products matching
            }
        ]
    }
    """
    trends = await get_trending_styles(org_id)
    return {"trends": trends}

@router.get("/seasonal/{org_id}")
async def seasonal_trends(org_id: str, season: str = None):
    """
    GET /api/v1/analytics/trends/seasonal/{org_id}?season=spring
    
    Get seasonal trend patterns
    
    Returns:
    {
        "season": "spring",
        "top_colors": ["Pastel Pink", "Mint Green", "Peach"],
        "top_designs": ["Floral", "Geometric", "Minimalist"],
        "predicted_demand": {
            "sarees": 120,  # % increase
            "dupattas": 85,
            "accessories": 45
        }
    }
    """
    trends = await get_seasonal_trends(org_id, season)
    return trends

@router.get("/influencer-impact/{org_id}")
async def influencer_analysis(org_id: str):
    """
    GET /api/v1/analytics/trends/influencer-impact/{org_id}
    
    Track influencer mentions and impact on our products
    
    Returns:
    {
        "top_influencers": [
            {
                "name": "Fashion Influencer A",
                "followers": 500000,
                "mentions_of_us": 5,
                "mentions_of_competitors": 8,
                "audience_segment": "18-30, urban, high-income",
                "potential_partnership": true
            }
        ]
    }
    """
    analysis = await analyze_influencers(org_id)
    return analysis
```

### Performance Analytics Endpoints

```python
# app/routers/analytics.py

router = APIRouter(prefix="/api/v1/analytics/performance", tags=["analytics"])

@router.get("/sales-trends/{org_id}")
async def sales_trends(
    org_id: str,
    period: str = "monthly",  # daily, weekly, monthly, yearly
    months: int = 12
):
    """
    GET /api/v1/analytics/performance/sales-trends/{org_id}?period=monthly&months=12
    
    Analyze sales trends and patterns
    
    Returns:
    {
        "data": [
            {
                "date": "2025-03",
                "sales": 45000,
                "units_sold": 150,
                "avg_order_value": 300,
                "top_category": "Sarees",
                "growth_vs_last_period": 15.5
            }
        ],
        "insights": {
            "best_performing_month": "2025-12",
            "seasonal_pattern": "strong_in_wedding_season",
            "trend": "steady_growth"
        }
    }
    """
    trends = await get_sales_trends(org_id, period, months)
    return trends

@router.get("/product-performance/{org_id}")
async def product_performance(
    org_id: str,
    category: Optional[str] = None,
    limit: int = 10
):
    """
    GET /api/v1/analytics/performance/product-performance/{org_id}?category=Sarees&limit=10
    
    Top & bottom performing products
    
    Returns:
    {
        "top_products": [
            {
                "product_id": "prod_123",
                "name": "Silk Saree Red",
                "sales": 500,
                "revenue": 149500,
                "rating": 4.8,
                "margin": 45,
                "trend": "up"
            }
        ],
        "bottom_products": [...]
    }
    """
    performance = await analyze_product_performance(org_id, category, limit)
    return performance

@router.get("/customer-segments/{org_id}")
async def customer_segments(org_id: str):
    """
    GET /api/v1/analytics/performance/customer-segments/{org_id}
    
    Customer segmentation analysis
    
    Returns:
    {
        "segments": [
            {
                "segment_id": "premium_buyers",
                "size": 1500,
                "avg_transaction_value": 500,
                "purchase_frequency": "monthly",
                "preferred_categories": ["Sarees", "Dupattas"],
                "churn_rate": 5,
                "lifetime_value": 6000
            }
        ]
    }
    """
    segments = await analyze_customer_segments(org_id)
    return segments

@router.get("/roi-analysis/{org_id}")
async def roi_analysis(
    org_id: str,
    campaign_id: Optional[str] = None
):
    """
    GET /api/v1/analytics/performance/roi-analysis/{org_id}?campaign_id=camp_123
    
    Return on Investment analysis
    
    Returns:
    {
        "total_investment": 50000,
        "total_revenue": 250000,
        "roi_percentage": 400,
        "payback_period": 2,  # months
        "campaigns": [
            {
                "id": "camp_123",
                "name": "Summer Collection Launch",
                "investment": 10000,
                "revenue": 75000,
                "roi": 650,
                "conversions": 250
            }
        ]
    }
    """
    roi = await calculate_roi(org_id, campaign_id)
    return roi
```

### Scraping Job Endpoints

```python
# app/routers/scraping.py

router = APIRouter(prefix="/api/v1/analytics/scraping", tags=["scraping"])

@router.post("/start-scrape")
async def start_scraping_job(
    org_id: str,
    target: str,  # "all_competitors", "specific_competitor", "trends", "social"
    competitor_id: Optional[str] = None,
    background_tasks: BackgroundTasks
):
    """
    POST /api/v1/analytics/scraping/start-scrape
    {
        "target": "all_competitors",
        "org_id": "org_123"
    }
    
    Start a manual scraping job
    """
    job_id = generate_job_id()
    
    background_tasks.add_task(
        execute_scraping_job,
        job_id, org_id, target, competitor_id
    )
    
    return {
        "job_id": job_id,
        "status": "started",
        "message": "Scraping job initiated"
    }

@router.get("/job-status/{job_id}")
async def get_job_status(job_id: str):
    """
    GET /api/v1/analytics/scraping/job-status/{job_id}
    
    Get status of scraping job
    
    Returns:
    {
        "job_id": "job_123",
        "status": "in_progress",  # not_started, in_progress, completed, failed
        "progress": 45,  # percentage
        "items_processed": 150,
        "started_at": "2026-03-19T10:00:00Z",
        "estimated_completion": "2026-03-19T10:30:00Z",
        "errors": 0
    }
    """
    status = await get_scrape_job_status(job_id)
    return status

@router.get("/logs/{job_id}")
async def get_job_logs(job_id: str, lines: int = 100):
    """
    GET /api/v1/analytics/scraping/logs/{job_id}?lines=50
    
    Get scraping job logs
    """
    logs = await get_scrape_logs(job_id, lines)
    return {"logs": logs}
```

### Reports Endpoints

```python
# app/routers/reports.py

router = APIRouter(prefix="/api/v1/analytics/reports", tags=["reports"])

@router.get("/competitive-analysis/{org_id}")
async def competitive_analysis_report(
    org_id: str,
    format: str = "json"  # json, pdf, csv
):
    """
    GET /api/v1/analytics/reports/competitive-analysis/{org_id}?format=pdf
    
    Generate comprehensive competitive analysis report
    
    Returns:
    {
        "report_id": "report_123",
        "title": "Competitive Analysis Report",
        "period": "2026-03-01 to 2026-03-19",
        "key_findings": [
            "Top competitor pricing is 15% lower in Saree category",
            "Our customer ratings 0.5 stars higher"
        ],
        "recommendations": [
            "Reduce prices on entry-level Sarees",
            "Increase focus on premium offerings"
        ],
        "generated_at": "2026-03-19T14:00:00Z"
    }
    """
    report = await generate_competitive_report(org_id, format)
    return report

@router.get("/monthly-intelligence/{org_id}")
async def monthly_intelligence_report(
    org_id: str,
    month: Optional[str] = None  # YYYY-MM, default = current month
):
    """
    GET /api/v1/analytics/reports/monthly-intelligence/{org_id}?month=2026-03
    
    Monthly market intelligence report
    
    Returns comprehensive analysis of:
    - New competitor products
    - Emerging trends
    - Sales performance
    - Recommendations
    """
    report = await generate_monthly_report(org_id, month)
    return report

@router.get("/opportunity-analysis/{org_id}")
async def opportunity_analysis_report(org_id: str):
    """
    GET /api/v1/analytics/reports/opportunity-analysis/{org_id}
    
    Identify business opportunities based on data
    
    Returns:
    {
        "opportunities": [
            {
                "title": "Niche Market Gap: Sustainable Ethnic Wear",
                "type": "product_gap",
                "potential_revenue": 100000,
                "difficulty": "medium",
                "time_to_launch": "2 months",
                "confidence": 85
            }
        ]
    }
    """
    report = await generate_opportunity_report(org_id)
    return report
```

---

## 🔄 Integration with Main Backend

### How Analytics Service Communicates with Express Backend

```python
# analytics/app/services/integration.py

import httpx
from typing import Optional

class ExpressBackendClient:
    """Client to communicate with main Express backend"""
    
    def __init__(self, backend_url: str = "http://localhost:4000"):
        self.backend_url = backend_url
        self.client = httpx.AsyncClient()
    
    async def get_org_products(self, org_id: str, auth_token: str):
        """
        Fetch organization's products from main backend
        
        GET /api/v1/inventory/items
        """
        response = await self.client.get(
            f"{self.backend_url}/api/v1/inventory/items",
            headers={"Authorization": f"Bearer {auth_token}"},
            params={"organizationId": org_id}
        )
        return response.json()
    
    async def get_sales_data(self, org_id: str, auth_token: str):
        """
        Fetch sales/invoice data for analytics
        
        GET /api/v1/finance/invoices
        """
        response = await self.client.get(
            f"{self.backend_url}/api/v1/finance/invoices",
            headers={"Authorization": f"Bearer {auth_token}"},
            params={"organizationId": org_id}
        )
        return response.json()
    
    async def get_customer_data(self, org_id: str, auth_token: str):
        """
        Fetch customer list for segmentation analysis
        
        GET /api/v1/customers
        """
        response = await self.client.get(
            f"{self.backend_url}/api/v1/customers",
            headers={"Authorization": f"Bearer {auth_token}"},
            params={"organizationId": org_id}
        )
        return response.json()
    
    async def update_product_with_analytics(
        self,
        product_id: str,
        analytics_data: dict,
        auth_token: str
    ):
        """
        Send analytics insights back to main backend
        
        PATCH /api/v1/inventory/items/{id}
        """
        response = await self.client.patch(
            f"{self.backend_url}/api/v1/inventory/items/{product_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"analytics": analytics_data}
        )
        return response.json()
```

### Main Backend Integration Points

```javascript
// backend/src/modules/inventory/inventory.service.js

// After creating an item or handling stock movements
async function notifyAnalyticsService(orgId, productData) {
  try {
    const response = await fetch('http://localhost:4001/api/v1/analytics/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
      },
      body: JSON.stringify({
        org_id: orgId,
        event_type: 'product_created' | 'stock_adjusted' | 'price_changed',
        data: productData,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      logger.error('Failed to notify analytics service');
    }
  } catch (error) {
    logger.error('Analytics service unreachable', error);
    // Don't fail main request if analytics is down
  }
}

// In finance module - send invoice data for analytics
async function notifyAnalyticsOfSale(orgId, invoiceData) {
  // Similar integration point for sales analytics
}
```

---

## 📅 Background Job Scheduling

### APScheduler Configuration

```python
# analytics/app/jobs/scheduler.py

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AnalyticsScheduler:
    """Scheduled scraping and analytics jobs"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
    
    async def start(self):
        """Start scheduler"""
        
        # Daily competitor scraping at 2 AM
        self.scheduler.add_job(
            scrape_all_competitors,
            CronTrigger(hour=2, minute=0),
            id='scrape_competitors_daily',
            name='Daily competitor scraping'
        )
        
        # Hourly social media trend updates
        self.scheduler.add_job(
            update_social_trends,
            CronTrigger(minute=0),  # Every hour
            id='update_trends_hourly',
            name='Hourly trend updates'
        )
        
        # Weekly analytics report generation
        self.scheduler.add_job(
            generate_weekly_reports,
            CronTrigger(day_of_week=6, hour=10),  # Saturday 10 AM
            id='generate_weekly_reports',
            name='Weekly analytics reports'
        )
        
        # Monthly opportunity identification
        self.scheduler.add_job(
            identify_opportunities,
            CronTrigger(day=1, hour=0),  # 1st of month
            id='identify_opportunities_monthly',
            name='Monthly opportunity analysis'
        )
        
        self.scheduler.start()
        logger.info("Analytics scheduler started")
    
    async def stop(self):
        """Stop scheduler"""
        self.scheduler.shutdown()

async def scrape_all_competitors():
    """Daily: Scrape all tracked competitors"""
    logger.info("Starting daily competitor scraping")
    
    competitors = await get_all_active_competitors()
    
    for competitor in competitors:
        try:
            products = await scrape_competitor_products(competitor['url'])
            await save_competitor_products(competitor['id'], products)
            logger.info(f"Scraped {len(products)} products from {competitor['name']}")
        except Exception as e:
            logger.error(f"Failed to scrape {competitor['name']}: {e}")

async def update_social_trends():
    """Hourly: Update trending styles from social media"""
    logger.info("Updating social media trends")
    
    # Check Instagram, TikTok, Pinterest for trending hashtags
    trends = await monitor_social_platforms()
    await store_social_trends(trends)

async def generate_weekly_reports():
    """Weekly: Generate analytics reports for all organizations"""
    logger.info("Generating weekly analytics reports")
    
    orgs = await get_all_organizations()
    
    for org in orgs:
        try:
            report = await generate_competitive_report(org['id'])
            await save_report_to_db(report)
            await send_report_email(org['email'], report)
        except Exception as e:
            logger.error(f"Failed to generate report for {org['id']}: {e}")

async def identify_opportunities():
    """Monthly: Identify new business opportunities"""
    logger.info("Running monthly opportunity analysis")
    
    orgs = await get_all_organizations()
    
    for org in orgs:
        opportunities = await analyze_market_gaps(org['id'])
        await store_opportunities(org['id'], opportunities)
```

---

## 🐳 Docker Deployment

### Dockerfile for Analytics Service

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY ./app ./app
COPY main.py .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8001/health')"

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
```

### Docker Compose (Both Services)

```yaml
# docker-compose.yml in project root

version: '3.8'

services:
  # Main Express Backend
  backend:
    build:
      context: ./backend
    container_name: ethnic-fashion-backend
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: "postgresql://postgres:password@postgres:5432/ethnic_fashion_db"
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CORS_ORIGIN: "http://localhost:5173"
    depends_on:
      - postgres
    networks:
      - ethnic-fashion-net
    restart: unless-stopped

  # Analytics FastAPI Service
  analytics:
    build:
      context: ./analytics
    container_name: ethnic-fashion-analytics
    ports:
      - "4001:8001"
    environment:
      BACKEND_URL: "http://backend:4000"
      DATABASE_URL: "postgresql://postgres:password@postgres:5432/analytics_db"
      LOG_LEVEL: "INFO"
    depends_on:
      - postgres
    networks:
      - ethnic-fashion-net
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ethnic-fashion-postgres
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ethnic_fashion_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ethnic-fashion-net
    restart: unless-stopped

networks:
  ethnic-fashion-net:
    driver: bridge

volumes:
  postgres_data:
```

### Start Both Services

```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f analytics
docker-compose logs -f backend

# Run migrations (from main backend container)
docker-compose exec backend npm run prisma:migrate:deploy

# Stop all
docker-compose down
```

---

##  🔐 API Security & Rate Limiting

```python
# analytics/app/dependencies.py

from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from typing import Optional
import os

security = HTTPBearer()

async def verify_org_token(
    credentials: HTTPAuthCredentials = Depends(security)
) -> str:
    """Verify Bearer token from main backend"""
    
    token = credentials.credentials
    backend_url = os.getenv("BACKEND_URL")
    
    # Validate token with main backend
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{backend_url}/api/v1/auth/verify",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_data = response.json()
        return user_data['organizationId']

async def verify_admin_access(
    org_id: str = Depends(verify_org_token),
    role: Optional[str] = Header(None)
) -> str:
    """Ensure user is ORG_ADMIN for analytics access"""
    
    if role not in ["ORG_ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail="Only ORG_ADMIN can access analytics"
        )
    
    return org_id

# Usage in routes
@router.get("/analysis")
async def get_analysis(org_id: str = Depends(verify_admin_access)):
    # Only ORG_ADMIN can access
    pass
```

---

## 📊 Data Models in PostgreSQL

### New Tables for Analytics

```sql
-- Scraped competitors
CREATE TABLE competitors (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES Organization(id),
  name VARCHAR NOT NULL,
  website VARCHAR UNIQUE,
  category VARCHAR,
  last_scraped TIMESTAMP,
  scrape_frequency VARCHAR DEFAULT 'weekly'
);

-- Competitor products
CREATE TABLE competitor_products (
  id UUID PRIMARY KEY,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  product_name VARCHAR NOT NULL,
  category VARCHAR,
  price DECIMAL(10, 2),
  rating FLOAT,
  in_stock BOOLEAN,
  scraped_at TIMESTAMP NOT NULL,
  INDEX (competitor_id, scraped_at)
);

-- Social trends
CREATE TABLE social_trends (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES Organization(id),
  trend_name VARCHAR NOT NULL,
  category VARCHAR,
  intensity FLOAT,  -- 0-100
  source VARCHAR,  -- instagram, tiktok, pinterest
  trending_since TIMESTAMP,
  INDEX (org_id, intensity DESC)
);

-- Scraping jobs
CREATE TABLE scraping_jobs (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  status VARCHAR,  -- started, in_progress, completed, failed
  target VARCHAR,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  items_processed INT,
  errors INT
);

-- Analytics reports
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES Organization(id),
  report_type VARCHAR,
  generated_at TIMESTAMP,
  data JSONB,
  INDEX (org_id, generated_at DESC)
);
```

---

## 🚀 Analytics Integration Summary

### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Backend                           │
│  • Products, Inventory, Sales, Customers                     │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP/REST API Calls
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
GET Data         POST Events
(Pull)          (Push notifications)
     │                │
     │                ▼
     │        ┌──────────────────────┐
     └───────▶│  Analytics Service   │
             │   (FastAPI)          │
             │                      │
             │ • Scraping Jobs      │
             │ • Trend Analysis     │
             │ • Competitor Track   │
             │ • Report Gen         │
             │                      │
             └──────────┬───────────┘
                        │
                        │ Scheduled Tasks
                        │
     ┌──────────────────┴─────────────────┐
     │                                    │
     ▼                                    ▼
PostgreSQL              Web Scraping APIs
(Analytics Data)      (Competitors, Social)
```

---

## 📈 Key Metrics to Track

### For Each Organization

```
Monthly Metrics:
  ├─ Sales Performance
  │  ├─ Total Revenue
  │  ├─ Average Order Value
  │  └─ Unit Sales
  │
  ├─ Customer Metrics
  │  ├─ New Customers
  │  ├─ Customer Retention
  │  └─ Customer Lifetime Value
  │
  ├─ Competitive Position
  │  ├─ Price Positioning (vs competitors)
  │  ├─ Quality Rating Positioning
  │  └─ Market Share Estimate
  │
  └─ Trend Alignment
     ├─ % Products Matching Trends
     ├─ Content Engagement Rate
     └─ Opportunity Identification
```

---

## 🎓 Usage Example

### Using Analytics from Frontend

```javascript
// Frontend (after user is authenticated)

async function getCompetitiveAnalysis(orgId, token) {
  const response = await fetch(
    `http://localhost:4001/api/v1/analytics/competitors/market-share/${orgId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const analysis = await response.json();
  
  // Display competitive analysis dashboard
  displayMarketShare(analysis);
  displayCompetitiveAdvantages(analysis);
  displayWeaknesses(analysis);
}

// Get trending styles
async function getTrendingStyles(orgId, token) {
  const response = await fetch(
    `http://localhost:4001/api/v1/analytics/trends/current/${orgId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  const trends = await response.json();
  displayTrendingProducts(trends);
}

// Get monthly intelligence report
async function getMonthlyReport(orgId, token) {
  const response = await fetch(
    `http://localhost:4001/api/v1/analytics/reports/monthly-intelligence/${orgId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  const report = await response.json();
  downloadPDF(report);
}
```

---

## ✅ Implementation Checklist

- [ ] Create `analytics/` directory and project structure
- [ ] Set up FastAPI with all dependencies
- [ ] Implement web scraping modules
- [ ] Build competitor tracking service
- [ ] Create trend analysis engine
- [ ] Implement analytics calculation services
- [ ] Build API endpoints for reports
- [ ] Set up APScheduler for background jobs
- [ ] Configure PostgreSQL analytics database
- [ ] Integrate with main Express backend
- [ ] Create Docker setup
- [ ] Add authentication/authorization
- [ ] Build monitoring and logging
- [ ] Test all scraping operations
- [ ] Deploy to staging
- [ ] Load test
- [ ] Deploy to production

---

**Analytics Module Version:** 1.0.0  
**Status:** Architecture & Design Complete  
**Next Phase:** Implementation & Testing

