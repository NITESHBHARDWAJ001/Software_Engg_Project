import { API_BASE_URL } from '../../utils/constants';
import mockAnalyticsService from '../mock/analyticsService';

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('auth_token');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    return parsed?.state?.token ?? null;
  } catch {
    return localStorage.getItem('token') ?? null;
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fullUrl = `${API_BASE_URL}${path}`;
  console.log('[apiRequest] calling', fullUrl, 'with init:', init);
  
  try {
    const response = await fetch(fullUrl, {
      ...init,
      headers,
    });

    console.log('[apiRequest] response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return response.json();
  } catch (err) {
    console.error('[apiRequest] fetch failed for', fullUrl, err);
    throw err;
  }
}

export const realAnalyticsService = {
  async triggerScrape(url: string) {
    return apiRequest<any>('/v1/analytics/scrape', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  async getAiReport(orgId?: string) {
    return apiRequest<any>('/v1/analytics/report', {
      method: 'POST',
      body: JSON.stringify({ org_id: orgId }),
    });
  },
  
  async generateAdCopy(domain: string) {
    return apiRequest<any>('/v1/analytics/generate-ad-copy', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  },

  // Dashboard endpoints
  async getCompetitorsSummary() {
    return apiRequest<any>('/v1/analytics/dashboard/competitors?org_id=test-org');
  },

  async getCompetitorDetails(competitorId: number) {
    return apiRequest<any>(`/v1/analytics/dashboard/competitors/${competitorId}?org_id=test-org`);
  },

  async getPricingTrends(days: number = 30) {
    return apiRequest<any>(`/v1/analytics/dashboard/pricing-trends?org_id=test-org&days=${days}`);
  },

  async getSentimentBreakdown() {
    return apiRequest<any>('/v1/analytics/dashboard/sentiment?org_id=test-org');
  },

  async getTopInsights(limit: number = 5) {
    return apiRequest<any>(`/v1/analytics/dashboard/insights?org_id=test-org&limit=${limit}`);
  },

  async getProductsByCategory(page: number = 1, limit: number = 20) {
    return apiRequest<any>(`/v1/analytics/dashboard/products?org_id=test-org&page=${page}&limit=${limit}`);
  }
};

// Export a selectable service: use mock when VITE_USE_MOCK_ANALYTICS === 'true'
export const analyticsService = (import.meta.env?.VITE_USE_MOCK_ANALYTICS === 'true')
  ? mockAnalyticsService
  : realAnalyticsService;
