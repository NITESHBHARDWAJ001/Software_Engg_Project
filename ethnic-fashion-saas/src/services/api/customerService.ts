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
  createdAt: string;
  updatedAt: string;
};

export type CustomerStats = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
  averagePurchaseValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    lifetimeValue: number;
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
  async list(search?: string, status?: 'ACTIVE' | 'INACTIVE'): Promise<CustomerRecord[]> {
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
};
