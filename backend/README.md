# Ethnic Fashion SaaS - Backend API

A production-ready, multi-tenant backend system for an ethnic fashion e-commerce and management platform built with Express.js, Prisma ORM, PostgreSQL, and JWT authentication.

**Version:** 1.0.0  
**Status:** Production Ready  
**Architecture:** RESTful API with tenant isolation  
**Runtime:** Node.js 22+ (JavaScript ES Modules)

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [API Docs Folder](#api-docs-folder)
3. [Database Schema & Models](#database-schema--models)
4. [Entity Relationship Diagram](#entity-relationship-diagram)
5. [API Modules](#api-modules)
6. [Analytics & Competitive Intelligence Module](#analytics--competitive-intelligence-module)
7. [Component Design](#component-design)
8. [Setup & Installation](#setup--installation)
9. [Environment Configuration](#environment-configuration)
10. [API Endpoints](#api-endpoints)
11. [Authentication & Authorization](#authentication--authorization)
12. [Error Handling](#error-handling)
13. [Data Models Details](#data-models-details)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                       │
│              (Web, Mobile, Admin Dashboards)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/REST
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼──────────────┐    ┌──────────▼──────────┐
│   API Gateway/LB      │    │  Rate Limiter       │
│  (CORS, Security)     │    │  (Auth Routes)      │
└────────┬──────────────┘    └──────────┬──────────┘
         │                              │
         └──────────────┬───────────────┘
                        │
      ┌─────────────────┴──────────────────┐
      │                                    │
┌─────▼────────────────────────┐  ┌───────▼───────────────────┐
│ Main Backend                 │  │ Analytics Service         │
│ (Express.js on Node.js)      │  │ (FastAPI on Python)       │
│                              │  │                            │
│ ├─ Auth Module               │  │ ├─ Web Scraping           │
│ ├─ Organization Module       │  │ ├─ Competitor Tracking    │
│ ├─ Customer Module           │  │ ├─ Trend Detection        │
│ ├─ Inventory Module          │  │ ├─ Performance Analytics  │
│ ├─ Finance Module            │  │ ├─ Report Generation      │
│ └─ Health Module             │  │ └─ Background Schedulers  │
│                              │  │                            │
│ Port: 4000                   │  │ Port: 4001                │
└──────────┬───────────────────┘  └───────┬────────────────────┘
           │                              │
           │      (REST Calls)            │
           └──────────────┬───────────────┘
                         │
      ┌──────────────────┴──────────────────┐
      │                                     │
┌─────▼─────────────────┐  ┌────────────────▼────────┐
│  PostgreSQL Database  │  │ External Services       │
│ (Shared Data Store)   │  │ (Competitor Sites,      │
│                       │  │  Social Platforms,      │
│ ├─ Organizations      │  │  Market Data APIs)      │
│ ├─ Users              │  │                         │
│ ├─ Customers          │  └─────────────────────────┘
│ ├─ Inventory          │
│ ├─ Invoices           │
│ └─ Analytics Data     │
└───────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 22+ | JavaScript execution environment |
| **Language** | JavaScript (ES Modules) | Dynamic, event-driven programming |
| **Framework** | Express.js 5.2.1 | RESTful API routing & middleware |
| **ORM** | Prisma 6.19.2 | Type-safe database access |
| **Database** | PostgreSQL 14+ | Relational data persistence |
| **Authentication** | JWT (HS256) | Stateless token-based auth |
| **Validation** | Zod | Schema validation & TypeScript-like runtime types |
| **Password Hashing** | Argon2id | Secure password storage |
| **Logging** | Pino | Structured JSON logging |
| **Security** | Helmet, CORS, Rate Limiting | Security headers & protection |

---

## API Docs Folder

Detailed, implementation-aligned API documentation is available under:

- `docs/api/README.md` - API docs entry point
- `docs/api/endpoints.md` - endpoint-by-endpoint contract reference
- `docs/api/responses.md` - detailed success payloads and data shapes
- `docs/api/errors.md` - standardized errors and failure cases
- `docs/api/swagger.yml` - source OpenAPI 3.0 spec for Swagger UI
- `docs/api/openapi.json` - legacy JSON OpenAPI spec snapshot

Swagger runtime endpoints:

- `GET /api-docs` - interactive API explorer
- `GET /api-docs.json` - raw OpenAPI spec served by backend
- `GET /api-docs.yaml` - raw OpenAPI YAML spec served by backend

DevOps documentation:

- `docs/devops/CI_CD.md` - CI and CD workflow behavior, tags, and setup

Use this folder as the primary integration contract for frontend and QA work.

---

## Database Schema & Models

### Core Entity Count: 9 Models

1. **Organization** - Multi-tenant company/workspace
2. **User** - User accounts with role-based access
3. **RefreshSession** - JWT token family management
4. **Customer** - Customer records with analytics
5. **InventoryItem** - Product/stock management
6. **InventoryMovement** - Historical stock adjustments
7. **Invoice** - Financial documents
8. **LedgerEntry** - Financial accounting entries
9. **Health Checks** - System monitoring (via routes, not persistent)

### Database Relationships Summary

```
Organization (1) ──────┬─── (N) User
                       ├─── (N) Customer
                       ├─── (N) InventoryItem
                       ├─── (N) Invoice
                       └─── (N) LedgerEntry
                       
User (1) ──────────── (N) RefreshSession

InventoryItem (1) ── (N) InventoryMovement

Invoice (1) ──────── (N) LedgerEntry
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : contains
    ORGANIZATION ||--o{ CUSTOMER : manages
    ORGANIZATION ||--o{ INVENTORYITEM : stocks
    ORGANIZATION ||--o{ INVOICE : issues
    ORGANIZATION ||--o{ LEDGERENTRY : records
    
    USER ||--o{ REFRESHSESSION : has
    
    INVENTORYITEM ||--o{ INVENTORYMOVEMENT : tracks
    
    INVOICE ||--o{ LEDGERENTRY : generates
    
    ORGANIZATION {
        string id PK "uuid"
        string name
        string slug UK "unique"
        string email
        string phone
        datetime createdAt
        datetime updatedAt
    }
    
    USER {
        string id PK "uuid"
        string email UK "unique"
        string passwordHash
        string firstName
        string lastName
        enum role "SUPER_ADMIN, ORG_ADMIN, STAFF"
        boolean isActive
        string organizationId FK
        datetime createdAt
        datetime updatedAt
    }
    
    REFRESHSESSION {
        string id PK "uuid"
        string userId FK
        string tokenHash
        string tokenFamily
        boolean isRevoked
        datetime expiresAt
        datetime createdAt
    }
    
    CUSTOMER {
        string id PK "uuid"
        string organizationId FK
        string name
        string email
        string phone
        string city
        string country
        decimal totalSpent
        decimal lifetimeValue
        boolean isArchived
        datetime createdAt
        datetime updatedAt
    }
    
    INVENTORYITEM {
        string id PK "uuid"
        string organizationId FK
        string name
        string sku UK "unique per org"
        string category
        int currentStock
        int reorderLevel
        int minStockLevel
        decimal unitPrice
        decimal sellingPrice
        string unit
        enum status "IN_STOCK, LOW_STOCK, CRITICAL, OUT_OF_STOCK"
        datetime createdAt
        datetime updatedAt
    }
    
    INVENTORYMOVEMENT {
        string id PK "uuid"
        string organizationId
        string itemId FK
        string changeType
        int quantity
        string note
        datetime createdAt
    }
    
    INVOICE {
        string id PK "uuid"
        string organizationId FK
        string invoiceNumber UK "unique per org"
        enum status "DRAFT, PENDING, PAID, OVERDUE"
        datetime issueDate
        datetime dueDate
        datetime paidAt
        string currency
        decimal subtotal
        decimal taxAmount
        decimal discountAmount
        decimal totalAmount
        datetime createdAt
        datetime updatedAt
    }
    
    LEDGERENTRY {
        string id PK "uuid"
        string organizationId FK
        string invoiceId FK
        enum type "INCOME, EXPENSE, ADJUSTMENT"
        decimal amount
        datetime entryDate
        string category
        string description
        datetime createdAt
    }
```

---

## API Modules

### 1. **Authentication Module** (`/api/v1/auth`)
Handles user authentication, token management, and session control.

**Endpoints:**
- `POST /api/v1/auth/login` - User login with credentials
- `POST /api/v1/auth/refresh` - Refresh access token via refresh token
- `POST /api/v1/auth/logout` - Revoke refresh token session

**Key Features:**
- JWT access token (15 min TTL)
- Refresh token with family-based reuse detection
- Argon2id password hashing
- Token family tracking for security

---

### 2. **Organization Module** (`/api/v1/organizations`)
Multi-tenant workspace operations.

**Endpoints:**
- `GET /api/v1/organizations/me` - Get current user's organization

**Key Features:**
- Organization metadata
- Tenant isolation enforcement
- User role context

---

### 3. **Customer Module** (`/api/v1/customers`)
Customer relationship management with analytics.

**Endpoints:**
- `GET /api/v1/customers` - List customers (paginated, searchable)
  - Query: `search`, `page`, `limit`, `sortBy`, `sortOrder`
- `POST /api/v1/customers` - Create new customer
- `PATCH /api/v1/customers/{id}` - Update customer details
- `POST /api/v1/customers/{id}/archive` - Archive customer (soft delete)

**Key Features:**
- Tenant-scoped CRUD operations
- Full-text search by name/email/phone
- Pagination (default 20 per page)
- Lifetime value tracking
- Total spent calculations

**Data Fields:**
- `name`, `email`, `phone` (contact info)
- `city`, `country` (location)
- `totalSpent`, `lifetimeValue` (analytics)
- `isArchived` (soft delete flag)

---

### 4. **Inventory Module** (`/api/v1/inventory`)
Stock management with movement tracking and alerts.

**Endpoints:**
- `GET /api/v1/inventory/items` - List inventory (paginated, filterable)
- `POST /api/v1/inventory/items` - Create inventory item
- `PATCH /api/v1/inventory/items/{id}` - Update item details
- `POST /api/v1/inventory/items/{id}/adjust` - Record stock adjustment
- `GET /api/v1/inventory/items/{id}/movements` - Stock movement history
- `GET /api/v1/inventory/alerts` - Get low-stock and critical items
- `GET /api/v1/inventory/analytics/by-category` - Category-wise analytics

**Key Features:**
- SKU-based inventory uniqueness (per organization)
- Real-time status calculation (IN_STOCK, LOW_STOCK, CRITICAL, OUT_OF_STOCK)
- Stock movement audit trail
- Automatic reorder alerts
- Category-wise analytics

**Stock Status Rules:**
```javascript
if (currentStock === 0) status = "OUT_OF_STOCK"
else if (currentStock <= minStockLevel) status = "CRITICAL"
else if (currentStock <= reorderLevel) status = "LOW_STOCK"
else status = "IN_STOCK"
```

---

### 5. **Finance Module** (`/api/v1/finance`)
Invoice management and financial record keeping.

**Endpoints:**

**Invoices:**
- `GET /api/v1/finance/invoices` - List invoices (paginated, filterable)
- `POST /api/v1/finance/invoices` - Create invoice (DRAFT status)
- `PATCH /api/v1/finance/invoices/{id}` - Update invoice details
- `PATCH /api/v1/finance/invoices/{id}/status` - Update invoice status

**Ledger:**
- `GET /api/v1/finance/ledger` - List ledger entries (paginated)
- `POST /api/v1/finance/ledger` - Create ledger entry (INCOME/EXPENSE/ADJUSTMENT)

**Analytics:**
- `GET /api/v1/finance/analytics/cash-flow` - Monthly cash flow summary
- `GET /api/v1/finance/analytics/trends` - Revenue vs Expense trends (12 months)

**Key Features:**
- Invoice status workflow (DRAFT → PENDING → PAID or OVERDUE)
- Automatic amount calculations (subtotal, tax, discount, total)
- Multi-currency support
- Ledger entries linked to invoices
- Cash flow analytics
- Revenue vs expense trends

**Invoice Status Meanings:**
- **DRAFT**: Unsaved, editable
- **PENDING**: Issued, awaits payment
- **PAID**: Payment received
- **OVERDUE**: Past due date, unpaid

---

### 6. **Health Module** (`/health`)
System monitoring and readiness checks.

**Endpoints:**
- `GET /health/live` - Liveness probe (is service running?)
- `GET /health/ready` - Readiness probe (is service ready for traffic?)

---

## Analytics & Competitive Intelligence Module

### 7. **Analytics Module** (FastAPI Service - Separate from Main Backend)

A dedicated **Python/FastAPI microservice** running on port **4001** that handles heavy computational tasks, web scraping, and competitive intelligence analysis.

**Purpose:**
The Analytics Module complements the main Express.js backend by providing:
- **Web Scraping** - Collect competitor product data, pricing, reviews
- **Market Analysis** - Competitive positioning, gap analysis, pricing intelligence
- **Trend Detection** - Identify fashion trends using social media data (reels, hashtags)
- **Performance Metrics** - ROI tracking, sales patterns, seasonal analysis
- **Intelligence Reports** - Automated competitive intelligence and opportunity identification

**Why Separate Service?**
✅ **Isolation:** Heavy computations don't block main API
✅ **Scalability:** Can scale independently with more scraping workers
✅ **Technology:** Python + FastAPI better suited for data science & scraping
✅ **Scheduling:** Background job scheduling with APScheduler
✅ **Performance:** Async/await for efficient concurrent scraping

### Architecture

```
Main Backend (Express.js) ←→ Analytics Service (FastAPI)
       ↓                              ↓
   PostgreSQL ←──────────────────────┘
   (Shared Database)
```

**Data Flow:**
1. Main API stores reels, products, tags in PostgreSQL
2. Analytics service reads from shared database
3. Web scraper collects competitor data
4. Trend analysis identifies patterns
5. Reports stored back in PostgreSQL for dashboard consumption

### Analytics Endpoints (Running on port 4001)

#### Competitor Intelligence
```http
GET /analytics/v1/competitors?limit=50
- List tracked competitors
- Returns: name, website, category, avg_price, products_count, last_scraped

GET /analytics/v1/competitors/{id}/products
- Scrape recent competitor products
- Returns: product_name, sku, price, rating, reviews, inventory_status

POST /analytics/v1/competitors/scan
- Trigger immediate competitor scan
- Runs asynchronously, returns job_id for status tracking

GET /analytics/v1/competitors/{id}/pricing-trends
- Get historical pricing data (30/90 days)
- Returns: price_changes, discount_patterns, seasonal_trends
```

#### Trend Analysis (Social Media & Reels)
```http
GET /analytics/v1/trends?period=7days
- Current trending styles/colors/designs
- Returns: trend_name, intensity (0-100), related_hashtags, growth_rate

GET /analytics/v1/trends/reels
- Analyze our reels & competitor reels
- Returns: view_count, engagement_rate, trending_elements, creator_demographics

GET /analytics/v1/trends/hashtags
- Trending hashtags in ethnic fashion
- Returns: hashtag, mention_count, reach, related_trends, growth_trend

POST /analytics/v1/trends/predict
- Predict next trending designs (30-day forecast)
- Returns: predicted_trends, confidence_scores, recommended_products
```

#### Market Analysis
```http
GET /analytics/v1/analysis/competitive-positioning
- How we compare to competitors
- Returns: our_avg_price, competitor_avg_price, market_share_estimate, positioning

GET /analytics/v1/analysis/gaps
- Market opportunities we're not serving
- Returns: gap_category, estimated_demand, competitor_coverage, profit_potential

GET /analytics/v1/analysis/pricing-intelligence
- Pricing strategy recommendations
- Returns: optimal_pricing, margin_analysis, discount_opportunities, elasticity_data

GET /analytics/v1/analysis/customer-segment
- Customer segment analysis from competitor data
- Returns: segment_name, size, avg_order_value, preferred_designs, price_sensitivity
```

#### Performance & ROI
```http
GET /analytics/v1/performance/roi?period=monthly
- ROI metrics for our products
- Returns: total_revenue, expenses, roi_percentage, product_rankings

GET /analytics/v1/performance/seasonal
- Seasonal sales patterns
- Returns: peak_months, off_months, seasonal_multipliers, recommendations

GET /analytics/v1/performance/inventory-optimization
- Inventory efficiency vs competitors
- Returns: our_stock_levels, competitor_stock, stockout_days, optimization_suggestions
```

#### Reports
```http
GET /analytics/v1/reports?type=competitive&period=monthly
- Automated intelligence reports
- Returns: key_findings, recommendations, threats, opportunities

POST /analytics/v1/reports/generate
- Generate custom reports
- Body: { type, period, focus_areas, include_visuals }
- Returns: report_id for download
```

### Web Scraping Strategy

#### What We Scrape

**1. Competitor E-Commerce Sites**
```
Target Data:
├─ Product listings
│  ├─ Name, SKU, category
│  ├─ Price, original_price, discounts
│  ├─ Description, materials, care instructions
│  └─ Images, dimensions, weight
│
├─ Customer feedback
│  ├─ Ratings (1-5 stars)
│  ├─ Review counts
│  ├─ Recent reviews (sentiment analysis)
│  └─ Q&A sections
│
├─ Inventory status
│  ├─ In stock / Out of stock
│  ├─ Stock levels (if visible)
│  └─ Reorder frequency patterns
│
└─ Sales metrics (estimated)
   ├─ Reviews per product (sales proxy)
   ├─ Best-seller badges
   └─ Trending indicators
```

**2. Social Media & Reels**
```
Instagram/TikTok:
├─ #SareeStyle, #EthnicWear, #IndianFashion trends
├─ Video views, likes, comments (engagement)
├─ Creator mentions & product placements
├─ Color trends, design patterns, styling
└─ Follower demographics

Pinterest:
├─ Saree boards & pins
├─ Save counts (intent indicator)
├─ Related pins (discovery patterns)
└─ Seasonal trends

Twitter/X:
├─ Fashion conversations
├─ Brand mentions
└─ Consumer sentiment
```

**3. Pricing Intelligence**
```
Competitor Analysis:
├─ Price ranges by category
├─ Discount/promo frequency
├─ Price changes (daily monitoring)
├─ Margin estimation
├─ Currency conversions (international)
└─ Seasonal pricing patterns
```

### Scraping Technologies Used

**1. BeautifulSoup + Requests** (for static HTML sites)
```python
# Fast, lightweight HTML parsing
# Best for: Simple product listings, static content
# Performance: 10-50 pages/second
```

**2. Selenium** (for JavaScript-heavy sites)
```python
# Full browser automation
# Best for: Complex SPAs, dynamic content loading
# Performance: 1-3 pages/second
```

**3. Playwright** (modern, async-friendly)
```python
# Modern browser automation with async support
# Best for: High-volume concurrent scraping
# Performance: 5-20 pages/second with async pools
```

### Responsible Scraping Practices

✅ **Built-in safeguards:**
- Respect robots.txt automatically
- Rate limiting (configurable delays between requests)
- User-agent rotation to avoid blocking
- Session/cookie management
- Error handling & retry logic
- Logging of scrape jobs for audit

✅ **Ethical scraping:**
- No password/credential scraping
- Respect Terms of Service
- No DDoS-like behavior (rate limited)
- Identify requests with proper User-Agent
- Store data responsibly (GDPR compliance)

### Scraping Schedule

```
Daily Jobs:
├─ 2 AM: Competitor product updates (fast sites)
├─ 3 AM: Pricing updates (all competitors)
└─ 4 AM: Social media hashtag trends

Weekly Jobs:
├─ Monday: Full competitor scan (detailed)
├─ Wednesday: Inventory pattern analysis
└─ Friday: Report generation

Monthly Jobs:
└─ 1st of month: Deep competitive analysis & market reports
```

### FastAPI Stack

**Core Framework:**
- FastAPI 0.104.1 (async REST API)
- Pydantic 2.5 (data validation)
- SQLAlchemy 2.0 (ORM, optional for analytics DB)

**Web Scraping:**
- BeautifulSoup4 4.12.2
- Selenium 4.15.2
- Playwright 1.40.0
- AIOHTTP 3.9.1 (async HTTP)

**Data Processing:**
- Pandas 2.1.3 (data manipulation)
- NumPy 1.26.2 (numerical computing)
- Scikit-learn 1.3.2 (ML for trend detection)

**Job Scheduling:**
- APScheduler 3.10.4 (background job scheduling)

**Utilities:**
- Loguru 0.7.2 (structured logging)
- python-dotenv 1.0.0 (env management)

### Analytics Data Models

**Competitor Product** (scraped data):
```json
{
  "id": "uuid",
  "competitor_id": "uuid",
  "product_name": "Saree Name",
  "sku": "SKU123",
  "category": "Silk Sarees",
  "price": 49.99,
  "currency": "USD",
  "original_price": 79.99,
  "discount_percentage": 37.5,
  "description": "...",
  "materials": ["Silk", "Cotton"],
  "colors": ["Red", "Gold"],
  "rating": 4.5,
  "review_count": 128,
  "in_stock": true,
  "estimated_sales": 512,
  "image_urls": ["..."],
  "product_url": "https://...",
  "scraped_at": "2026-03-19T10:00:00Z"
}
```

**Market Trend**:
```json
{
  "trend_id": "uuid",
  "trend_name": "Pastel Sarees",
  "category": "Color",
  "intensity": 87,
  "instagram_mentions": 15000,
  "instagram_engagement": 4200,
  "tiktok_hashtag_count": 45000,
  "tiktok_views": 2500000,
  "pinterest_saves": 8500,
  "trending_since": "2026-03-01T00:00:00Z",
  "peak_date": "2026-03-15T00:00:00Z",
  "forecast": "rising",
  "related_products": ["SKU123", "SKU124"],
  "related_creators": ["@creator1", "@creator2"]
}
```

---

## Component Design

### System Architecture Overview

The system is composed of **two main services** working together:

1. **Main Backend (Express.js)** - RESTful API for core business operations
2. **Analytics Service (FastAPI)** - Competitive intelligence and trend analysis

### 1. Main Backend Architecture (Express.js on Node.js)

#### Layered Architecture (3-Tier)

```
┌───────────────────────────────────────────────────┐
│  PRESENTATION LAYER                              │
│  ├─ Routes (Express request handlers)            │
│  ├─ Request validation (Zod schemas)             │
│  └─ Response formatting (ok, paged helpers)      │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  BUSINESS LOGIC LAYER                           │
│  ├─ Services (CRUD operations)                  │
│  ├─ Business rules (calculations, validations)  │
│  ├─ Data transformations                        │
│  └─ Multi-tenancy enforcement                   │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  DATA ACCESS LAYER                              │
│  ├─ Prisma Client (ORM)                         │
│  ├─ Query builders                              │
│  ├─ Transactions ($transaction)                 │
│  └─ Database operations                         │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  PERSISTENCE LAYER                              │
│  └─ PostgreSQL Database (Shared with Analytics)  │
└────────────────────────────────────────────────┘
```

### 2. Analytics Service Architecture (FastAPI on Python)

#### Microservice Layers

```
┌──────────────────────────────────────────────────┐
│  API LAYER (FastAPI)                             │
│  ├─ Competitor endpoints (/competitors/*)        │
│  ├─ Trend endpoints (/trends/*)                  │
│  ├─ Analysis endpoints (/analysis/*)             │
│  ├─ Performance endpoints (/performance/*)       │
│  └─ Reports endpoints (/reports/*)               │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│  BUSINESS LOGIC LAYER                            │
│  ├─ Scraper service (web scraping)               │
│  ├─ Competitor analyzer (pricing, products)      │
│  ├─ Trend detector (social analysis)             │
│  ├─ Analytics service (metrics, ROI)             │
│  └─ Report generator (automated reports)         │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│  JOB SCHEDULER LAYER (APScheduler)               │
│  ├─ Daily jobs (competitor updates, pricing)     │
│  ├─ Weekly jobs (full scans, analysis)           │
│  └─ Monthly jobs (deep reports)                  │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│  DATA ACCESS LAYER                               │
│  ├─ SQLAlchemy ORM (if using separate DB)        │
│  ├─ Direct PostgreSQL access (shared)            │
│  └─ External API calls (competitor sites)        │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│  PERSISTENCE & EXTERNAL SOURCES                  │
│  ├─ PostgreSQL Database (shared)                 │
│  ├─ Competitor e-commerce sites                  │
│  ├─ Social media platforms (Instagram, TikTok)   │
│  └─ Market data APIs                             │
└──────────────────────────────────────────────────┘
```

### 3. Inter-Service Communication

**Main Backend → Analytics Service:**
```
POST /analytics/v1/competitors/scan
POST /analytics/v1/trends/predict
GET /analytics/v1/analysis/gaps

Response: JSON data for dashboard display
```

**Data Synchronization:**
- Both services connect to the same PostgreSQL database
- Analytics service reads org data, products, reels from main backend tables
- Results stored in separate analytics_* tables
- Main backend can query analytics results without direct service calls

### Module Structure (Main Backend)

Each API module follows a consistent 3-file pattern:

```
modules/
├── auth/
│   ├── auth.routes.js       (Route endpoints)
│   ├── auth.schemas.js      (Zod validation schemas)
│   └── auth.service.js      (Business logic)
├── customers/
│   ├── customer.routes.js
│   ├── customer.schemas.js
│   └── customer.service.js
├── inventory/
│   ├── inventory.routes.js
│   ├── inventory.schemas.js
│   └── inventory.service.js
├── finance/
│   ├── finance.routes.js
│   ├── finance.schemas.js
│   └── finance.service.js
└── organizations/
    └── organization.routes.js
```

### Analytics Module Structure (FastAPI)

```
analytics/
├── main.py                  (FastAPI app entry point)
├── requirements.txt         (Python dependencies)
├── .env                     (Analytics config)
│
├── app/
│   ├── routers/
│   │   ├── competitors.py   (Competitor endpoints)
│   │   ├── trends.py        (Trend detection endpoints)
│   │   ├── analysis.py      (Market analysis endpoints)
│   │   ├── performance.py   (Performance metrics endpoints)
│   │   └── reports.py       (Report generation endpoints)
│   │
│   ├── services/
│   │   ├── scraper.py       (Web scraping service)
│   │   ├── competitor.py    (Competitor analysis)
│   │   ├── trend.py         (Trend detection & prediction)
│   │   ├── analytics.py     (Performance analytics)
│   │   └── report.py        (Report generation)
│   │
│   ├── jobs/
│   │   ├── scheduler.py     (APScheduler setup)
│   │   └── tasks.py         (Scheduled background jobs)
│   │
│   ├── schemas/             (Pydantic data models)
│   └── utils/               (Shared utilities)
│
└── tests/                   (Test suite)
```

### Middleware Pipeline (Main Backend)

```
Request → CORS → Helmet → RequestContext → Auth → RBAC → Tenant → 
Route Handler → Validation → Service Logic → Response → 
Error Handler → Logging → HTTP Response
```

**Middleware Stack** (`src/shared/middleware/`):
- `auth.js` - JWT verification, extract userId/role/organizationId
- `rbac.js` - Role-based access control enforcement
- `tenant.js` - Organization isolation enforcement
- `requestContext.js` - Request ID propagation
- `errorHandler.js` - Centralized error catching
- `notFound.js` - 404 handler for unmatched routes

### Shared Utilities

```
shared/
├── http/
│   ├── httpError.js         (Custom Error class)
│   └── response.js          (Response formatters)
├── middleware/              (6 middleware files)
├── db/
│   └── prisma.js            (Singleton PrismaClient)
config/
├── env.js                   (Zod env validation)
└── logger.js                (Pino logging setup)
```

---

## Setup & Installation

### Prerequisites

- **Node.js**: 22.x or higher (with npm)
- **PostgreSQL**: 14.x or higher
- **Git**: Latest version

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/ethnic-fashion-saas.git
cd ethnic-fashion-saas/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

Create `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ethnic_fashion_db"

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"

# Super Admin Setup
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="SecurePassword123!"

# API Configuration
PORT=4000
NODE_ENV="development"
```

### Step 4: Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate:dev -- --name init
```

### Step 5: Bootstrap Super Admin

```bash
npm run bootstrap
# Creates SUPER_ADMIN user from env variables
```

### Step 6: Start Development Server

```bash
npm run dev
# Server runs on http://localhost:4000 with hot-reload
```

---

## Environment Configuration

### Key Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `DATABASE_URL` | string | ✓ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | string | ✓ | Secret for access token signing (min 32 chars) |
| `JWT_REFRESH_SECRET` | string | ✓ | Secret for refresh token signing (min 32 chars) |
| `CORS_ORIGIN` | string | ✓ | Frontend URL for CORS whitelist |
| `SUPER_ADMIN_EMAIL` | string | ✓ | Initial super admin email |
| `SUPER_ADMIN_PASSWORD` | string | ✓ | Initial super admin password |
| `PORT` | number | - | Server port (default: 4000) |
| `NODE_ENV` | string | - | Environment: development/staging/production |

### Environment Validation

All environment variables are validated at startup using Zod schema in `config/env.js`. Startup will fail with detailed errors if required variables are missing.

---

## API Endpoints

### Authentication Endpoints

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

Response 200:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "STAFF",
      "organizationId": "uuid"
    }
  },
  "error": null
}
```

### Authorization Header

All protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

### Pagination Response Format

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": ["error message"]
    }
  }
}
```

---

## Authentication & Authorization

### JWT Token Format

**Access Token** (15 minutes):
```javascript
{
  sub: userId,          // Subject (user ID)
  email: userEmail,
  role: userRole,       // SUPER_ADMIN, ORG_ADMIN, STAFF
  organizationId: orgId,
  iat: issuedAt,
  exp: expiresAt
}
```

**Refresh Token** (7 days):
```javascript
{
  sub: userId,
  tokenFamily: familyId,  // For reuse detection
  iat: issuedAt,
  exp: expiresAt
}
```

### Role-Based Access Control (RBAC)

Three roles with hierarchical permissions:

| Role | Capabilities |
|------|----------|
| **SUPER_ADMIN** | Full system access, manage all organizations |
| **ORG_ADMIN** | Full access within organization, manage users |
| **STAFF** | Read-only access to assigned organization data |

### Token Refresh & Rotation

1. Client sends old `refreshToken` to `/api/v1/auth/refresh`
2. Server validates token family
3. New pair (access + refresh) tokens issued
4. Old refresh token invalidated
5. Token reuse detected → all family tokens revoked (security)

### Multi-Tenancy & Tenant Isolation

Every request after authentication includes:
- `organizationId` from JWT
- Tenant middleware enforces: all queries must match user's organization
- No cross-organization data access possible

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PATCH/DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error, malformed input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Zod schema validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User lacks required role |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Uniqueness constraint violation |
| `RATE_LIMITED` | 429 | Too many requests on auth routes |
| `INTERNAL_ERROR` | 500 | Unhandled exception |

---

## Data Models Details

### Organization Model

**Purpose:** Represents a company/tenant workspace

**Fields:**
- `id` (UUID, PK) - Unique identifier
- `name` (String) - Company name
- `slug` (String, UNIQUE) - URL-friendly identifier
- `email` (String, optional) - Contact email
- `phone` (String, optional) - Contact phone
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relationships:**
- 1:N with User (multiple users per organization)
- 1:N with Customer (customers belong to organization)
- 1:N with InventoryItem (inventory per organization)
- 1:N with Invoice (invoices per organization)
- 1:N with LedgerEntry (ledger entries per organization)

**Indexes:**
- Primary key: `id`
- Unique: `slug`

---

### User Model

**Purpose:** User accounts with role-based access

**Fields:**
- `id` (UUID, PK) - User ID
- `email` (String, UNIQUE) - Login email
- `passwordHash` (String) - Argon2id hashed password
- `firstName` (String) - First name
- `lastName` (String) - Last name
- `role` (Enum: SUPER_ADMIN, ORG_ADMIN, STAFF) - Default: STAFF
- `isActive` (Boolean) - Account active flag
- `organizationId` (UUID, FK) - Organization reference (optional for SUPER_ADMIN)
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relationships:**
- N:1 with Organization (belongs to organization)
- 1:N with RefreshSession (multiple sessions per user)

**Indexes:**
- Primary key: `id`
- Unique: `email`
- Foreign key: `organizationId`
- Index on: `role`

---

### RefreshSession Model

**Purpose:** Track JWT refresh token families for security

**Fields:**
- `id` (UUID, PK) - Session ID
- `userId` (UUID, FK) - User reference
- `tokenHash` (String) - Hashed refresh token
- `tokenFamily` (String) - Reuse detection identifier
- `isRevoked` (Boolean) - Revocation flag
- `expiresAt` (DateTime) - Token expiration time
- `createdAt` (DateTime) - Session creation time

**Relationships:**
- N:1 with User (many sessions per user)

**Indexes:**
- Primary key: `id`
- Foreign key: `userId`
- Index on: `tokenFamily` (for reuse detection)

**Security Purpose:**
- Detect token reuse attacks
- If old token reused → revoke entire family
- Refresh token rotation on successful refresh

---

### Customer Model

**Purpose:** CRM data for customers

**Fields:**
- `id` (UUID, PK) - Customer ID
- `organizationId` (UUID, FK) - Organization reference
- `name` (String) - Customer name (required)
- `email` (String, optional) - Email address
- `phone` (String, optional) - Phone number
- `city` (String, optional) - City
- `country` (String, optional) - Country
- `totalSpent` (Decimal, default: 0) - Cumulative purchase amount
- `lifetimeValue` (Decimal, default: 0) - Expected customer value
- `isArchived` (Boolean, default: false) - Soft delete flag
- `createdBy` (String, optional) - Creator user ID
- `updatedBy` (String, optional) - Last updater user ID
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relationships:**
- N:1 with Organization (belongs to organization)

**Indexes:**
- Primary key: `id`
- Foreign key: `organizationId`
- Composite index: `(organizationId, name)`
- Composite index: `(organizationId, isArchived)` (for active customers query)

**Business Rules:**
- Name is required and unique within organization
- Soft delete via `isArchived` flag (not physically deleted)
- `totalSpent` updated on invoice payment
- `lifetimeValue` calculated from purchase history

---

### InventoryItem Model

**Purpose:** Product/stock management

**Fields:**
- `id` (UUID, PK) - Item ID
- `organizationId` (UUID, FK) - Organization reference
- `name` (String) - Product name
- `sku` (String) - Stock Keeping Unit (unique per organization)
- `category` (String) - Product category
- `currentStock` (Integer, default: 0) - Current quantity on hand
- `reorderLevel` (Integer, default: 0) - Threshold to trigger reorder
- `minStockLevel` (Integer, default: 0) - Critical stock level
- `unitPrice` (Decimal, default: 0) - Cost price per unit
- `sellingPrice` (Decimal, default: 0) - Selling price per unit
- `unit` (String, default: "piece") - Unit of measurement (piece, kg, liter, etc.)
- `status` (Enum: IN_STOCK, LOW_STOCK, CRITICAL, OUT_OF_STOCK) - Computed from currentStock
- `createdBy` (String, optional) - Creator user ID
- `updatedBy` (String, optional) - Last updater user ID
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relationships:**
- N:1 with Organization (inventory per organization)
- 1:N with InventoryMovement (track stock changes)

**Indexes:**
- Primary key: `id`
- Unique composite: `(organizationId, sku)` (SKU unique per org)
- Composite index: `(organizationId, category)` (for category analytics)
- Composite index: `(organizationId, status)` (for alerts)

**Status Calculation:**
```javascript
if (currentStock === 0) status = "OUT_OF_STOCK"
else if (currentStock <= minStockLevel) status = "CRITICAL"
else if (currentStock <= reorderLevel) status = "LOW_STOCK"
else status = "IN_STOCK"
```

---

### InventoryMovement Model

**Purpose:** Audit trail for stock adjustments

**Fields:**
- `id` (UUID, PK) - Movement ID
- `organizationId` (String) - Organization context (denormalized)
- `itemId` (UUID, FK) - Inventory item reference
- `changeType` (String) - Type of change (IMPORT, SALE, ADJUSTMENT, RETURN, etc.)
- `quantity` (Integer) - Change in quantity (positive/negative)
- `note` (String, optional) - Reason for adjustment
- `createdBy` (String, optional) - Who made the adjustment
- `createdAt` (DateTime) - Timestamp of change

**Relationships:**
- N:1 with InventoryItem (many movements per item)

**Indexes:**
- Primary key: `id`
- Composite index: `(organizationId, itemId)` (movements per item per org)
- Index on: `createdAt` (for time-series queries)

**Immutability:** Movements are append-only (not updated)

---

### Invoice Model

**Purpose:** Financial documents for sales/purchases

**Fields:**
- `id` (UUID, PK) - Invoice ID
- `organizationId` (UUID, FK) - Organization reference
- `invoiceNumber` (String, unique per org) - Human-readable invoice number
- `status` (Enum: DRAFT, PENDING, PAID, OVERDUE) - Current status
- `issueDate` (DateTime) - Date invoice was created
- `dueDate` (DateTime, optional) - Payment due date
- `paidAt` (DateTime, optional) - Payment received date
- `currency` (String, default: "USD") - Currency code
- `subtotal` (Decimal, default: 0) - Sum before tax/discount
- `taxAmount` (Decimal, default: 0) - Tax amount
- `discountAmount` (Decimal, default: 0) - Discount amount
- `totalAmount` (Decimal, default: 0) - Final amount (subtotal + tax - discount)
- `notes` (String, optional) - Invoice notes
- `createdBy` (String, optional) - Creator user ID
- `updatedBy` (String, optional) - Last updater user ID
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relationships:**
- N:1 with Organization (invoices per organization)
- 1:N with LedgerEntry (ledger entries per invoice)

**Indexes:**
- Primary key: `id`
- Unique composite: `(organizationId, invoiceNumber)`
- Composite index: `(organizationId, status)` (for status filtering)
- Composite index: `(organizationId, issueDate)` (for date-range queries)

**Status Workflow:**
```
DRAFT → PENDING → PAID
                ↘ OVERDUE (if past dueDate and not PAID)
```

**Amount Calculation:**
```
totalAmount = subtotal + taxAmount - discountAmount
```

---

### LedgerEntry Model

**Purpose:** Financial accounting records

**Fields:**
- `id` (UUID, PK) - Entry ID
- `organizationId` (UUID, FK) - Organization reference
- `invoiceId` (UUID, FK, optional) - Linked invoice (null for manual entries)
- `type` (Enum: INCOME, EXPENSE, ADJUSTMENT) - Entry type
- `amount` (Decimal) - Amount (always positive, type indicates direction)
- `entryDate` (DateTime) - Date of entry
- `category` (String, optional) - Accounting category (e.g., "Sales", "Supplies")
- `description` (String, optional) - Entry description
- `createdBy` (String, optional) - Creator user ID
- `createdAt` (DateTime) - Creation timestamp

**Relationships:**
- N:1 with Organization (entries per organization)
- N:1 with Invoice (optional, many entries per invoice)

**Indexes:**
- Primary key: `id`
- Composite index: `(organizationId, type)` (for type-based queries)
- Composite index: `(organizationId, entryDate)` (for date-range analytics)
- Index on: `invoiceId` (for invoice reconciliation)

**Immutability:** Entries are append-only (not updated or deleted)

**Balance Direction:**
- `INCOME`: Adds to balance (revenue from sales)
- `EXPENSE`: Subtracts from balance (costs, supplies)
- `ADJUSTMENT`: Used for corrections, reconciliation

---

## API Rate Limiting

**Auth Routes** (POST /api/v1/auth/*):
- **Window:** 15 minutes
- **Max Requests:** 30 per window
- **Response:** 429 Too Many Requests with retry-after header

**Other Routes:**
- No rate limiting (implement based on deployment needs)

---

## Logging & Monitoring

### Log Format (Pino Structured JSON)

```json
{
  "level": 30,
  "time": "2026-03-19T10:30:45.123Z",
  "pid": 12345,
  "hostname": "server",
  "msg": "Request completed",
  "method": "GET",
  "path": "/api/v1/customers",
  "statusCode": 200,
  "duration_ms": 45,
  "userId": "uuid"
}
```

**Log Levels:**
- `10` - DEBUG (detailed diagnostic info)
- `20` - INFO (informational messages)
- `30` - WARN (warning messages)
- `40` - ERROR (error conditions)
- `50` - FATAL (fatal conditions)

### Health Checks

**For Container Orchestration** (Kubernetes, Docker Compose):
- Liveness: `GET /health/live` → returns 200 if running
- Readiness: `GET /health/ready` → returns 200 if ready for traffic

---

## Deployment

### Development
```bash
npm run dev          # Node with --watch flag for live reload
```

### Production
```bash
npm run build        # TypeScript compilation (if enabled)
npm start            # Run compiled server.js
```

### Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY .env ./
EXPOSE 4000
CMD ["node", "src/server.js"]
```

---

## Project Structure

```
backend/
├── src/
│   ├── server.js              (Entry point)
│   ├── app.js                 (Express setup)
│   ├── config/
│   │   ├── env.js             (Zod env validation)
│   │   └── logger.js          (Pino setup)
│   ├── shared/
│   │   ├── http/
│   │   │   ├── httpError.js   (Error class)
│   │   │   └── response.js    (Response formatters)
│   │   ├── middleware/        (6 middleware files)
│   │   └── db/
│   │       └── prisma.js      (ORM singleton)
│   ├── modules/
│   │   ├── auth/              (3 files)
│   │   ├── customers/         (3 files)
│   │   ├── inventory/         (3 files)
│   │   ├── finance/           (3 files)
│   │   ├── organizations/     (1 file)
│   │   └── health/            (1 file)
│   └── scripts/
│       └── bootstrap-super-admin.js
├── prisma/
│   ├── schema.prisma          (Data model)
│   └── migrations/            (Schema versions)
├── package.json
├── .env.example
└── README.md
```

---

## Dependencies

### Production

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.2.1 | Web framework |
| @prisma/client | ^6.19.2 | ORM |
| zod | ^3.x | Schema validation |
| jsonwebtoken | ^9.x | JWT tokens |
| argon2 | ^0.31.x | Password hashing |
| pino | ^8.x | Logging |
| helmet | ^7.x | Security headers |
| cors | ^2.8.x | Cross-origin requests |
| dotenv | ^16.x | Environment variables |
| express-rate-limit | ^7.x | Rate limiting |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| prisma | ^6.19.2 | Schema management |
| nodemon | ^3.x | Auto-restart on changes |

---

## Testing Strategy

### Unit Tests
- Service layer functions
- Validation schemas
- Error handling

### Integration Tests
- API endpoints
- Database operations
- Multi-tenancy isolation

### Test Tools (Recommended)
- Jest or Vitest for test runner
- Supertest for HTTP testing
- faker for test data generation

---

## Future Enhancements

1. **Exhibitions Module** - Event management with ROI tracking
2. **Social/Marketing Module** - Campaign management with sentiment analysis
3. **Advanced Analytics** - Dashboards and custom reports
4. **Multi-language Support** - i18n for international markets
5. **API Documentation** - Swagger/OpenAPI specs
6. **WebSocket Support** - Real-time notifications
7. **File Uploads** - Cloud storage integration (S3/Azure Blob)
8. **Webhooks** - External system integrations
9. **Two-Factor Authentication** - Enhanced security
10. **Audit Logs** - Complete change history

---

## Support & Contribution

### Reporting Issues
Submit bug reports with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details

### Code Contribution
- Follow existing patterns
- Add tests for new features
- Update documentation
- Create feature branches

---

## License

MIT License - Proprietary to Ethnic Fashion SaaS

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-19 | Initial release with 5 core modules |

---

**Last Updated:** March 19, 2026  
**Maintained By:** Development Team  
**Status:** ✅ Production Ready
