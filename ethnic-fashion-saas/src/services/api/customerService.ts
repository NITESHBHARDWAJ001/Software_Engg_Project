import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

export type CustomerRecord = {
  id: string;
  organizationId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  totalSpent: number;
  lifetimeValue: number;
  isArchived: boolean;
  rfmScore: number;
  rfmSegment: CustomerRfmSegment;
  rfm: CustomerRfmSnapshot;
  createdAt: string;
  updatedAt: string;
};

export type CustomerRfmSegment =
  | 'CHAMPION'
  | 'LOYAL'
  | 'POTENTIAL_LOYALIST'
  | 'NEW_CUSTOMER'
  | 'AT_RISK'
  | 'NEEDS_ATTENTION';

export type CustomerRfmSnapshot = {
  recencyDays: number;
  frequency: number;
  monetary: number;
  lastActivityAt: string | null;
  recencyScore?: number;
  frequencyScore?: number;
  monetaryScore?: number;
  totalScore?: number;
  segment?: CustomerRfmSegment;
};

export type CustomerStats = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
  averagePurchaseValue: number;
  rfmSummary: {
    customerCount: number;
    averageRecencyDays: number;
    averageFrequency: number;
    averageMonetary: number;
    segments: Record<CustomerRfmSegment, number>;
  };
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    lifetimeValue: number;
    rfmScore: number;
    rfmSegment: CustomerRfmSegment;
  }>;
};

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
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

type BackendCustomer = {
  id: string;
  organizationId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  totalSpent?: string | number;
  lifetimeValue?: string | number;
  isArchived: boolean;
  rfmScore?: number;
  rfmSegment?: CustomerRfmSegment;
  rfm?: CustomerRfmSnapshot;
  createdAt: string;
  updatedAt: string;
};

const toNumber = (value: string | number | undefined | null) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const mapCustomer = (customer: BackendCustomer): CustomerRecord => ({
  id: customer.id,
  organizationId: customer.organizationId,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  city: customer.city,
  country: customer.country,
  totalSpent: toNumber(customer.totalSpent),
  lifetimeValue: toNumber(customer.lifetimeValue),
  isArchived: customer.isArchived,
  rfmScore: customer.rfmScore ?? 0,
  rfmSegment: customer.rfmSegment ?? 'NEEDS_ATTENTION',
  rfm: customer.rfm ?? {
    recencyDays: 0,
    frequency: 0,
    monetary: 0,
    lastActivityAt: null,
  },
  createdAt: customer.createdAt,
  updatedAt: customer.updatedAt,
});

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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

export const customerApiService = {
  async list(search?: string, status?: 'ACTIVE' | 'INACTIVE' | 'ALL'): Promise<CustomerRecord[]> {
    const params = new URLSearchParams({ page: '1', pageSize: '100' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);

    const res = await request<ApiPaged<BackendCustomer[]>>(`/v1/customers?${params.toString()}`);
    return res.data.map(mapCustomer);
  },

  async stats(): Promise<CustomerStats> {
    const res = await request<ApiSuccess<CustomerStats>>('/v1/customers/stats');
    return res.data;
  },

  async create(payload: {
    name: string;
    email?: string;
    phone?: string;
    city?: string;
    country?: string;
  }): Promise<CustomerRecord> {
    const res = await request<ApiSuccess<BackendCustomer>>('/v1/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return mapCustomer(res.data);
  },

  async update(
    customerId: string,
    payload: {
      name?: string;
      email?: string;
      phone?: string;
      city?: string;
      country?: string;
    },
  ): Promise<CustomerRecord> {
    const res = await request<ApiSuccess<BackendCustomer>>(`/v1/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return mapCustomer(res.data);
  },

  async archive(customerId: string): Promise<void> {
    await request<ApiSuccess<null>>(`/v1/customers/${customerId}`, { method: 'DELETE' });
  },

  async setStatus(customerId: string, isArchived: boolean): Promise<CustomerRecord> {
    const res = await request<ApiSuccess<BackendCustomer>>(`/v1/customers/${customerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isArchived }),
    });

    return mapCustomer(res.data);
  },

  async activate(customerId: string): Promise<CustomerRecord> {
    return customerApiService.setStatus(customerId, false);
  },

  async deactivate(customerId: string): Promise<CustomerRecord> {
    return customerApiService.setStatus(customerId, true);
  },
};
