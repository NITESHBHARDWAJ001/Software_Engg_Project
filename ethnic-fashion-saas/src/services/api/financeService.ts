import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE';
export type LedgerEntryType = 'INCOME' | 'EXPENSE' | 'ADJUSTMENT';

export type FinanceInvoice = {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  paidAt?: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LedgerEntry = {
  id: string;
  organizationId: string;
  invoiceId?: string | null;
  type: LedgerEntryType;
  amount: number;
  entryDate: string;
  category?: string | null;
  description?: string | null;
  createdBy?: string | null;
  createdAt: string;
};

export type FinanceStats = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  overdueInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
  period: {
    from: string;
    to: string;
  };
};

export type FinanceTrend = {
  period: string;
  income: number;
  expense: number;
  net: number;
};

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

type RawInvoice = Omit<FinanceInvoice, 'subtotal' | 'taxAmount' | 'discountAmount' | 'totalAmount'> & {
  subtotal: string | number;
  taxAmount: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
};

type RawLedgerEntry = Omit<LedgerEntry, 'amount'> & {
  amount: string | number;
};

const toNumber = (value: string | number | undefined | null) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const mapInvoice = (row: RawInvoice): FinanceInvoice => ({
  ...row,
  subtotal: toNumber(row.subtotal),
  taxAmount: toNumber(row.taxAmount),
  discountAmount: toNumber(row.discountAmount),
  totalAmount: toNumber(row.totalAmount),
});

const mapLedgerEntry = (row: RawLedgerEntry): LedgerEntry => ({
  ...row,
  amount: toNumber(row.amount),
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

export const financeApiService = {
  async getFinanceStats(): Promise<FinanceStats> {
    const response = await request<ApiSuccess<FinanceStats>>('/v1/finance/analytics/stats');
    return response.data;
  },

  async getInvoices(params?: { status?: InvoiceStatus; search?: string }): Promise<FinanceInvoice[]> {
    const query = new URLSearchParams({ page: '1', pageSize: '100' });
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const response = await request<ApiPaged<RawInvoice[]>>(`/v1/finance/invoices?${query.toString()}`);
    return response.data.map(mapInvoice);
  },

  async createInvoice(payload: {
    invoiceNumber: string;
    issueDate: string;
    dueDate?: string;
    currency: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    notes?: string;
  }): Promise<FinanceInvoice> {
    const response = await request<ApiSuccess<RawInvoice>>('/v1/finance/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapInvoice(response.data);
  },

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus, paidAt?: string): Promise<FinanceInvoice> {
    const response = await request<ApiSuccess<RawInvoice>>(`/v1/finance/invoices/${invoiceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paidAt }),
    });
    return mapInvoice(response.data);
  },

  async getInvoice(invoiceId: string): Promise<FinanceInvoice> {
    const response = await request<ApiSuccess<RawInvoice>>(`/v1/finance/invoices/${invoiceId}`);
    return mapInvoice(response.data);
  },

  async getLedger(params?: { type?: LedgerEntryType; from?: string; to?: string }): Promise<LedgerEntry[]> {
    const query = new URLSearchParams({ page: '1', pageSize: '100' });
    if (params?.type) query.set('type', params.type);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);

    const response = await request<ApiPaged<RawLedgerEntry[]>>(`/v1/finance/ledger?${query.toString()}`);
    return response.data.map(mapLedgerEntry);
  },

  async createLedgerEntry(payload: {
    invoiceId?: string;
    type: LedgerEntryType;
    amount: number;
    entryDate: string;
    category?: string;
    description?: string;
  }): Promise<LedgerEntry> {
    const response = await request<ApiSuccess<RawLedgerEntry>>('/v1/finance/ledger', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return mapLedgerEntry(response.data);
  },

  async getTrends(groupBy: 'day' | 'month' = 'month'): Promise<FinanceTrend[]> {
    const response = await request<ApiSuccess<FinanceTrend[]>>(`/v1/finance/analytics/trends?groupBy=${groupBy}`);
    return response.data;
  },
};
