import { API_BASE_URL } from '../../utils/constants';

function getAuthToken(): string | null {
  // Zustand persist wraps state in { state: { token: '...' } }
  // so we must parse the JSON stored under the persist key
  try {
    const raw = localStorage.getItem('auth_token');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Handle both: raw token string OR Zustand persist object
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
  }
};
