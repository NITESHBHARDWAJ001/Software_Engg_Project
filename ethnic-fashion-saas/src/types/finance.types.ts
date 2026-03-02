export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionCategory {
  SALES = 'SALES',
  EXHIBITION = 'EXHIBITION',
  INVENTORY = 'INVENTORY',
  SALARY = 'SALARY',
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  MARKETING = 'MARKETING',
  TRAVEL = 'TRAVEL',
  EQUIPMENT = 'EQUIPMENT',
  OTHER = 'OTHER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export interface FinancialTransaction {
  id: string;
  organizationId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  date: string;
  reference?: string;
  relatedCustomerId?: string;
  relatedExhibitionId?: string;
  relatedInvoiceId?: string;
  attachments?: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxPercentage: number;
  discount: number;
  total: number;
  amountPaid: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  createdBy: string;
  createdAt: string;
  paidAt?: string;
}

export interface InvoiceItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  pendingInvoices: number;
  pendingAmount: number;
}

export interface CashFlowData {
  month: string;
  income: number;
  expense: number;
  profit: number;
}
