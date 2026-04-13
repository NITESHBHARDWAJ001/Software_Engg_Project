import { logger } from '../../config/logger.js';

const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://127.0.0.1:8000/api/v1';

export class AnalyticsService {
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
}

export const analyticsService = new AnalyticsService();
