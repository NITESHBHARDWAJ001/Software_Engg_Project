import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  FiAlertCircle,
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiEye,
  FiFileText,
  FiPlus,
  FiTrendingDown,
  FiTrendingUp,
  FiXCircle,
} from 'react-icons/fi';
import {
  financeApiService,
  FinanceInvoice,
  FinanceStats,
  FinanceTrend,
  InvoiceStatus,
  LedgerEntry,
  LedgerEntryType,
} from '../../../services/api/financeService';
import { customerApiService, type CustomerStats } from '../../../services/api/customerService';
import { exhibitionService } from '../../../services/api/exhibitionService';
import {
  inventoryApiService,
  type InventoryMovementRecord,
  type InventoryRecord,
  type InventoryStats,
} from '../../../services/api/inventoryService';
import { downloadFile, formatCurrency, formatDate } from '../../../utils/helpers';
import { exportToExcel, exportToPDF, formatCurrencyForExport, formatDateForExport } from '../../../utils/exportUtils';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

type CashFlowData = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

type ActiveTab = 'dashboard' | 'invoices' | 'transactions' | 'reports';

type RevenueSectionBreakdown = {
  section: string;
  value: number;
};

type SoldStockSummary = {
  itemId: string;
  itemName: string;
  sku: string;
  category: string;
  soldUnits: number;
  estimatedRevenue: number;
  latestSoldAt: string;
};

type BusinessReportTemplateData = {
  generatedOn: string;
  customerStats: CustomerStats | null;
  inventoryStats: InventoryStats | null;
  topRevenueSections: RevenueSectionBreakdown[];
  soldStockSummary: SoldStockSummary[];
  topInventoryItems: InventoryRecord[];
  outstandingInvoiceCount: number;
  exhibitionTotals: {
    totalExhibitions: number;
    totalLeads: number;
    totalRevenue: number;
    conversionRate: number;
  };
};

type NewInvoiceForm = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  notes: string;
};

type NewLedgerForm = {
  type: LedgerEntryType;
  amount: number;
  entryDate: string;
  category: string;
  description: string;
  invoiceId: string;
};

const toMonthLabel = (period: string) => {
  const parts = period.split('-');
  if (parts.length < 2) return period;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return period;
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' });
};

