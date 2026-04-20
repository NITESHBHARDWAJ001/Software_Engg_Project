import { logger } from '../../config/logger.js';

const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://127.0.0.1:8000/api/v1';

export class AnalyticsService {
  async upsertOrganization(payload) {
    logger.info({ orgId: payload.orgId }, 'Integration: Upserting organization in analytics service');
    const res = await fetch(`${ANALYTICS_URL}/orgs/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        org_id: payload.orgId,
        name: payload.name,
        slug: payload.slug,
        email: payload.email,
        phone: payload.phone,
      }),
    });
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async deleteOrganization(orgId) {
    logger.info({ orgId }, 'Integration: Deleting organization from analytics service');
    const res = await fetch(`${ANALYTICS_URL}/orgs/${encodeURIComponent(orgId)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async ingestStockContext(orgId, sourceMode, items) {
    logger.info({ orgId, sourceMode, itemCount: items.length }, 'Integration: Ingesting stock context into analytics service');
    const res = await fetch(`${ANALYTICS_URL}/stock-context/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        org_id: orgId,
        source_mode: sourceMode,
        items,
      }),
    });
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async getStockContextManualCheck(orgId) {
    logger.info({ orgId }, 'Integration: Fetching stock context manual check from analytics service');
    const res = await fetch(`${ANALYTICS_URL}/stock-context/manual-check?org_id=${encodeURIComponent(orgId)}`);
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async triggerScrape(url, orgId) {
    logger.info({ url, orgId }, 'Integration: Triggering competitor scrape via Python Analytics microservice');
    const res = await fetch(`${ANALYTICS_URL}/scrape?url=${encodeURIComponent(url)}&org_id=${encodeURIComponent(orgId)}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async getAiReport(orgId) {
    logger.info({ orgId }, 'Integration: Requesting AI Market Report from Python Analytics microservice');
    const res = await fetch(`${ANALYTICS_URL}/report?org_id=${encodeURIComponent(orgId)}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async generateAdCopy(domain, orgId) {
    logger.info({ domain, orgId }, 'Integration: Requesting Generative Ad Copy from Python Analytics microservice');
    const res = await fetch(`${ANALYTICS_URL}/generate-ad-copy?competitor_domain=${encodeURIComponent(domain)}&org_id=${encodeURIComponent(orgId)}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async getCompetitorsSummary(orgId) {
    logger.info({ orgId }, 'Integration: Fetching competitors summary');
    const res = await fetch(`${ANALYTICS_URL}/dashboard/competitors?org_id=${encodeURIComponent(orgId)}`);
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async getPricingTrends(orgId, days = 30) {
    logger.info({ orgId, days }, 'Integration: Fetching pricing trends');
    const res = await fetch(`${ANALYTICS_URL}/dashboard/pricing-trends?org_id=${encodeURIComponent(orgId)}&days=${days}`);
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async getSentimentBreakdown(orgId) {
    logger.info({ orgId }, 'Integration: Fetching sentiment breakdown');
    const res = await fetch(`${ANALYTICS_URL}/dashboard/sentiment?org_id=${encodeURIComponent(orgId)}`);
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async getTopInsights(orgId, limit = 5) {
    logger.info({ orgId, limit }, 'Integration: Fetching top insights');
    const res = await fetch(`${ANALYTICS_URL}/dashboard/insights?org_id=${encodeURIComponent(orgId)}&limit=${limit}`);
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async getProductsByCategory(orgId, page = 1, limit = 20) {
    logger.info({ orgId, page, limit }, 'Integration: Fetching products by category');
    const res = await fetch(`${ANALYTICS_URL}/dashboard/products?org_id=${encodeURIComponent(orgId)}&page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async getCompetitorDetails(orgId, competitorId) {
    logger.info({ orgId, competitorId }, 'Integration: Fetching competitor details');
    const res = await fetch(`${ANALYTICS_URL}/dashboard/competitors/${competitorId}?org_id=${encodeURIComponent(orgId)}`);
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }

  async analyzeReelSentiment(orgId, reelUrl, comments = []) {
    logger.info({ orgId, reelUrl, commentCount: comments.length }, 'Integration: Analyzing reel sentiment');
    const res = await fetch(`${ANALYTICS_URL}/analyze-reel-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        org_id: orgId,
        reel_url: reelUrl,
        comments,
      }),
    });
    if (!res.ok) throw new Error(`Analytics Service Error: ${res.statusText}`);
    return res.json();
  }
}

export const analyticsService = new AnalyticsService();
