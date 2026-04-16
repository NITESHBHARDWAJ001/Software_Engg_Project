import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

export type InventoryRecord = {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  minStockLevel: number;
  unitPrice: number;
  sellingPrice: number;
  unit: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryStats = {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoriesCount: number;
  recentTransactions: number;
  averageUnitPrice: number;
};

export type InventoryMovementRecord = {
  id: string;
  organizationId: string;
  itemId: string;
  changeType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  note?: string | null;
  createdBy?: string | null;
  createdAt: string;
  item?: {
    id: string;
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    sellingPrice: number;
    unit: string;
  };
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

type BackendInventory = {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  minStockLevel: number;
  unitPrice: string | number;
  sellingPrice: string | number;
  unit: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type BackendMovement = {
  id: string;
  organizationId: string;
  itemId: string;
  changeType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  note?: string | null;
  createdBy?: string | null;
  createdAt: string;
  item?: {
    id: string;
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    sellingPrice: string | number;
    unit: string;
  };
};

const toNumber = (value: string | number | undefined | null) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const mapInventory = (item: BackendInventory): InventoryRecord => ({
  id: item.id,
  organizationId: item.organizationId,
  name: item.name,
  sku: item.sku,
  category: item.category,
  currentStock: item.currentStock,
  reorderLevel: item.reorderLevel,
  minStockLevel: item.minStockLevel,
  unitPrice: toNumber(item.unitPrice),
  sellingPrice: toNumber(item.sellingPrice),
  unit: item.unit,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const mapMovement = (row: BackendMovement): InventoryMovementRecord => ({
  id: row.id,
  organizationId: row.organizationId,
  itemId: row.itemId,
  changeType: row.changeType,
  quantity: row.quantity,
  note: row.note,
  createdBy: row.createdBy,
  createdAt: row.createdAt,
  item: row.item
    ? {
        ...row.item,
        sellingPrice: toNumber(row.item.sellingPrice),
      }
    : undefined,
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

export const inventoryApiService = {
  async list(search?: string, category?: string): Promise<InventoryRecord[]> {
    const params = new URLSearchParams({ page: '1', pageSize: '100' });
    if (search) params.set('search', search);
    if (category) params.set('category', category);

    const res = await request<ApiPaged<BackendInventory[]>>(`/v1/inventory?${params.toString()}`);
    return res.data.map(mapInventory);
  },

  async stats(): Promise<InventoryStats> {
    const res = await request<ApiSuccess<InventoryStats>>('/v1/inventory/stats');
    return res.data;
  },

  async create(payload: {
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    reorderLevel: number;
    minStockLevel: number;
    unitPrice: number;
    sellingPrice: number;
    unit: string;
  }): Promise<InventoryRecord> {
    const res = await request<ApiSuccess<BackendInventory>>('/v1/inventory', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return mapInventory(res.data);
  },

  async update(itemId: string, payload: Partial<{
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    reorderLevel: number;
    minStockLevel: number;
    unitPrice: number;
    sellingPrice: number;
    unit: string;
  }>): Promise<InventoryRecord> {
    const res = await request<ApiSuccess<BackendInventory>>(`/v1/inventory/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return mapInventory(res.data);
  },

  async adjustStock(itemId: string, payload: {
    quantity: number;
    changeType: 'IN' | 'OUT' | 'ADJUSTMENT';
    note?: string;
  }): Promise<InventoryRecord> {
    const res = await request<ApiSuccess<BackendInventory>>(`/v1/inventory/${itemId}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return mapInventory(res.data);
  },

  async lowStockAlerts(): Promise<InventoryRecord[]> {
    const res = await request<ApiSuccess<BackendInventory[]>>('/v1/inventory/alerts/low-stock');
    return res.data.map(mapInventory);
  },

  async listMovements(params?: {
    page?: number;
    pageSize?: number;
    changeType?: 'IN' | 'OUT' | 'ADJUSTMENT';
    search?: string;
  }): Promise<InventoryMovementRecord[]> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      pageSize: String(params?.pageSize ?? 100),
    });
    if (params?.changeType) query.set('changeType', params.changeType);
    if (params?.search) query.set('search', params.search);

    const res = await request<ApiPaged<BackendMovement[]>>(`/v1/inventory/movements?${query.toString()}`);
    return res.data.map(mapMovement);
  },
};
