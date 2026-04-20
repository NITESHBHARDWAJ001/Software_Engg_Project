# Mock Data Fallback System

The analytics service now includes an intelligent fallback system that displays mock demo data when the database is empty or lacks data for a specific organization.

## How It Works

1. **Database First**: When an endpoint is called, it queries the database for real data
2. **Fallback on Empty**: If no data exists for the org, mock data is returned automatically
3. **Seamless UX**: The frontend gets demo data regardless of seeding status
4. **No Configuration**: Works out of the box without additional setup

## Benefits

- ✅ **Works Without Seeding**: Start the analytics service without running `seed_all_analytics.py`
- ✅ **Org-Agnostic**: Any org_id gets demo data if database is empty
- ✅ **Development-Friendly**: Perfect for demo, testing, and UI development
- ✅ **Graceful Degradation**: Real data takes precedence when available
- ✅ **Performance**: Mock data is instantaneous (no database queries needed)

## Endpoints with Mock Fallback

### Dashboard Endpoints
- `GET /api/v1/analytics/dashboard/competitors` → Mock 3 competitors
- `GET /api/v1/analytics/dashboard/pricing-trends` → Mock 30+ price history entries
- `GET /api/v1/analytics/dashboard/sentiment` → Mock sentiment breakdown
- `GET /api/v1/analytics/dashboard/insights` → Mock AI insights
- `GET /api/v1/analytics/dashboard/products` → Mock 20 products with pagination

### Action Endpoints
- `POST /api/v1/analytics/scrape` → Mock scrape result if scraping fails
- `POST /api/v1/analytics/report` → Mock AI-generated report if generation fails
- `POST /api/v1/analytics/analyze-reel-sentiment` → Mock reel analysis (coming soon)

## Mock Data Contents

### Competitors (3 mock competitors)
- **RangMahal Couture**: 45 products, avg price ₹5,200.50
- **Noor Ethnics**: 38 products, avg price ₹4,800.75
- **ThreadStory India**: 52 products, avg price ₹5,950.00

### Products
- 5 categories: lehenga, saree, kurta_set, anarkali, dupatta
- Realistic price ranges per category
- Product URLs and metadata

### Pricing Trends
- 30-day historical pricing data
- Category-wise price fluctuations
- Competitor comparison data

### Sentiment Analysis
- Positive (65%), Neutral (22%), Negative (13%)
- 10+ mock reel entries
- Engagement scores

### AI Report
- Competitor positioning analysis
- Pricing strategy breakdown
- Content strategy recommendations
- Risk & opportunity assessment
- Actionable response strategies

## Usage Scenarios

### Scenario 1: Fresh Start (No Seeding)
```bash
# Just start the analytics service
docker-compose up

# Or locally
python main.py

# Call any endpoint - get mock data immediately
curl http://localhost:8000/api/v1/analytics/dashboard/competitors?org_id=any-org-id
```

### Scenario 2: Demo Presentation
```bash
# Service runs with demo data ready
# Endpoint responses work out of the box
# No database setup required
```

### Scenario 3: Mixed Real + Mock
```bash
# Run seeding for test org
python seed_all_analytics.py --org-ids "production-org"

# production-org gets real data
# other-org-id gets mock data automatically
```

## Example Responses

### Dashboard/Competitors (Mock)
```json
{
  "status": "success",
  "data": [
    {
      "id": 12345,
      "name": "RangMahal Couture",
      "url": "https://rangmahal.example.com",
      "product_count": 45,
      "avg_price": 5200.50,
      "last_scraped": "2026-04-20T10:30:00Z"
    },
    ...
  ]
}
```

### Report (Mock)
```json
{
  "status": "success",
  "report_data": {
    "competitor_url": "https://example.com",
    "analysis": {
      "positioning": {
        "segment": "Premium Ethnic Wear",
        "target_audience": "affluent women aged 25-45",
        "key_differentiators": [
          "Handcrafted embellishments",
          "Sustainable fabrics",
          "Celebrity endorsements"
        ]
      },
      "pricing_strategy": {
        "average_price": 5200,
        "price_range": [2500, 12000],
        "premium_index": 1.45
      },
      ...
    }
  }
}
```

## When to Seed Real Data

Use `seed_all_analytics.py` when you want:
- Organization-specific data
- Multiple orgs with unique data
- Realistic historical data for charting
- Data for performance/load testing
- Production or staging environments

## Technical Implementation

### Mock Data Module
**File**: `app/services/mock_data.py`

Functions:
- `get_mock_competitors_summary()` - 3 demo competitors
- `get_mock_pricing_trends(days)` - 30-day price history
- `get_mock_sentiment()` - Sentiment breakdown
- `get_mock_insights()` - AI insights
- `get_mock_products()` - Product listing
- `get_mock_reel_sentiment(url)` - Reel analysis
- `get_mock_scrape_result(url)` - Scrape result
- `get_mock_ai_report(url)` - AI report

### Usage in Routes
```python
# In app/api/routes.py

@router.get("/dashboard/competitors")
async def get_competitors_summary(org_id: str, db: AsyncSession = Depends(get_db)):
    competitors = await db.execute(select(Competitor)...)
    
    # Fallback to mock if empty
    if not competitors:
        return mock_data.get_mock_competitors_summary()
    
    # Process and return real data
    ...
```

## Configuration

No configuration needed! The fallback system works automatically:
- Enabled by default
- No environment variables required
- No database schema changes needed
- Backward compatible with existing code

## Limitations

- Mock data is static (doesn't update over time)
- Not suitable for production analytics
- Same mock data returned for all empty orgs
- No per-org customization

## Future Enhancements

- [ ] Org-specific mock data generation
- [ ] Randomized mock data for variety
- [ ] Fallback confidence flag in responses
- [ ] Configuration to disable mock fallback
- [ ] Integration with test data factories

## Troubleshooting

### I'm seeing mock data but I seeded the database
**Solution**: Verify the org_id matches. Seeded data is org-specific.

### Mock data isn't appearing
**Solution**: Check that the org_id parameter is provided. Without it, the service can't determine which fallback to use.

### Performance issue with mock data
**Solution**: Mock data is instantaneous. If slow, check database connection instead.

## Support

For issues with mock data:
1. Check if org_id is correct in API call
2. Verify database connection status
3. Check analytics service logs for errors
4. Ensure mock_data.py is in app/services/
