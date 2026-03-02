// Mock data service for Finance Management
import { generateId, formatCurrency } from '../../utils/helpers';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Transaction {
  id: string;
  organizationId: string;
  type: TransactionType;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  reference: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface CashFlowData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  overdueInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
}

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    organizationId: 'org-1',
    invoiceNumber: 'INV-2026-001',
    customerId: 'cust-1',
    customerName: 'Priya Sharma',
    amount: 125000,
    tax: 22500,
    totalAmount: 147500,
    status: InvoiceStatus.PAID,
    issueDate: new Date('2026-02-01').toISOString(),
    dueDate: new Date('2026-02-15').toISOString(),
    paidDate: new Date('2026-02-12').toISOString(),
    items: [
      { description: 'Banarasi Silk Sarees (10 pcs)', quantity: 10, unitPrice: 8500, amount: 85000 },
      { description: 'Designer Lehenga (1 pc)', quantity: 1, unitPrice: 35000, amount: 35000 },
      { description: 'Silk Dupatta (2 pcs)', quantity: 2, unitPrice: 2500, amount: 5000 },
    ],
    notes: 'Paid in full via UPI. Thank you for your business!',
    createdAt: new Date('2026-02-01').toISOString(),
    updatedAt: new Date('2026-02-12').toISOString(),
  },
  {
    id: 'inv-2',
    organizationId: 'org-1',
    invoiceNumber: 'INV-2026-002',
    customerId: 'cust-2',
    customerName: 'Rajesh Kumar - Fashion Hub',
    amount: 450000,
    tax: 81000,
    totalAmount: 531000,
    status: InvoiceStatus.PENDING,
    issueDate: new Date('2026-02-10').toISOString(),
    dueDate: new Date('2026-03-10').toISOString(),
    items: [
      { description: 'Chanderi Cotton Sarees (50 pcs)', quantity: 50, unitPrice: 4500, amount: 225000 },
      { description: 'Anarkali Suits (30 pcs)', quantity: 30, unitPrice: 6500, amount: 195000 },
      { description: 'Cotton Kurtis (20 pcs)', quantity: 20, unitPrice: 1500, amount: 30000 },
    ],
    notes: 'Wholesale order. Net 30 payment terms.',
    createdAt: new Date('2026-02-10').toISOString(),
    updatedAt: new Date('2026-02-10').toISOString(),
  },
  {
    id: 'inv-3',
    organizationId: 'org-1',
    invoiceNumber: 'INV-2026-003',
    customerId: 'cust-3',
    customerName: 'Anita Desai',
    amount: 95000,
    tax: 17100,
    totalAmount: 112100,
    status: InvoiceStatus.OVERDUE,
    issueDate: new Date('2026-01-15').toISOString(),
    dueDate: new Date('2026-02-15').toISOString(),
    items: [
      { description: 'Kanjivaram Silk Sarees (6 pcs)', quantity: 6, unitPrice: 15000, amount: 90000 },
      { description: 'Silk Blouse (2 pcs)', quantity: 2, unitPrice: 2500, amount: 5000 },
    ],
    notes: 'Payment overdue. Follow up required.',
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date('2026-02-28').toISOString(),
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 'txn-1',
    organizationId: 'org-1',
    type: TransactionType.INCOME,
    amount: 147500,
    category: 'Sales',
    paymentMethod: PaymentMethod.UPI,
    reference: 'INV-2026-001',
    description: 'Payment received from Priya Sharma',
    date: new Date('2026-02-12').toISOString(),
    createdAt: new Date('2026-02-12').toISOString(),
  },
  {
    id: 'txn-2',
    organizationId: 'org-1',
    type: TransactionType.EXPENSE,
    amount: 85000,
    category: 'Inventory Purchase',
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    reference: 'PO-2026-015',
    description: 'Purchased Banarasi Sarees from supplier',
    date: new Date('2026-02-05').toISOString(),
    createdAt: new Date('2026-02-05').toISOString(),
  },
  {
    id: 'txn-3',
    organizationId: 'org-1',
    type: TransactionType.EXPENSE,
    amount: 12000,
    category: 'Exhibition Expenses',
    paymentMethod: PaymentMethod.CARD,
    reference: 'EXH-2026-001',
    description: 'Booth rental for Mumbai Fashion Week',
    date: new Date('2026-02-15').toISOString(),
    createdAt: new Date('2026-02-15').toISOString(),
  },
  {
    id: 'txn-4',
    organizationId: 'org-1',
    type: TransactionType.INCOME,
    amount: 45000,
    category: 'Sales',
    paymentMethod: PaymentMethod.CASH,
    reference: 'CASH-001',
    description: 'Direct store sales',
    date: new Date('2026-02-20').toISOString(),
    createdAt: new Date('2026-02-20').toISOString(),
  },
  {
    id: 'txn-5',
    organizationId: 'org-1',
    type: TransactionType.EXPENSE,
    amount: 8500,
    category: 'Marketing',
    paymentMethod: PaymentMethod.UPI,
    reference: 'MKT-001',
    description: 'Social media advertising',
    date: new Date('2026-02-18').toISOString(),
    createdAt: new Date('2026-02-18').toISOString(),
  },
];

