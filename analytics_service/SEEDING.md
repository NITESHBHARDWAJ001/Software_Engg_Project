# Analytics Service Seeding Guide

This directory contains comprehensive scripts to seed demo data into the analytics service.

## Quick Start

### Windows (PowerShell)
```powershell
cd analytics_service
.\seed-analytics.ps1                    # Seed default orgs
.\seed-analytics.ps1 -Reset             # Clear and reseed
.\seed-analytics.ps1 -OrgIds "org1" "org2"  # Seed specific orgs
```

### Linux/macOS (Bash)
```bash
cd analytics_service
chmod +x seed-analytics.sh
./seed-analytics.sh                     # Seed default orgs
./seed-analytics.sh --reset             # Clear and reseed
./seed-analytics.sh --org-ids org1 org2 # Seed specific orgs
```

### Python (Direct)
```bash
cd analytics_service
python seed_all_analytics.py                                    # Default orgs
python seed_all_analytics.py --reset                            # With reset
python seed_all_analytics.py --org-ids "org-1" "org-2" "org-3" # Custom orgs
```

## What Gets Seeded

For each organization, the script populates:

1. **Competitors** (3 demo competitors)
   - RangMahal Couture
   - Noor Ethnics
   - ThreadStory India

2. **Products** (90 total: 30 per competitor)
   - Categories: lehenga, saree, kurta_set, anarkali, dupatta
   - Realistic price ranges per category
   - URLs for each product

3. **Price History** (450 records)
   - 5 months of pricing data per product
   - Random fluctuations within category ranges

4. **Social Sentiment Posts** (84 posts)
   - 28 general posts per competitor
   - Platform: Instagram
   - Sentiment labels: Positive, Neutral, Negative
   - Mixed engagement scores

5. **Reel Sentiment Data** (24 posts)
   - 8 reel-specific posts per competitor
   - Post type: reel
   - Recent dates (1-30 days ago)

6. **Trend Reports** (1 per org)
   - Category analysis
   - Sentiment distribution
   - Reels engagement metrics
   - Trending styles

7. **Stock Context** (20 entries per org)
   - SKUs and product variants
   - Current stock levels
   - Replenishment notes

## Default Organization IDs

The script seeds three demo orgs by default:
- `demo-org-001`
- `demo-org-002`
- `844bea82-3378-4b38-b39e-7410d12c624c` (from earlier conversation)

## Usage Examples

### Seed with reset for a specific org
```powershell
.\seed-analytics.ps1 -Reset -OrgIds "844bea82-3378-4b38-b39e-7410d12c624c"
```

### Seed multiple custom orgs
```powershell
.\seed-analytics.ps1 -OrgIds "org-marketing" "org-sales" "org-brand"
```

### Clear everything and reseed
```bash
./seed-analytics.sh --reset
```

## Troubleshooting

### Python not found
Ensure the virtual environment is activated or the script path is correct:
```powershell
# Windows
& "..\env\Scripts\Activate.ps1"
```

### Permission denied (Linux/macOS)
Make the script executable:
```bash
chmod +x seed-analytics.sh
```

### Database connection failed
Ensure the analytics service database is configured in `.env`:
```
DATABASE_URL=sqlite+aiosqlite:///./analytics.db
# or PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost/analytics_db
```

## Script Details

- **seed_all_analytics.py**: Main Python script with comprehensive seeding logic
- **seed-analytics.ps1**: PowerShell wrapper for Windows
- **seed-analytics.sh**: Bash wrapper for Linux/macOS
- **seed_demo_data.py**: Original single-org seed script (deprecated, kept for reference)

## Data Completeness

Each seeded org includes all necessary analytics modules:
- ✅ Competitor tracking
- ✅ Product catalogs
- ✅ Price history
- ✅ Social sentiment analysis
- ✅ Reel engagement metrics
- ✅ Trend reports
- ✅ Stock management

This ensures the Market Intelligence, Audience Response, and Campaign Performance tabs in the frontend all have realistic demo data to work with.
