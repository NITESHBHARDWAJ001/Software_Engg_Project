import React, { useEffect, useState } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiFileText,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownRight,
  FiPlus,
  FiDownload,
  FiEye,
} from 'react-icons/fi';
import {
  financeService,
  Invoice,
  InvoiceStatus,
  Transaction,
  TransactionType,
  PaymentMethod,
  CashFlowData,
  FinanceStats,
} from '../../../services/mock/financeService';
import { useOrganizationStore } from '../../../store/organizationStore';
import { formatCurrency, formatDate } from '../../../utils/helpers';
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
} from 'recharts';

const FinancePage: React.FC = () => {
  const { currentOrganization } = useOrganizationStore();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'transactions' | 'reports'>('dashboard');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');

  useEffect(() => {
    loadFinanceData();
  }, [currentOrganization?.id]);

  const loadFinanceData = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const [statsData, invoicesData, transactionsData, cashFlow] = await Promise.all([
        financeService.getFinanceStats(currentOrganization.id),
        financeService.getAllInvoices(currentOrganization.id),
        financeService.getAllTransactions(currentOrganization.id),
        financeService.getCashFlowData(currentOrganization.id),
      ]);

      setStats(statsData);
      setInvoices(invoicesData);
      setTransactions(transactionsData);
      setCashFlowData(cashFlow);
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceStatusColor = (status: InvoiceStatus): 'info' | 'warning' | 'success' | 'danger' => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return 'info';
      case InvoiceStatus.PENDING:
        return 'warning';
      case InvoiceStatus.PAID:
        return 'success';
      case InvoiceStatus.OVERDUE:
      case InvoiceStatus.CANCELLED:
        return 'danger';
      default:
        return 'info';
    }
  };

  const getInvoiceStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return FiCheckCircle;
      case InvoiceStatus.PENDING:
        return FiClock;
      case InvoiceStatus.OVERDUE:
        return FiAlertCircle;
      case InvoiceStatus.CANCELLED:
        return FiXCircle;
      default:
        return FiFileText;
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CARD:
      case PaymentMethod.UPI:
        return FiCreditCard;
      default:
        return FiDollarSign;
    }
  };

  const filteredInvoices = invoices.filter(
    inv => filterStatus === 'all' || inv.status === filterStatus
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  // Invoice Detail View
  if (selectedInvoice) {
    const StatusIcon = getInvoiceStatusIcon(selectedInvoice.status);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedInvoice.invoiceNumber}
              </h1>
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
            <Button variant="outline" size="sm">
              <FiDownload className="w-4 h-4 mr-2" />
              Download
            </Button>
            {selectedInvoice.status === InvoiceStatus.PENDING && (
              <Button variant="primary" size="sm">
                <FiCheckCircle className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Card */}
        <Card>
          <CardContent className="p-8">
            {/* Invoice Header */}
            <div className="flex justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">INVOICE</h2>
                <p className="text-sm text-gray-600">
                  Invoice #: {selectedInvoice.invoiceNumber}
                </p>
                <p className="text-sm text-gray-600">
                  Issue Date: {formatDate(new Date(selectedInvoice.issueDate))}
                </p>
                <p className="text-sm text-gray-600">
                  Due Date: {formatDate(new Date(selectedInvoice.dueDate))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">From</p>
                <p className="font-semibold text-gray-900">{currentOrganization?.name}</p>
                <p className="text-sm text-gray-600 mt-3">To</p>
                <p className="font-semibold text-gray-900">{selectedInvoice.customerName}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-b py-4 mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="text-center py-2 text-sm font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-700">
                      Unit Price
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="py-3 text-sm text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-900">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(selectedInvoice.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (18% GST):</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(selectedInvoice.tax)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-bold text-primary text-lg">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedInvoice.notes && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600 font-semibold mb-2">Notes:</p>
                <p className="text-sm text-gray-700">{selectedInvoice.notes}</p>
              </div>
            )}

            {/* Payment Info */}
            {selectedInvoice.paidDate && (
              <div className="mt-4 p-4 bg-success/10 rounded-lg">
                <p className="text-sm text-success font-semibold">
                  ✓ Paid on {formatDate(new Date(selectedInvoice.paidDate))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
          <p className="text-gray-600 mt-1">Track invoices, transactions, and cash flow</p>
        </div>
        <Button variant="primary">
          <FiPlus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <FiTrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-success font-semibold">+12.5%</span>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <FiTrendingDown className="w-4 h-4 text-danger" />
                    <span className="text-xs text-gray-600">Operating costs</span>
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
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(stats.netProfit)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-gray-600">
                      {((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}% margin
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
                  <p className="text-sm text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.pendingAmount + stats.overdueAmount)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <FiAlertCircle className="w-4 h-4 text-warning" />
                    <span className="text-xs text-warning font-semibold">
                      {stats.overdueInvoices} overdue
                    </span>
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

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'dashboard'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'invoices'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'transactions'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'reports'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Reports
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Cash Flow (Last 6 Months)" />
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#06A77D"
                    strokeWidth={2}
                    name="Income"
                    dot={{ fill: '#06A77D', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#E63946"
                    strokeWidth={2}
                    name="Expense"
                    dot={{ fill: '#E63946', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#7B2CBF"
                    strokeWidth={2}
                    name="Net Profit"
                    dot={{ fill: '#7B2CBF', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Monthly Comparison" />
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

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <>
          {/* Filter Bar */}
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All ({invoices.length})
            </Button>
            <Button
              variant={filterStatus === InvoiceStatus.PENDING ? 'warning' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(InvoiceStatus.PENDING)}
            >
              Pending ({invoices.filter(i => i.status === InvoiceStatus.PENDING).length})
            </Button>
            <Button
              variant={filterStatus === InvoiceStatus.PAID ? 'success' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(InvoiceStatus.PAID)}
            >
              Paid ({invoices.filter(i => i.status === InvoiceStatus.PAID).length})
            </Button>
            <Button
              variant={filterStatus === InvoiceStatus.OVERDUE ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(InvoiceStatus.OVERDUE)}
            >
              Overdue ({invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length})
            </Button>
          </div>

          {/* Invoice List */}
          {filteredInvoices.length > 0 ? (
            <div className="space-y-4">
              {filteredInvoices.map(invoice => {
                const StatusIcon = getInvoiceStatusIcon(invoice.status);

                return (
                  <Card
                    key={invoice.id}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`w-12 h-12 ${
                              invoice.status === InvoiceStatus.PAID
                                ? 'bg-success/10'
                                : invoice.status === InvoiceStatus.OVERDUE
                                ? 'bg-danger/10'
                                : 'bg-warning/10'
                            } rounded-lg flex items-center justify-center`}
                          >
                            <FiFileText className="w-6 h-6 text-gray-700" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {invoice.invoiceNumber}
                            </h3>
                            <p className="text-sm text-gray-600">{invoice.customerName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                Due: {formatDate(new Date(invoice.dueDate))}
                              </span>
                              {invoice.status === InvoiceStatus.PAID && invoice.paidDate && (
                                <span className="text-xs text-success">
                                  • Paid {formatDate(new Date(invoice.paidDate))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-lg">
                              {formatCurrency(invoice.totalAmount)}
                            </p>
                            <Badge variant={getInvoiceStatusColor(invoice.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {invoice.status}
                            </Badge>
                          </div>
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
              icon={FiFileText}
              message="No invoices found"
              description="Create your first invoice to get started"
              action={
                <Button variant="primary">
                  <FiPlus className="w-4 h-4 mr-2" />
                  New Invoice
                </Button>
              }
            />
          )}
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <Card>
          <CardHeader title="Recent Transactions" />
          <CardContent className="p-6">
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map(txn => {
                  const PaymentIcon = getPaymentMethodIcon(txn.paymentMethod);

                  return (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 ${
                            txn.type === TransactionType.INCOME
                              ? 'bg-success/10'
                              : 'bg-danger/10'
                          } rounded-lg flex items-center justify-center`}
                        >
                          {txn.type === TransactionType.INCOME ? (
                            <FiArrowUpRight className="w-5 h-5 text-success" />
                          ) : (
                            <FiArrowDownRight className="w-5 h-5 text-danger" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{txn.description}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                txn.type === TransactionType.INCOME ? 'success' : 'danger'
                              }
                            >
                              {txn.type}
                            </Badge>
                            <span className="text-xs text-gray-600">{txn.category}</span>
                            <span className="text-xs text-gray-500">
                              • {formatDate(new Date(txn.date))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PaymentIcon className="w-4 h-4" />
                          <span>{txn.paymentMethod}</span>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-lg ${
                              txn.type === TransactionType.INCOME
                                ? 'text-success'
                                : 'text-danger'
                            }`}
                          >
                            {txn.type === TransactionType.INCOME ? '+' : '-'}
                            {formatCurrency(txn.amount)}
                          </p>
                          <p className="text-xs text-gray-500">{txn.reference}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={FiCreditCard}
                message="No transactions yet"
                description="Transaction history will appear here"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card>
          <CardHeader title="Financial Reports" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-6 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <FiFileText className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Profit & Loss Statement</h3>
                <p className="text-sm text-gray-600 mb-4">
                  View detailed income and expenses
                </p>
                <Button variant="outline" size="sm">
                  <FiDownload className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <FiBarChart2 className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Cash Flow Report</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Track money in and out of business
                </p>
                <Button variant="outline" size="sm">
                  <FiDownload className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <FiDollarSign className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Tax Summary</h3>
                <p className="text-sm text-gray-600 mb-4">GST and tax calculations</p>
                <Button variant="outline" size="sm">
                  <FiDownload className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancePage;
