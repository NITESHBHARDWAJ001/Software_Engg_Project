# Analytics Service

Analytics Service is a FastAPI microservice for competitor intelligence, trend analytics, sentiment analysis, and AI-powered fashion workflows for ethnic fashion commerce.

It provides:
- Competitor scraping and analysis
- Trend detection and report generation
- Dashboard-ready aggregated endpoints
- Organization and stock context ingestion
- A full AI feature suite (stylist, size-fit, trend forecast, design copilot, pricing, discovery feed, content generation, support assistant, visual search, and inventory replenishment)

## Tech Stack

- FastAPI + Uvicorn/Gunicorn
- SQLAlchemy (async) + PostgreSQL (primary)
- SQLite fallback for local resilience
- APScheduler for background jobs
- OpenAI-compatible client via Groq API (`llama-3.3-70b-versatile`)
- Playwright + BeautifulSoup for scraping support

## Project Layout

- `app/api/routes.py`: API endpoints (core analytics, dashboard, and AI)
- `app/services/`: business logic and AI service modules
- `app/models/models.py`: SQLAlchemy models
- `app/core/config.py`: environment-based configuration
- `main.py`: app bootstrap, lifespan hooks, scheduler start/stop
- `openapi/analytics_api.yaml`: OpenAPI reference (partial)
- `tests/test_routes.py`: async endpoint tests

## Core Capabilities

### 1) Analytics Pipeline

- `POST /api/v1/scrape`: scrape competitor data
- `POST /api/v1/analyze`: run competitor analysis
- `GET /api/v1/trends`: detect trends
- `POST /api/v1/report`: generate analysis + trends report
- `POST /api/v1/analyze-sentiment`: social sentiment-specific run
- `POST /api/v1/generate-ad-copy`: AI defensive ad copy from negative sentiment

### 2) Dashboard APIs

- `GET /api/v1/dashboard/competitors`
- `GET /api/v1/dashboard/competitors/{competitor_id}`
- `GET /api/v1/dashboard/pricing-trends`
- `GET /api/v1/dashboard/sentiment`
- `GET /api/v1/dashboard/insights`
- `GET /api/v1/dashboard/products`

### 3) Organization and Stock Context

- `POST /api/v1/orgs/upsert`
- `DELETE /api/v1/orgs/{org_id}`
- `POST /api/v1/stock-context/ingest`
- `GET /api/v1/stock-context/manual-check`
- `POST /api/v1/seed/sample-data`

## AI Features

All AI endpoints are under `/api/v1/ai/*` and return structured JSON.

1. `POST /api/v1/ai/stylist`
- Personalized ethnic outfit recommendations
- Inputs: user profile, occasion, budget, preferences
- Output: recommendation list with styling rationale and search query

2. `POST /api/v1/ai/size-fit`
- Size and fit prediction with alteration tips
- Inputs: measurements, garment type, gender, fit preference

3. `POST /api/v1/ai/trend-forecast`
- Season/category/region trend outlook for buying decisions

4. `POST /api/v1/ai/design-copilot`
- Collection concept generation for merchandising teams

5. `POST /api/v1/ai/dynamic-pricing`
- Margin-aware next-price recommendations

6. `POST /api/v1/ai/discovery-feed`
- Personalized feed modules for conversion and repeat engagement

7. `POST /api/v1/ai/product-content`
- Product title, descriptions, SEO keywords, social caption, multilingual copy

8. `POST /api/v1/ai/support-assistant`
- Catalog-aware customer support responses with escalation guidance

9. `POST /api/v1/ai/visual-search`
- Style-similarity discovery from visual cues

10. `POST /api/v1/ai/inventory-replenishment`
- SKU-level replenishment planning and risk notes

## Data Model (High Level)

- `Organization`
- `StockContextEntry`
- `Competitor`
- `Product`
- `ProductPriceHistory`
- `SocialPostSentiment`
- `TrendReport`

## Configuration

Environment is loaded from `.env` (see `app/core/config.py`).

Important variables:
- `ENVIRONMENT` (default: `local`)
- `DATABASE_URL` (optional; if provided, used directly)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_SERVER`, `POSTGRES_PORT`, `POSTGRES_DB`
- `GROQ_API_KEY` (required for AI endpoints)

Behavior:
- If `DATABASE_URL` is absent, connection URL is built from Postgres variables.
- AI endpoints return a clear error when `GROQ_API_KEY` is missing/placeholder.

## Run Locally (Non-Docker)

From `analytics_service`:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install -r requirements.txt
python create_db.py
python create_indexes.py
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Alternative helper (Linux/WSL):

```bash
chmod +x startup.sh
./startup.sh
```

Service health:

```bash
curl http://localhost:8000/health
```

## Run with Docker Compose

From `analytics_service`:

```bash
docker compose up --build
```

This starts:
- `db` (PostgreSQL)
- `analytics` (FastAPI service on port `8000`)

## Quick API Examples

Base URL:

```text
http://localhost:8000
```

AI Stylist:

```bash
curl -X POST http://localhost:8000/api/v1/ai/stylist \
  -H "Content-Type: application/json" \
  -d '{
    "user_profile": {"gender":"female","region":"north_india","age_group":"25-35"},
    "occasion": "wedding",
    "budget": 12000,
    "preferences": ["zari", "silk"]
  }'
```

Dynamic Pricing:

```bash
curl -X POST http://localhost:8000/api/v1/ai/dynamic-pricing \
  -H "Content-Type: application/json" \
  -d '{
    "product_name":"Embroidered Kurta",
    "category":"kurtas",
    "current_price":2499,
    "cost_price":1200,
    "stock_units":85,
    "demand_signal":"high",
    "season":"festive",
    "competitor_prices":[2299,2599,2699]
  }'
```

Competitor Summary Dashboard:

```bash
curl "http://localhost:8000/api/v1/dashboard/competitors?org_id=org-1"
```

## Testing

From `analytics_service`:

```bash
pytest -q
```

Current tests focus on health and dashboard routes using an in-memory SQLite async database.

## Notes and Known Gaps

- OpenAPI spec under `openapi/analytics_api.yaml` does not yet cover every newly added AI endpoint.
- `routes.py` is large and currently mixes endpoint models and handlers; splitting by domain can improve maintainability.
- For production, use secure secrets management for `GROQ_API_KEY` and DB credentials.

## Deployment Tips

- Prefer PostgreSQL in production (SQLite fallback is for local/dev resilience).
- Run behind a reverse proxy and enforce HTTPS.
- Add request timeout/rate limiting around AI endpoints.
- Monitor token usage and error rates for external AI calls.