const csvEscape = (value: string | number | null | undefined) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const FinancePage: React.FC = () => {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [trends, setTrends] = useState<FinanceTrend[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryRecord[]>([]);
  const [soldMovements, setSoldMovements] = useState<InventoryMovementRecord[]>([]);
  const [exhibitionTotals, setExhibitionTotals] = useState<BusinessReportTemplateData['exhibitionTotals']>({
    totalExhibitions: 0,
    totalLeads: 0,
    totalRevenue: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingLedger, setSavingLedger] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  
  // Chart refs for PDF export
  const cashFlowChartRef = useRef<HTMLDivElement>(null);
  const incomeExpenseChartRef = useRef<HTMLDivElement>(null);
  const invoiceStatusChartRef = useRef<HTMLDivElement>(null);
  const [invoiceForm, setInvoiceForm] = useState<NewInvoiceForm>({
    invoiceNumber: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    currency: 'INR',
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    notes: '',
  });
  const [ledgerForm, setLedgerForm] = useState<NewLedgerForm>({
    type: 'EXPENSE',
    amount: 0,
    entryDate: new Date().toISOString().slice(0, 10),
    category: '',
    description: '',
    invoiceId: '',
  });

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [statsData, invoicesData, ledgerData, trendData] = await Promise.all([
        financeApiService.getFinanceStats(),
        financeApiService.getInvoices(),
        financeApiService.getLedger(),
        financeApiService.getTrends('month'),
      ]);

      const [customerStatsData, inventoryStatsData, inventoryData, movementData, exhibitionStatsData] = await Promise.all([
        customerApiService.stats(),
        inventoryApiService.stats(),
        inventoryApiService.list(),
        inventoryApiService.listMovements({ changeType: 'OUT', pageSize: 200 }),
        exhibitionService.getExhibitionStats(),
      ]);

      setStats(statsData);
      setInvoices(invoicesData);
      setTransactions(ledgerData);
      setTrends(trendData);
      setCustomerStats(customerStatsData);
      setInventoryStats(inventoryStatsData);
      setInventoryItems(inventoryData);
      setSoldMovements(movementData);
      setExhibitionTotals({
        totalExhibitions: exhibitionStatsData.totalExhibitions,
        totalLeads: exhibitionStatsData.totalLeads,
        totalRevenue: exhibitionStatsData.totalRevenue,
        conversionRate: exhibitionStatsData.conversionRate,
      });
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const cashFlowData = useMemo<CashFlowData[]>(
    () =>
      [...trends]
        .sort((a, b) => a.period.localeCompare(b.period))
        .slice(-6)
        .map((item) => ({
          month: toMonthLabel(item.period),
          income: item.income,
          expense: item.expense,
          net: item.net,
        })),
    [trends],
  );

  const filteredInvoices = useMemo(
    () => invoices.filter((inv) => filterStatus === 'all' || inv.status === filterStatus),
    [invoices, filterStatus],
  );

  const revenueBySection = useMemo<RevenueSectionBreakdown[]>(() => {
    const grouped = new Map<string, number>();

    transactions
      .filter((entry) => entry.type === 'INCOME')
      .forEach((entry) => {
        const section = entry.category?.trim() || 'Uncategorized Income';
        grouped.set(section, (grouped.get(section) ?? 0) + entry.amount);
      });

    if (exhibitionTotals.totalRevenue > 0) {
      grouped.set('Exhibitions', (grouped.get('Exhibitions') ?? 0) + exhibitionTotals.totalRevenue);
    }

    return [...grouped.entries()]
      .map(([section, value]) => ({ section, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, exhibitionTotals.totalRevenue]);

  const soldStockSummary = useMemo<SoldStockSummary[]>(() => {
    const grouped = new Map<string, SoldStockSummary>();

    soldMovements
      .filter((movement) => movement.changeType === 'OUT')
      .forEach((movement) => {
        const key = movement.itemId;
        const soldUnits = Math.abs(movement.quantity);
        const existing = grouped.get(key);
        const itemName = movement.item?.name || 'Unknown Item';
        const sku = movement.item?.sku || '-';
        const category = movement.item?.category || 'Uncategorized';
        const sellingPrice = movement.item?.sellingPrice || 0;

        if (!existing) {
          grouped.set(key, {
            itemId: key,
            itemName,
            sku,
            category,
            soldUnits,
            estimatedRevenue: soldUnits * sellingPrice,
            latestSoldAt: movement.createdAt,
          });
          return;
        }

        existing.soldUnits += soldUnits;
        existing.estimatedRevenue += soldUnits * sellingPrice;
        if (new Date(movement.createdAt).getTime() > new Date(existing.latestSoldAt).getTime()) {
          existing.latestSoldAt = movement.createdAt;
        }
      });

    return [...grouped.values()].sort((a, b) => b.soldUnits - a.soldUnits);
  }, [soldMovements]);

  const reportTemplateData = useMemo<BusinessReportTemplateData>(() => ({
    generatedOn: formatDateForExport(new Date()),
    customerStats,
    inventoryStats,
    topRevenueSections: revenueBySection.slice(0, 8),
    soldStockSummary: soldStockSummary.slice(0, 10),
    topInventoryItems: [...inventoryItems]
      .sort((a, b) => b.currentStock * b.sellingPrice - a.currentStock * a.sellingPrice)
      .slice(0, 8),
    outstandingInvoiceCount: invoices.filter((invoice) => invoice.status === 'PENDING' || invoice.status === 'OVERDUE').length,
    exhibitionTotals,
  }), [
    customerStats,
    inventoryStats,
    revenueBySection,
    soldStockSummary,
    inventoryItems,
    invoices,
    exhibitionTotals,
  ]);

  const getInvoiceStatusColor = (status: InvoiceStatus): 'info' | 'warning' | 'success' | 'danger' => {
    if (status === 'DRAFT') return 'info';
    if (status === 'PENDING') return 'warning';
    if (status === 'PAID') return 'success';
    return 'danger';
  };

  const getInvoiceStatusIcon = (status: InvoiceStatus) => {
    if (status === 'PAID') return FiCheckCircle;
    if (status === 'PENDING') return FiClock;
    if (status === 'OVERDUE') return FiAlertCircle;
    if (status === 'DRAFT') return FiFileText;
    return FiXCircle;
  };

  const invoiceTotal = useMemo(
    () => Math.max(0, invoiceForm.subtotal + invoiceForm.taxAmount - invoiceForm.discountAmount),
    [invoiceForm.subtotal, invoiceForm.taxAmount, invoiceForm.discountAmount],
  );

  const createInvoice = async () => {
    if (!invoiceForm.invoiceNumber.trim()) return;

    setSavingInvoice(true);
    try {
      await financeApiService.createInvoice({
        invoiceNumber: invoiceForm.invoiceNumber.trim(),
        issueDate: new Date(invoiceForm.issueDate).toISOString(),
        dueDate: invoiceForm.dueDate ? new Date(invoiceForm.dueDate).toISOString() : undefined,
        currency: invoiceForm.currency.trim().toUpperCase(),
        subtotal: invoiceForm.subtotal,
        taxAmount: invoiceForm.taxAmount,
        discountAmount: invoiceForm.discountAmount,
        totalAmount: invoiceTotal,
        notes: invoiceForm.notes.trim() || undefined,
      });

      setShowInvoiceForm(false);
      setInvoiceForm({
        invoiceNumber: '',
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        currency: 'INR',
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        notes: '',
      });
      await loadFinanceData();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setSavingInvoice(false);
    }
  };

  const createLedgerEntry = async () => {
    if (ledgerForm.amount <= 0 || !ledgerForm.entryDate) return;

    setSavingLedger(true);
    try {
      await financeApiService.createLedgerEntry({
        type: ledgerForm.type,
        amount: ledgerForm.amount,
        entryDate: new Date(ledgerForm.entryDate).toISOString(),
        category: ledgerForm.category.trim() || undefined,
        description: ledgerForm.description.trim() || undefined,
        invoiceId: ledgerForm.invoiceId || undefined,
      });

      setShowLedgerForm(false);
      setLedgerForm({
        type: 'EXPENSE',
        amount: 0,
        entryDate: new Date().toISOString().slice(0, 10),
        category: '',
        description: '',
        invoiceId: '',
      });
      await loadFinanceData();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setSavingLedger(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      const paidAt = status === 'PAID' ? new Date().toISOString() : undefined;
      const updated = await financeApiService.updateInvoiceStatus(invoiceId, status, paidAt);
      setInvoices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (selectedInvoice?.id === updated.id) {
        setSelectedInvoice(updated);
      }
      await loadFinanceData();
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };

  const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) => {
    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map(csvEscape).join(',')),
    ].join('\n');

    downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
  };

  const downloadInvoiceCsv = (invoice: FinanceInvoice) => {
    downloadCsv(
      `invoice-${invoice.invoiceNumber}.csv`,
      ['Invoice Number', 'Status', 'Issue Date', 'Due Date', 'Currency', 'Subtotal', 'Tax', 'Discount', 'Total', 'Paid At', 'Notes'],
      [[
        invoice.invoiceNumber,
        invoice.status,
        invoice.issueDate,
        invoice.dueDate ?? '',
        invoice.currency,
        invoice.subtotal,
        invoice.taxAmount,
        invoice.discountAmount,
        invoice.totalAmount,
        invoice.paidAt ?? '',
        invoice.notes ?? '',
      ]],
    );
    toast.success(`Downloaded ${invoice.invoiceNumber}`);
  };

  const downloadReport = (type: 'profit-loss' | 'cash-flow' | 'outstanding') => {
    const now = new Date().toISOString();

    if (type === 'profit-loss') {
      downloadCsv(
        `profit-loss-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Generated At', 'Total Revenue', 'Total Expenses', 'Net Profit', 'Profit Margin %'],
        [[
          now,
          stats?.totalRevenue ?? 0,
          stats?.totalExpenses ?? 0,
          stats?.netProfit ?? 0,
          stats && stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(2) : '0.00',
        ]],
      );
      toast.success('Downloaded Profit & Loss report');
      return;
    }

    if (type === 'cash-flow') {
      downloadCsv(
        `cash-flow-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Period', 'Income', 'Expense', 'Net'],
        cashFlowData.map((row) => [row.month, row.income, row.expense, row.net]),
      );
      toast.success('Downloaded Cash Flow report');
      return;
    }

    downloadCsv(
      `outstanding-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Invoice Number', 'Status', 'Issue Date', 'Due Date', 'Total Amount'],
      invoices
        .filter((invoice) => invoice.status === 'PENDING' || invoice.status === 'OVERDUE')
        .map((invoice) => [invoice.invoiceNumber, invoice.status, invoice.issueDate, invoice.dueDate ?? '', invoice.totalAmount]),
    );
    toast.success('Downloaded Outstanding Invoices report');
  };

  const exportReportToExcel = (type: 'profit-loss' | 'cash-flow' | 'outstanding') => {
    const dateStr = formatDateForExport(new Date());

    if (type === 'profit-loss') {
      const data = [{
        'Report Date': dateStr,
        'Total Revenue': stats?.totalRevenue ?? 0,
        'Total Expenses': stats?.totalExpenses ?? 0,
        'Net Profit': stats?.netProfit ?? 0,
        'Profit Margin %': stats && stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(2) : '0.00',
      }];

      exportToExcel(
        [{ name: 'Profit & Loss', data }],
        `profit-loss-${dateStr}`
      );
      toast.success('Exported Profit & Loss as Excel');
      return;
    }

    if (type === 'cash-flow') {
      const data = cashFlowData.map((row) => ({
        'Period': row.month,
        'Income': row.income,
        'Expense': row.expense,
        'Net': row.net,
      }));

      exportToExcel(
        [{ name: 'Cash Flow', data, headers: ['Period', 'Income', 'Expense', 'Net'] }],
        `cash-flow-${dateStr}`
      );
      toast.success('Exported Cash Flow as Excel');
      return;
    }

    const outstandingInvoices = invoices
      .filter((invoice) => invoice.status === 'PENDING' || invoice.status === 'OVERDUE')
      .map((invoice) => ({
        'Invoice Number': invoice.invoiceNumber,
        'Status': invoice.status,
        'Issue Date': formatDateForExport(invoice.issueDate),
        'Due Date': invoice.dueDate ? formatDateForExport(invoice.dueDate) : '',
        'Total Amount': invoice.totalAmount,
      }));

    exportToExcel(
      [{ name: 'Outstanding', data: outstandingInvoices }],
      `outstanding-${dateStr}`
    );
    toast.success('Exported Outstanding Invoices as Excel');
  };

  const exportReportToPDF = async (type: 'profit-loss' | 'cash-flow' | 'outstanding') => {
    const dateStr = formatDateForExport(new Date());
    const chartRefs: Array<{ ref: HTMLElement; title: string }> = [];

    if (type === 'profit-loss' && stats) {
      const data = [{
        'Metric': 'Total Revenue',
        'Amount': formatCurrencyForExport(stats.totalRevenue),
      }, {
        'Metric': 'Total Expenses',
        'Amount': formatCurrencyForExport(stats.totalExpenses),
      }, {
        'Metric': 'Net Profit',
        'Amount': formatCurrencyForExport(stats.netProfit),
      }, {
        'Metric': 'Profit Margin',
        'Amount': stats.totalRevenue > 0 ? `${((stats.netProfit / stats.totalRevenue) * 100).toFixed(2)}%` : '0%',
      }];

      if (incomeExpenseChartRef.current) {
        chartRefs.push({
          ref: incomeExpenseChartRef.current,
          title: 'Revenue vs Expenses',
        });
      }

      await exportToPDF({
        filename: `profit-loss-${dateStr}`,
        title: 'Profit & Loss Report',
        subtitle: `Generated on ${dateStr}`,
        data,
        headers: ['Metric', 'Amount'],
        chartRefs,
      });
      toast.success('Exported Profit & Loss as PDF');
      return;
    }

    if (type === 'cash-flow') {
      const data = cashFlowData.map((row) => ({
        'Period': row.month,
        'Income': formatCurrencyForExport(row.income),
        'Expense': formatCurrencyForExport(row.expense),
        'Net': formatCurrencyForExport(row.net),
      }));

      if (cashFlowChartRef.current) {
        chartRefs.push({
          ref: cashFlowChartRef.current,
          title: 'Cash Flow Trend',
        });
      }

      await exportToPDF({
        filename: `cash-flow-${dateStr}`,
        title: 'Cash Flow Report',
        subtitle: `Generated on ${dateStr}`,
        data,
        headers: ['Period', 'Income', 'Expense', 'Net'],
        chartRefs,
      });
      toast.success('Exported Cash Flow as PDF');
      return;
    }

    const outstandingInvoices = invoices
      .filter((invoice) => invoice.status === 'PENDING' || invoice.status === 'OVERDUE')
      .map((invoice) => ({
        'Invoice Number': invoice.invoiceNumber,
        'Status': invoice.status,
        'Issue Date': formatDateForExport(invoice.issueDate),
        'Due Date': invoice.dueDate ? formatDateForExport(invoice.dueDate) : '-',
        'Amount': formatCurrencyForExport(invoice.totalAmount),
      }));

    if (invoiceStatusChartRef.current) {
      chartRefs.push({
        ref: invoiceStatusChartRef.current,
        title: 'Invoice Status Distribution',
      });
    }

    await exportToPDF({
      filename: `outstanding-${dateStr}`,
      title: 'Outstanding Invoices Report',
      subtitle: `Generated on ${dateStr}`,
      data: outstandingInvoices,
      headers: ['Invoice Number', 'Status', 'Issue Date', 'Due Date', 'Amount'],
      chartRefs,
    });
    toast.success('Exported Outstanding Invoices as PDF');
  };

  const exportTemplateReportToExcel = () => {
    const overviewSheet = [{
      'Report Date': reportTemplateData.generatedOn,
      'Total Customers': reportTemplateData.customerStats?.totalCustomers ?? 0,
      'Active Customers': reportTemplateData.customerStats?.activeCustomers ?? 0,
      'Total Revenue': stats?.totalRevenue ?? 0,
      'Total Expenses': stats?.totalExpenses ?? 0,
      'Net Profit': stats?.netProfit ?? 0,
      'Total Inventory Value': reportTemplateData.inventoryStats?.totalValue ?? 0,
      'Outstanding Invoices': reportTemplateData.outstandingInvoiceCount,
      'Exhibitions Revenue': reportTemplateData.exhibitionTotals.totalRevenue,
    }];

    const sectionSheet = reportTemplateData.topRevenueSections.map((row) => ({
      Section: row.section,
      Revenue: row.value,
    }));

    const soldSheet = reportTemplateData.soldStockSummary.map((row) => ({
      Item: row.itemName,
      SKU: row.sku,
      Category: row.category,
      'Sold Units': row.soldUnits,
      'Estimated Revenue': row.estimatedRevenue,
      'Latest Sold': formatDateForExport(row.latestSoldAt),
    }));

    const inventorySheet = reportTemplateData.topInventoryItems.map((row) => ({
      Item: row.name,
      SKU: row.sku,
      Category: row.category,
      Stock: row.currentStock,
      'Sell Price': row.sellingPrice,
      'Stock Value': row.currentStock * row.sellingPrice,
    }));

    exportToExcel([
      { name: 'Executive Summary', data: overviewSheet },
      { name: 'Revenue By Section', data: sectionSheet },
      { name: 'Sold Stock', data: soldSheet },
      { name: 'Top Inventory', data: inventorySheet },
    ], `business-template-report-${formatDateForExport(new Date())}`);

    toast.success('Exported business template report as Excel');
  };

  const exportTemplateReportToPDF = async () => {
    const totalSoldUnits = reportTemplateData.soldStockSummary.reduce((sum, row) => sum + row.soldUnits, 0);
    const estimatedSalesFromStock = reportTemplateData.soldStockSummary.reduce((sum, row) => sum + row.estimatedRevenue, 0);
    const paidInvoicesCount = invoices.filter((invoice) => invoice.status === 'PAID').length;

    const templateRows: Array<{ Section: string; Metric: string; Value: string }> = [
      { Section: 'Customers', Metric: 'Total Customers', Value: String(reportTemplateData.customerStats?.totalCustomers ?? 0) },
      { Section: 'Customers', Metric: 'Active Customers', Value: String(reportTemplateData.customerStats?.activeCustomers ?? 0) },
      { Section: 'Customers', Metric: 'Inactive Customers', Value: String(reportTemplateData.customerStats?.inactiveCustomers ?? 0) },
      { Section: 'Sales', Metric: 'Total Sold Units', Value: String(totalSoldUnits) },
      { Section: 'Sales', Metric: 'Estimated Sales Revenue (from stock out)', Value: formatCurrencyForExport(estimatedSalesFromStock) },
      { Section: 'Finance', Metric: 'Total Revenue', Value: formatCurrencyForExport(stats?.totalRevenue ?? 0) },
      { Section: 'Finance', Metric: 'Total Expenses', Value: formatCurrencyForExport(stats?.totalExpenses ?? 0) },
      { Section: 'Finance', Metric: 'Net Profit', Value: formatCurrencyForExport(stats?.netProfit ?? 0) },
      { Section: 'Finance', Metric: 'Paid Invoices', Value: String(paidInvoicesCount) },
      { Section: 'Finance', Metric: 'Outstanding Invoices', Value: String(reportTemplateData.outstandingInvoiceCount) },
      { Section: 'Finance', Metric: 'Outstanding Amount', Value: formatCurrencyForExport((stats?.pendingAmount ?? 0) + (stats?.overdueAmount ?? 0)) },
      { Section: 'Inventory', Metric: 'Total Inventory Value', Value: formatCurrencyForExport(reportTemplateData.inventoryStats?.totalValue ?? 0) },
      { Section: 'Inventory', Metric: 'Low Stock Items', Value: String(reportTemplateData.inventoryStats?.lowStockItems ?? 0) },
      { Section: 'Inventory', Metric: 'Out of Stock Items', Value: String(reportTemplateData.inventoryStats?.outOfStockItems ?? 0) },
      { Section: 'Exhibitions', Metric: 'Total Exhibitions', Value: String(reportTemplateData.exhibitionTotals.totalExhibitions) },
      { Section: 'Exhibitions', Metric: 'Total Leads', Value: String(reportTemplateData.exhibitionTotals.totalLeads) },
      { Section: 'Exhibitions', Metric: 'Conversion Rate', Value: `${reportTemplateData.exhibitionTotals.conversionRate.toFixed(2)}%` },
      { Section: 'Exhibitions', Metric: 'Revenue', Value: formatCurrencyForExport(reportTemplateData.exhibitionTotals.totalRevenue) },
    ];

    reportTemplateData.topRevenueSections.slice(0, 5).forEach((row, index) => {
      templateRows.push({
        Section: 'Revenue Sources',
        Metric: `Top Source ${index + 1}: ${row.section}`,
        Value: formatCurrencyForExport(row.value),
      });
    });

    reportTemplateData.soldStockSummary.slice(0, 5).forEach((row, index) => {
      templateRows.push({
        Section: 'Top Sold Items',
        Metric: `${index + 1}. ${row.itemName} (${row.soldUnits} units)`,
        Value: formatCurrencyForExport(row.estimatedRevenue),
      });
    });

    const chartRefs: Array<{ ref: HTMLElement; title: string }> = [];
    if (incomeExpenseChartRef.current) {
      chartRefs.push({ ref: incomeExpenseChartRef.current, title: 'Revenue vs Expense Snapshot' });
    }
    if (cashFlowChartRef.current) {
      chartRefs.push({ ref: cashFlowChartRef.current, title: 'Cash Flow Snapshot' });
    }
    if (invoiceStatusChartRef.current) {
      chartRefs.push({ ref: invoiceStatusChartRef.current, title: 'Invoice Status Snapshot' });
    }

    await exportToPDF({
      filename: `business-template-report-${formatDateForExport(new Date())}`,
      title: 'Business Performance Template Report',
      subtitle: `Generated on ${reportTemplateData.generatedOn}`,
      data: templateRows,
      headers: ['Section', 'Metric', 'Value'],
      chartRefs,
    });

    toast.success('Exported business template report as PDF');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (selectedInvoice) {
    const StatusIcon = getInvoiceStatusIcon(selectedInvoice.status);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedInvoice.invoiceNumber}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getInvoiceStatusColor(selectedInvoice.status)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {selectedInvoice.status}
                </Badge>
                <span className="text-sm text-gray-600">
                  Issued: {formatDate(new Date(selectedInvoice.issueDate))}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadInvoiceCsv(selectedInvoice)}>
              <FiDownload className="w-4 h-4 mr-2" />
              Download
            </Button>
            {selectedInvoice.status !== 'PAID' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => updateInvoiceStatus(selectedInvoice.id, 'PAID')}
              >
                <FiCheckCircle className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="font-semibold text-gray-900">{selectedInvoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Currency</p>
                <p className="font-semibold text-gray-900">{selectedInvoice.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Issue Date</p>
                <p className="font-semibold text-gray-900">{formatDate(new Date(selectedInvoice.issueDate))}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-semibold text-gray-900">
                  {selectedInvoice.dueDate ? formatDate(new Date(selectedInvoice.dueDate)) : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.subtotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tax</p>
                <p className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.taxAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Discount</p>
                <p className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.discountAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-semibold text-primary text-xl">{formatCurrency(selectedInvoice.totalAmount)}</p>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 font-semibold mb-1">Notes</p>
                <p className="text-sm text-gray-800">{selectedInvoice.notes}</p>
              </div>
            )}

            {selectedInvoice.paidAt && (
              <div className="p-4 bg-success/10 rounded-lg text-sm text-success font-semibold">
                Paid on {formatDate(new Date(selectedInvoice.paidAt))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
          <p className="text-gray-600 mt-1">Track invoices, ledger transactions, and cash flow</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowLedgerForm((prev) => !prev)}>
            <FiCreditCard className="w-4 h-4 mr-2" />
            {showLedgerForm ? 'Close Transaction Form' : 'New Transaction'}
          </Button>
          <Button variant="primary" onClick={() => setShowInvoiceForm((prev) => !prev)}>
            <FiPlus className="w-4 h-4 mr-2" />
            {showInvoiceForm ? 'Close Invoice Form' : 'New Invoice'}
          </Button>
        </div>
      </div>

      {showInvoiceForm && (
        <Card>
          <CardHeader title="Create Invoice" subtitle="Add a new invoice with items and payment details" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Invoice Details Section */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice Details</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Number</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="INV-001"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. INR"
                  value={invoiceForm.currency}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, currency: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={invoiceForm.issueDate}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              {/* Amount Section */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Amount Details</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtotal</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                  value={invoiceForm.subtotal}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, subtotal: Number(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Amount</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                  value={invoiceForm.taxAmount}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, taxAmount: Number(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Amount</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                  value={invoiceForm.discountAmount}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, discountAmount: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Calculated Total:</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(invoiceTotal)}</span>
              </div>
              
              {/* Notes Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Add any additional notes or special instructions"
                  rows={3}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInvoiceForm(false)}>Cancel</Button>
                <Button variant="primary" onClick={createInvoice} disabled={savingInvoice}>
                  {savingInvoice ? 'Creating...' : 'Create Invoice'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showLedgerForm && (
        <Card>
          <CardHeader title="Create Transaction" subtitle="Record income, expenses, or ledger adjustments" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={ledgerForm.type}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, type: e.target.value as LedgerEntryType }))}
                >
                  <option value="INCOME">INCOME</option>
                  <option value="EXPENSE">EXPENSE</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                  value={ledgerForm.amount}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, amount: Number(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Entry Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={ledgerForm.entryDate}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, entryDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. Sales, Operating Expense"
                  value={ledgerForm.category}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Linked Invoice (Optional)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter invoice ID if applicable"
                  value={ledgerForm.invoiceId}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, invoiceId: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Add details about this transaction"
                  rows={3}
                  value={ledgerForm.description}
                  onChange={(e) => setLedgerForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLedgerForm(false)}>Cancel</Button>
                <Button variant="primary" onClick={createLedgerEntry} disabled={savingLedger}>
                  {savingLedger ? 'Creating...' : 'Create Transaction'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <FiTrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-gray-600">From ledger income</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalExpenses)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <FiTrendingDown className="w-4 h-4 text-danger" />
                    <span className="text-xs text-gray-600">From ledger expenses</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                  <FiTrendingDown className="w-6 h-6 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(stats.netProfit)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-gray-600">
                      {stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1) : '0.0'}% margin
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending + Overdue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.pendingAmount + stats.overdueAmount)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <FiAlertCircle className="w-4 h-4 text-warning" />
                    <span className="text-xs text-warning font-semibold">{stats.overdueInvoices} overdue</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <FiFileText className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2 border-b">
        {(['dashboard', 'invoices', 'transactions', 'reports'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'dashboard' ? 'Dashboard' : tab === 'invoices' ? `Invoices (${invoices.length})` : tab === 'transactions' ? `Transactions (${transactions.length})` : 'Reports'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Cash Flow (Last 6 Periods)" />
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#06A77D" strokeWidth={2} name="Income" dot={{ fill: '#06A77D', r: 4 }} />
                  <Line type="monotone" dataKey="expense" stroke="#E63946" strokeWidth={2} name="Expense" dot={{ fill: '#E63946', r: 4 }} />
                  <Line type="monotone" dataKey="net" stroke="#7B2CBF" strokeWidth={2} name="Net" dot={{ fill: '#7B2CBF', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Recent Income vs Expense" />
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cashFlowData.slice(-3)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="income" fill="#06A77D" name="Income" />
                  <Bar dataKey="expense" fill="#E63946" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'invoices' && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Invoice Section</h2>
            <p className="text-sm text-gray-600">Manage invoice lifecycle and export individual invoice copies.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={filterStatus === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setFilterStatus('all')}>
              All ({invoices.length})
            </Button>
            <Button variant={filterStatus === 'DRAFT' ? 'primary' : 'outline'} size="sm" onClick={() => setFilterStatus('DRAFT')}>
              Draft ({invoices.filter((i) => i.status === 'DRAFT').length})
            </Button>
            <Button variant={filterStatus === 'PENDING' ? 'primary' : 'outline'} size="sm" onClick={() => setFilterStatus('PENDING')}>
              Pending ({invoices.filter((i) => i.status === 'PENDING').length})
            </Button>
            <Button variant={filterStatus === 'PAID' ? 'primary' : 'outline'} size="sm" onClick={() => setFilterStatus('PAID')}>
              Paid ({invoices.filter((i) => i.status === 'PAID').length})
            </Button>
            <Button variant={filterStatus === 'OVERDUE' ? 'danger' : 'outline'} size="sm" onClick={() => setFilterStatus('OVERDUE')}>
              Overdue ({invoices.filter((i) => i.status === 'OVERDUE').length})
            </Button>
          </div>

          {filteredInvoices.length > 0 ? (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => {
                const StatusIcon = getInvoiceStatusIcon(invoice.status);
                return (
                  <Card key={invoice.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 ${invoice.status === 'PAID' ? 'bg-success/10' : invoice.status === 'OVERDUE' ? 'bg-danger/10' : 'bg-warning/10'} rounded-lg flex items-center justify-center`}>
                            <FiFileText className="w-6 h-6 text-gray-700" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                            <p className="text-sm text-gray-600">Issued: {formatDate(new Date(invoice.issueDate))}</p>
                            <p className="text-xs text-gray-500">
                              Due: {invoice.dueDate ? formatDate(new Date(invoice.dueDate)) : 'Not set'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-lg">{formatCurrency(invoice.totalAmount)}</p>
                            <Badge variant={getInvoiceStatusColor(invoice.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {invoice.status}
                            </Badge>
                          </div>
                          {invoice.status === 'DRAFT' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateInvoiceStatus(invoice.id, 'PENDING');
                              }}
                            >
                              Send
                            </Button>
                          )}
                          {invoice.status === 'PENDING' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateInvoiceStatus(invoice.id, 'PAID');
                              }}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <FiEye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<FiFileText />}
              title="No invoices found"
              description="Create your first invoice to get started"
              actionLabel="New Invoice"
              onAction={() => setShowInvoiceForm(true)}
            />
          )}
        </>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader title="Recent Transactions" />
          <CardContent className="p-6">
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 ${txn.type === 'INCOME' ? 'bg-success/10' : txn.type === 'EXPENSE' ? 'bg-danger/10' : 'bg-primary/10'} rounded-lg flex items-center justify-center`}>
                        {txn.type === 'INCOME' ? <FiArrowUpRight className="w-5 h-5 text-success" /> : <FiArrowDownRight className="w-5 h-5 text-danger" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{txn.description || 'Ledger Entry'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={txn.type === 'INCOME' ? 'success' : txn.type === 'EXPENSE' ? 'danger' : 'info'}>{txn.type}</Badge>
                          <span className="text-xs text-gray-600">{txn.category || 'Uncategorized'}</span>
                          <span className="text-xs text-gray-500">• {formatDate(new Date(txn.entryDate))}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${txn.type === 'INCOME' ? 'text-success' : txn.type === 'EXPENSE' ? 'text-danger' : 'text-primary'}`}>
                        {txn.type === 'INCOME' ? '+' : txn.type === 'EXPENSE' ? '-' : ''}
                        {formatCurrency(txn.amount)}
                      </p>
                      {txn.invoiceId && <p className="text-xs text-gray-500">Invoice: {txn.invoiceId}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<FiCreditCard />} title="No transactions yet" description="Create your first ledger entry" />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Business Template Report" subtitle="Detailed sales, finance, customer, inventory, and exhibition report with fixed format" />
            <CardContent className="p-6">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-900 px-6 py-5 text-white">
                  <h3 className="text-2xl font-semibold">Organization Executive Sales & Operations Report</h3>
                  <p className="text-sm text-slate-300 mt-1">Generated on {reportTemplateData.generatedOn}</p>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Customers</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">{reportTemplateData.customerStats?.totalCustomers ?? 0}</p>
                        <p className="text-sm text-slate-600">Active: {reportTemplateData.customerStats?.activeCustomers ?? 0}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Finance</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
                        <p className="text-sm text-slate-600">Net: {formatCurrency(stats?.netProfit ?? 0)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Inventory Value</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(reportTemplateData.inventoryStats?.totalValue ?? 0)}</p>
                        <p className="text-sm text-slate-600">Items: {reportTemplateData.inventoryStats?.totalItems ?? 0}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Revenue By Section</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700">
                            <th className="text-left px-4 py-2">Section</th>
                            <th className="text-left px-4 py-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportTemplateData.topRevenueSections.length === 0 ? (
                            <tr>
                              <td className="px-4 py-3 text-slate-500" colSpan={2}>No revenue data available yet</td>
                            </tr>
                          ) : (
                            reportTemplateData.topRevenueSections.map((row) => (
                              <tr key={row.section} className="border-b border-slate-100">
                                <td className="px-4 py-3">{row.section}</td>
                                <td className="px-4 py-3 font-medium">{formatCurrency(row.value)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Top Sold Stock</h4>
                      <div className="overflow-x-auto border border-slate-100 rounded-lg">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700">
                              <th className="text-left px-3 py-2">Item</th>
                              <th className="text-left px-3 py-2">Units Sold</th>
                              <th className="text-left px-3 py-2">Est. Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportTemplateData.soldStockSummary.length === 0 ? (
                              <tr>
                                <td className="px-3 py-3 text-slate-500" colSpan={3}>No sold stock data available</td>
                              </tr>
                            ) : (
                              reportTemplateData.soldStockSummary.slice(0, 6).map((row) => (
                                <tr key={row.itemId} className="border-b border-slate-100">
                                  <td className="px-3 py-2">{row.itemName}</td>
                                  <td className="px-3 py-2">{row.soldUnits}</td>
                                  <td className="px-3 py-2">{formatCurrency(row.estimatedRevenue)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">High Value Inventory</h4>
                      <div className="overflow-x-auto border border-slate-100 rounded-lg">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700">
                              <th className="text-left px-3 py-2">Item</th>
                              <th className="text-left px-3 py-2">Stock</th>
                              <th className="text-left px-3 py-2">Stock Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportTemplateData.topInventoryItems.length === 0 ? (
                              <tr>
                                <td className="px-3 py-3 text-slate-500" colSpan={3}>No inventory data available</td>
                              </tr>
                            ) : (
                              reportTemplateData.topInventoryItems.slice(0, 6).map((row) => (
                                <tr key={row.id} className="border-b border-slate-100">
                                  <td className="px-3 py-2">{row.name}</td>
                                  <td className="px-3 py-2">{row.currentStock} {row.unit}</td>
                                  <td className="px-3 py-2">{formatCurrency(row.currentStock * row.sellingPrice)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-emerald-800 font-medium">Outstanding Invoices</div>
                      <div className="text-emerald-900 mt-1 text-lg font-semibold">{reportTemplateData.outstandingInvoiceCount}</div>
                    </div>
                    <div>
                      <div className="text-emerald-800 font-medium">Exhibitions</div>
                      <div className="text-emerald-900 mt-1 text-lg font-semibold">{reportTemplateData.exhibitionTotals.totalExhibitions}</div>
                    </div>
                    <div>
                      <div className="text-emerald-800 font-medium">Leads Captured</div>
                      <div className="text-emerald-900 mt-1 text-lg font-semibold">{reportTemplateData.exhibitionTotals.totalLeads}</div>
                    </div>
                    <div>
                      <div className="text-emerald-800 font-medium">Conversion Rate</div>
                      <div className="text-emerald-900 mt-1 text-lg font-semibold">{reportTemplateData.exhibitionTotals.conversionRate.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <Button variant="secondary" onClick={exportTemplateReportToExcel}>
                  <FiDownload className="w-4 h-4 mr-2" /> Export Template Excel
                </Button>
                <Button variant="primary" onClick={exportTemplateReportToPDF}>
                  <FiDownload className="w-4 h-4 mr-2" /> Export Template PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Financial Reports" subtitle="Download clean export-ready reports in multiple formats" />
            <CardContent className="p-6">
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Report center</p>
                    <h3 className="mt-2 text-xl font-semibold">Export summary, trends, and invoice snapshots</h3>
                    <p className="mt-1 text-sm text-slate-300">Each export is formatted for quick sharing with finance and leadership.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-white/10 px-3 py-1">CSV</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">Excel</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">PDF</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-primary-100 bg-gradient-to-b from-white to-primary-50/40 p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary">
                    <FiFileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Profit & Loss Statement</h3>
                  <p className="text-sm text-gray-600 mb-4">Calculated from finance ledger data</p>
                  <div className="space-y-2">
                    <Button variant="primary" size="sm" className="w-full" onClick={() => downloadReport('profit-loss')}>
                      <FiDownload className="w-4 h-4 mr-2" /> CSV
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => exportReportToExcel('profit-loss')}>
                      <FiDownload className="w-4 h-4 mr-2" /> Excel
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => exportReportToPDF('profit-loss')}>
                      <FiDownload className="w-4 h-4 mr-2" /> PDF
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-info-100 bg-gradient-to-b from-white to-info-50/40 p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-info-100 text-info-700">
                    <FiBarChart2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Cash Flow Report</h3>
                  <p className="text-sm text-gray-600 mb-4">Trend view from monthly income/expense</p>
                  <div className="space-y-2">
                    <Button variant="primary" size="sm" className="w-full" onClick={() => downloadReport('cash-flow')}>
                      <FiDownload className="w-4 h-4 mr-2" /> CSV
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => exportReportToExcel('cash-flow')}>
                      <FiDownload className="w-4 h-4 mr-2" /> Excel
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => exportReportToPDF('cash-flow')}>
                      <FiDownload className="w-4 h-4 mr-2" /> PDF
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-warning-100 bg-gradient-to-b from-white to-warning-50/40 p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-warning-100 text-warning-700">
                    <FiDollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Outstanding Invoices</h3>
                  <p className="text-sm text-gray-600 mb-4">Pending and overdue totals from live invoices</p>
                  <div className="space-y-2">
                    <Button variant="primary" size="sm" className="w-full" onClick={() => downloadReport('outstanding')}>
                      <FiDownload className="w-4 h-4 mr-2" /> CSV
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => exportReportToExcel('outstanding')}>
                      <FiDownload className="w-4 h-4 mr-2" /> Excel
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => exportReportToPDF('outstanding')}>
                      <FiDownload className="w-4 h-4 mr-2" /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts for visualization */}
          <Card>
            <CardHeader title="Revenue vs Expenses" />
            <CardContent className="p-6">
              <div ref={incomeExpenseChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    {
                      name: 'Financial Overview',
                      revenue: stats?.totalRevenue ?? 0,
                      expenses: stats?.totalExpenses ?? 0,
                    },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : 'N/A'} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Cash Flow Trend" />
            <CardContent className="p-6">
              <div ref={cashFlowChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : 'N/A'} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Expense" strokeWidth={2} />
                    <Line type="monotone" dataKey="net" stroke="#3b82f6" name="Net" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Invoice Status Distribution" />
            <CardContent className="p-6">
              <div ref={invoiceStatusChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Paid',
                          value: invoices.filter((i) => i.status === 'PAID').length,
                          fill: '#10b981',
                        },
                        {
                          name: 'Pending',
                          value: invoices.filter((i) => i.status === 'PENDING').length,
                          fill: '#f59e0b',
                        },
                        {
                          name: 'Overdue',
                          value: invoices.filter((i) => i.status === 'OVERDUE').length,
                          fill: '#ef4444',
                        },
                        {
                          name: 'Draft',
                          value: invoices.filter((i) => i.status === 'DRAFT').length,
                          fill: '#6b7280',
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        <Cell key="cell-paid" fill="#10b981" />,
                        <Cell key="cell-pending" fill="#f59e0b" />,
                        <Cell key="cell-overdue" fill="#ef4444" />,
                        <Cell key="cell-draft" fill="#6b7280" />,
                      ]}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
