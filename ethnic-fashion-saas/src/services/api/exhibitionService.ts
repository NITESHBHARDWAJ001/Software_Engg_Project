import {
  Exhibition,
  ExhibitionLead,
  ExhibitionROI,
  ExhibitionStatus,
  LeadStatus,
} from '../../types';
import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

type ApiPaged<T> = {
  success: true;
  data: T;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload as T;
}

export const exhibitionService = {
  async getAllExhibitions(_organizationId: string): Promise<Exhibition[]> {
    const res = await apiRequest<ApiPaged<Exhibition[]>>('/v1/exhibitions?page=1&pageSize=200');
    return res.data;
  },

  async getExhibitionById(exhibitionId: string): Promise<Exhibition | null> {
    const res = await apiRequest<ApiSuccess<Exhibition>>(`/v1/exhibitions/${exhibitionId}`);
    return res.data;
  },

  async getExhibitionsByStatus(_organizationId: string, status: ExhibitionStatus): Promise<Exhibition[]> {
    const res = await apiRequest<ApiPaged<Exhibition[]>>(`/v1/exhibitions?page=1&pageSize=200&status=${status}`);
    return res.data;
  },

  async getExhibitionLeads(exhibitionId: string): Promise<ExhibitionLead[]> {
    const res = await apiRequest<ApiSuccess<ExhibitionLead[]>>(`/v1/exhibitions/${exhibitionId}/leads`);
    return res.data;
  },

  async createLead(leadData: Omit<ExhibitionLead, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExhibitionLead> {
    const res = await apiRequest<ApiSuccess<ExhibitionLead>>(`/v1/exhibitions/${leadData.exhibitionId}/leads`, {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
    return res.data;
  },

  async updateLead(leadId: string, updates: Partial<ExhibitionLead>): Promise<ExhibitionLead> {
    const current = await this.getLeadById(leadId);
    if (!current) throw new Error('Lead not found');

    const res = await apiRequest<ApiSuccess<ExhibitionLead>>(
      `/v1/exhibitions/${current.exhibitionId}/leads/${leadId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      },
    );
    return res.data;
  },

  async getExhibitionROI(exhibitionId: string): Promise<ExhibitionROI> {
    const res = await apiRequest<ApiSuccess<ExhibitionROI>>(`/v1/exhibitions/${exhibitionId}/roi`);
    return res.data;
  },

  async createExhibition(exhibitionData: Omit<Exhibition, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exhibition> {
    const res = await apiRequest<ApiSuccess<Exhibition>>('/v1/exhibitions', {
      method: 'POST',
      body: JSON.stringify(exhibitionData),
    });
    return res.data;
  },

  async updateExhibition(exhibitionId: string, updates: Partial<Exhibition>): Promise<Exhibition> {
    const res = await apiRequest<ApiSuccess<Exhibition>>(`/v1/exhibitions/${exhibitionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async getLeadById(leadId: string): Promise<ExhibitionLead | null> {
    const exhibitions = await this.getAllExhibitions('');
    for (const exhibition of exhibitions) {
      const leads = await this.getExhibitionLeads(exhibition.id);
      const found = leads.find((lead) => lead.id === leadId);
      if (found) return found;
    }
    return null;
  },

  async updateLeadStatus(leadId: string, status: LeadStatus): Promise<ExhibitionLead> {
    return this.updateLead(leadId, { status });
  },
};