const mockCashFlowData: CashFlowData[] = [
  { month: 'Sep', income: 850000, expense: 520000, net: 330000 },
  { month: 'Oct', income: 920000, expense: 580000, net: 340000 },
  { month: 'Nov', income: 1050000, expense: 620000, net: 430000 },
  { month: 'Dec', income: 1280000, expense: 750000, net: 530000 },
  { month: 'Jan', income: 980000, expense: 590000, net: 390000 },
  { month: 'Feb', income: 1150000, expense: 680000, net: 470000 },
];

export const financeService = {
  async getAllInvoices(organizationId: string): Promise<Invoice[]> {
    await delay(600);
    return mockInvoices.filter(inv => inv.organizationId === organizationId);
  },

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    await delay(400);
    return mockInvoices.find(inv => inv.id === invoiceId) || null;
  },

  async getInvoicesByStatus(
    organizationId: string,
    status: InvoiceStatus
  ): Promise<Invoice[]> {
    await delay(500);
    return mockInvoices.filter(
      inv => inv.organizationId === organizationId && inv.status === status
    );
  },

  async getAllTransactions(organizationId: string): Promise<Transaction[]> {
    await delay(600);
    return mockTransactions.filter(txn => txn.organizationId === organizationId);
  },

  async getTransactionsByType(
    organizationId: string,
    type: TransactionType
  ): Promise<Transaction[]> {
    await delay(500);
    return mockTransactions.filter(
      txn => txn.organizationId === organizationId && txn.type === type
    );
  },

  async getCashFlowData(organizationId: string): Promise<CashFlowData[]> {
    await delay(500);
    return mockCashFlowData;
  },

  async getFinanceStats(organizationId: string): Promise<FinanceStats> {
    await delay(600);
    const invoices = mockInvoices.filter(inv => inv.organizationId === organizationId);
    const transactions = mockTransactions.filter(txn => txn.organizationId === organizationId);

    const totalRevenue = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingInvoices = invoices.filter(i => i.status === InvoiceStatus.PENDING);
    const overdueInvoices = invoices.filter(i => i.status === InvoiceStatus.OVERDUE);

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      pendingAmount: pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
      overdueAmount: overdueInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
    };
  },

  async createInvoice(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Invoice> {
    await delay(700);
    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockInvoices.push(newInvoice);
    return newInvoice;
  },

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
    await delay(500);
    const invoiceIndex = mockInvoices.findIndex(i => i.id === invoiceId);
    if (invoiceIndex === -1) {
      throw new Error('Invoice not found');
    }

    mockInvoices[invoiceIndex] = {
      ...mockInvoices[invoiceIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return mockInvoices[invoiceIndex];
  },

  async createTransaction(
    transactionData: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<Transaction> {
    await delay(500);
    const newTransaction: Transaction = {
      ...transactionData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    mockTransactions.push(newTransaction);
    return newTransaction;
  },
};
