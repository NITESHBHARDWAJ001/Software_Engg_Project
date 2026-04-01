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
}

export const analyticsService = new AnalyticsService();
