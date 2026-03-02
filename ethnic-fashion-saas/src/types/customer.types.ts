export enum CustomerType {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
  DISTRIBUTOR = 'DISTRIBUTOR',
  VIP = 'VIP',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLACKLISTED = 'BLACKLISTED',
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  type: CustomerType;
  status: CustomerStatus;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstNumber?: string;
  totalPurchases: number;
  totalSpent: number;
  lifetimeValue: number;
  lastPurchaseDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  tags?: string[];
  sourceLeadId?: string;
  assignedTo?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
  averageOrderValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
  }>;
}
