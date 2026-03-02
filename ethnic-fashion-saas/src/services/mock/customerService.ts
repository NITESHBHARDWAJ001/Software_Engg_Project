// Mock data service for Customer Management
import { Customer, CustomerType, CustomerStatus } from '../../types';
import { generateId } from '../../utils/helpers';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    organizationId: 'org-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 43210',
    type: CustomerType.RETAIL,
    status: CustomerStatus.ACTIVE,
    company: 'Elegant Boutique',
    address: '123 MG Road, Mumbai, Maharashtra 400001',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400001',
    totalPurchases: 450000,
    totalSpent: 450000,
    lifetimeValue: 450000,
    lastPurchaseDate: new Date('2026-02-15').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-06-10').toISOString(),
    updatedAt: new Date('2026-02-15').toISOString(),
    tags: ['VIP', 'Designer Collection'],
    notes: 'Prefers premium designer sarees. Frequent buyer.',
  },
  {
    id: 'cust-2',
    organizationId: 'org-1',
    name: 'Rajesh Kumar',
    email: 'rajesh.k@retailstore.com',
    phone: '+91 98765 12345',
    type: CustomerType.WHOLESALE,
    status: CustomerStatus.ACTIVE,
    company: 'Fashion Hub Retail Chain',
    address: '456 Connaught Place, New Delhi 110001',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110001',
    totalPurchases: 1250000,
    totalSpent: 1250000,
    lifetimeValue: 1250000,
    lastPurchaseDate: new Date('2026-02-25').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2024-03-15').toISOString(),
    updatedAt: new Date('2026-02-25').toISOString(),
    tags: ['Wholesale', 'Bulk Orders'],
    notes: 'Regular bulk orders. Net 30 payment terms.',
  },
  {
    id: 'cust-3',
    organizationId: 'org-1',
    name: 'Anita Desai',
    email: 'anita@fashionworld.com',
    phone: '+91 98765 67890',
    type: CustomerType.RETAIL,
    status: CustomerStatus.ACTIVE,
    company: 'Fashion World',
    address: '789 Brigade Road, Bangalore 560001',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    totalPurchases: 325000,
    totalSpent: 325000,
    lifetimeValue: 325000,
    lastPurchaseDate: new Date('2026-01-20').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-08-20').toISOString(),
    updatedAt: new Date('2026-01-20').toISOString(),
    tags: ['Regular', 'Silk Collection'],
    notes: 'Interested in south Indian silk sarees.',
  },
  {
    id: 'cust-4',
    organizationId: 'org-1',
    name: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    phone: '+91 98765 98765',
    type: CustomerType.RETAIL,
    status: CustomerStatus.INACTIVE,
    address: '321 Park Street, Kolkata 700016',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    pincode: '700016',
    totalPurchases: 85000,
    totalSpent: 85000,
    lifetimeValue: 85000,
    lastPurchaseDate: new Date('2025-09-10').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2025-05-05').toISOString(),
    updatedAt: new Date('2025-09-10').toISOString(),
    tags: ['Occasional'],
    notes: 'Has not purchased in last 6 months. Send follow-up.',
  },
  {
    id: 'cust-5',
    organizationId: 'org-1',
    name: 'Meera Patel',
    email: 'meera.patel@boutique.com',
    phone: '+91 98765 55555',
    type: CustomerType.WHOLESALE,
    status: CustomerStatus.ACTIVE,
    company: 'Traditional Wear Boutique',
    address: '654 CG Road, Ahmedabad 380009',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    pincode: '380009',
    totalPurchases: 680000,
    totalSpent: 680000,
    lifetimeValue: 680000,
    lastPurchaseDate: new Date('2026-02-28').toISOString(),
    createdBy: 'user-1',
    createdAt: new Date('2024-11-20').toISOString(),
    updatedAt: new Date('2026-02-28').toISOString(),
    tags: ['Wholesale', 'Traditional'],
    notes: 'Prefers traditional Gujarati designs.',
  },
];

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
  averagePurchaseValue: number;
  topCustomers: Customer[];
}

export interface PurchaseHistory {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  items: number;
  status: 'completed' | 'pending' | 'cancelled';
}

const mockPurchaseHistory: PurchaseHistory[] = [
  {
    id: 'pur-1',
    customerId: 'cust-1',
    date: new Date('2026-02-15').toISOString(),
    amount: 125000,
    items: 15,
    status: 'completed',
  },
  {
    id: 'pur-2',
    customerId: 'cust-1',
    date: new Date('2026-01-10').toISOString(),
    amount: 95000,
    items: 10,
    status: 'completed',
  },
  {
    id: 'pur-3',
    customerId: 'cust-2',
    date: new Date('2026-02-25').toISOString(),
    amount: 450000,
    items: 150,
    status: 'completed',
  },
];

export const customerService = {
  async getAllCustomers(organizationId: string): Promise<Customer[]> {
    await delay(600);
    return mockCustomers.filter(c => c.organizationId === organizationId);
  },

  async getCustomerById(customerId: string): Promise<Customer | null> {
    await delay(400);
    return mockCustomers.find(c => c.id === customerId) || null;
  },

  async getCustomersByStatus(organizationId: string, status: CustomerStatus): Promise<Customer[]> {
    await delay(500);
    return mockCustomers.filter(
      c => c.organizationId === organizationId && c.status === status
    );
  },

  async getCustomerStats(organizationId: string): Promise<CustomerStats> {
    await delay(600);
    const customers = mockCustomers.filter(c => c.organizationId === organizationId);
    
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === CustomerStatus.ACTIVE).length,
      inactiveCustomers: customers.filter(c => c.status === CustomerStatus.INACTIVE).length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalPurchases, 0),
      averagePurchaseValue: customers.reduce((sum, c) => sum + c.totalPurchases, 0) / customers.length,
      topCustomers: customers
        .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
        .slice(0, 5),
    };
  },

  async getPurchaseHistory(customerId: string): Promise<PurchaseHistory[]> {
    await delay(500);
    return mockPurchaseHistory.filter(p => p.customerId === customerId);
  },

  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    await delay(700);
    const newCustomer: Customer = {
      ...customerData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  },

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    await delay(500);
    const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }
    
    mockCustomers[customerIndex] = {
      ...mockCustomers[customerIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return mockCustomers[customerIndex];
  },

  async searchCustomers(organizationId: string, query: string): Promise<Customer[]> {
    await delay(400);
    const lowercaseQuery = query.toLowerCase();
    return mockCustomers.filter(
      c =>
        c.organizationId === organizationId &&
        (c.name.toLowerCase().includes(lowercaseQuery) ||
          c.email?.toLowerCase().includes(lowercaseQuery) ||
          c.phone?.includes(query) ||
          c.company?.toLowerCase().includes(lowercaseQuery))
    );
  },
};
