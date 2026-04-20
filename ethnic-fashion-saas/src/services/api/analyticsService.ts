import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import mockAnalyticsService from '../mock/analyticsService';

function getAuthToken(): string | null {
  const storeToken = useAuthStore.getState().token;
  if (storeToken) return storeToken;

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

function getCurrentOrganizationId(explicitOrgId?: string): string {
  if (explicitOrgId) return explicitOrgId;

  try {
    const raw = localStorage.getItem('organization-storage');
    if (!raw) return 'test-org';
    const parsed = JSON.parse(raw);
    const orgId = parsed?.state?.currentOrganization?.id;
    return typeof orgId === 'string' && orgId.trim() ? orgId : 'test-org';
  } catch {
    return 'test-org';
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
  async triggerScrape(url: string, orgId?: string) {
    const scopedOrgId = getCurrentOrganizationId(orgId);
    return apiRequest<any>('/v1/analytics/scrape', {
      method: 'POST',
      body: JSON.stringify({ url, org_id: scopedOrgId }),
    });
  },

  async getAiReport(orgId?: string) {
    const scopedOrgId = getCurrentOrganizationId(orgId);
    return apiRequest<any>('/v1/analytics/report', {
      method: 'POST',
      body: JSON.stringify({ org_id: scopedOrgId }),
    });
  },
  
  async generateAdCopy(domain: string) {
    return apiRequest<any>('/v1/analytics/generate-ad-copy', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  },

  // Dashboard endpoints
  async getCompetitorsSummary(orgId?: string) {
    const scopedOrgId = getCurrentOrganizationId(orgId);
    return apiRequest<any>(`/v1/analytics/dashboard/competitors?org_id=${encodeURIComponent(scopedOrgId)}`);
  },

  async getCompetitorDetails(competitorId: number, orgId?: string) {
    const scopedOrgId = getCurrentOrganizationId(orgId);
    return apiRequest<any>(`/v1/analytics/dashboard/competitors/${competitorId}?org_id=${encodeURIComponent(scopedOrgId)}`);
  },

  async getPricingTrends(days: number = 30, orgId?: string) {
    const scopedOrgId = getCurrentOrganizationId(orgId);
    return apiRequest<any>(`/v1/analytics/dashboard/pricing-trends?org_id=${encodeURIComponent(scopedOrgId)}&days=${days}`);
  },

  async getSentimentBreakdown(orgId?: string) {
    const scopedOrgId = getCurrentOrganizationId(orgId);
    return apiRequest<any>(`/v1/analytics/dashboard/sentiment?org_id=${encodeURIComponent(scopedOrgId)}`);
  },

  async getTopInsights(limit: number = 5, orgId?: string) {
    const scopedOrgId = getCurrentOrganizationId(orgId);
    return apiRequest<any>(`/v1/analytics/dashboard/insights?org_id=${encodeURIComponent(scopedOrgId)}&limit=${limit}`);
  },

  async getProductsByCategory(page: number = 1, limit: number = 20, orgId?: string) {
    const scopedOrgId = getCurrentOrganizationId(orgId);
    return apiRequest<any>(`/v1/analytics/dashboard/products?org_id=${encodeURIComponent(scopedOrgId)}&page=${page}&limit=${limit}`);
  },

  async analyzeReelSentiment(reelUrl: string, comments: string[] = [], orgId?: string) {
    const scopedOrgId = getCurrentOrganizationId(orgId);
    return apiRequest<any>('/v1/analytics/sentiment/reel', {
      method: 'POST',
      body: JSON.stringify({
        org_id: scopedOrgId,
        reel_url: reelUrl,
        comments,
      }),
    });
  }
};

// Export a selectable service: use mock when VITE_USE_MOCK_ANALYTICS === 'true'
export const analyticsService = (import.meta.env?.VITE_USE_MOCK_ANALYTICS === 'true')
  ? mockAnalyticsService
  : realAnalyticsService;
