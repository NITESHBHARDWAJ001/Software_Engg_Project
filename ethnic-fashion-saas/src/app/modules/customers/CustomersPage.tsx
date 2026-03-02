import React, { useEffect, useState } from 'react';
import {
 FiUsers,
  FiUserCheck,
  FiUserX,
  FiDollarSign,
  FiTrendingUp,
  FiMail,
  FiPhone,
  FiMapPin,
  FiTag,
  FiCalendar,
  FiShoppingBag,
  FiSearch,
  FiFilter,
  FiPlus,
} from 'react-icons/fi';
import { Customer, CustomerType, CustomerStatus } from '../../../types';
import { customerService, CustomerStats, PurchaseHistory } from '../../../services/mock/customerService';
import { useOrganizationStore } from '../../../store/organizationStore';
import { formatCurrency, formatDate, getRelativeTime } from '../../../utils/helpers';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const CustomersPage: React.FC = () => {
  const { currentOrganization } = useOrganizationStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<CustomerType | 'all'>('all');

  useEffect(() => {
    loadCustomers();
    loadStats();
  }, [currentOrganization?.id]);

  const loadCustomers = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const data = await customerService.getAllCustomers(currentOrganization.id);
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const statsData = await customerService.getCustomerStats(currentOrganization.id);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadPurchaseHistory = async (customerId: string) => {
    try {
      const history = await customerService.getPurchaseHistory(customerId);
      setPurchaseHistory(history);
    } catch (error) {
      console.error('Failed to load purchase history:', error);
    }
  };

  const handleCustomerClick = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await loadPurchaseHistory(customer.id);
  };

  const handleBackToList = () => {
    setSelectedCustomer(null);
    setPurchaseHistory([]);
  };

  const getTypeColor = (type: CustomerType): 'info' | 'success' | 'warning' => {
    switch (type) {
      case CustomerType.RETAIL:
        return 'info';
      case CustomerType.WHOLESALE:
        return 'success';
      case CustomerType.DISTRIBUTOR:
        return 'warning';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status: CustomerStatus): 'success' | 'danger' => {
    return status === CustomerStatus.ACTIVE ? 'success' : 'danger';
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    const matchesType = filterType === 'all' || customer.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Chart data for top customers
  const topCustomersChartData =
    stats?.topCustomers.map(c => ({
      name: c.name.split(' ')[0],
      value: c.lifetimeValue,
    })) || [];

  // Customer growth chart data (mock data)
  const customerGrowthData = [
    { month: 'Sep', customers: 120 },
    { month: 'Oct', customers: 145 },
    { month: 'Nov', customers: 178 },
    { month: 'Dec', customers: 210 },
    { month: 'Jan', customers: 252 },
    { month: 'Feb', customers: 290 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  // Detail View
  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBackToList}>
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getTypeColor(selectedCustomer.type)}>
                  {selectedCustomer.type}
                </Badge>
                <Badge variant={getStatusColor(selectedCustomer.status)}>
                  {selectedCustomer.status}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="primary" size="sm">
            <FiMail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lifetime Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(selectedCustomer.lifetimeValue)}
                  </p>
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
                  <p className="text-sm text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(selectedCustomer.totalPurchases)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <FiShoppingBag className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {purchaseHistory.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Purchase</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {getRelativeTime(new Date(selectedCustomer.lastPurchaseDate))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                  <FiCalendar className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Details and Purchase History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader title="Contact Information" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <FiMail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedCustomer.email || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiPhone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedCustomer.phone || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiMapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedCustomer.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.pincode}
                  </p>
                </div>
              </div>
              {selectedCustomer.company && (
                <div className="flex items-start gap-3">
                  <FiUsers className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedCustomer.company}
                    </p>
                  </div>
                </div>
              )}
              {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <FiTag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.tags.map((tag, index) => (
                        <Badge key={index} variant="info">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {selectedCustomer.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-sm text-gray-900">{selectedCustomer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card className="lg:col-span-2">
            <CardHeader title="Purchase History" />
            <CardContent className="p-6">
              {purchaseHistory.length > 0 ? (
                <div className="space-y-4">
                  {purchaseHistory.map(purchase => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <FiShoppingBag className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-gray-900">
                              Order #{purchase.id.toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(new Date(purchase.date))} • {purchase.items} items
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(purchase.amount)}
                        </p>
                        <Badge
                          variant={
                            purchase.status === 'completed'
                              ? 'success'
                              : purchase.status === 'pending'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {purchase.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FiShoppingBag}
                  message="No purchase history available"
                  description="This customer hasn't made any purchases yet."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships</p>
        </div>
        <Button variant="primary">
          <FiPlus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
              filterStatus === 'all' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setFilterStatus('all')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalCustomers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
              filterStatus === CustomerStatus.ACTIVE ? 'ring-2 ring-success' : ''
            }`}
            onClick={() => setFilterStatus(CustomerStatus.ACTIVE)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.activeCustomers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <FiUserCheck className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
              filterStatus === CustomerStatus.INACTIVE ? 'ring-2 ring-danger' : ''
            }`}
            onClick={() => setFilterStatus(CustomerStatus.INACTIVE)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.inactiveCustomers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                  <FiUserX className="w-6 h-6 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Purchase</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.averagePurchaseValue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Top Customers by Revenue" />
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomersChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="value" fill="#7B2CBF" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Customer Growth Trend" />
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#7B2CBF"
                  strokeWidth={2}
                  dot={{ fill: '#7B2CBF', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers by name, email, phone, or company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as CustomerType | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value={CustomerType.RETAIL}>Retail</option>
                <option value={CustomerType.WHOLESALE}>Wholesale</option>
                <option value={CustomerType.DISTRIBUTOR}>Distributor</option>
              </select>
              <Button variant="outline" size="sm">
                <FiFilter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <Card
              key={customer.id}
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleCustomerClick(customer)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    {customer.company && (
                      <p className="text-sm text-gray-600">{customer.company}</p>
                    )}
                  </div>
                  <Badge variant={getStatusColor(customer.status)}>
                    {customer.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiMail className="w-4 h-4" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiPhone className="w-4 h-4" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiMapPin className="w-4 h-4" />
                    <span className="truncate">{customer.city}, {customer.state}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-600">Lifetime Value</p>
                    <p className="font-semibold text-primary">
                      {formatCurrency(customer.lifetimeValue)}
                    </p>
                  </div>
                  <Badge variant={getTypeColor(customer.type)}>{customer.type}</Badge>
                </div>

                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {customer.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FiUsers}
          message="No customers found"
          description={
            searchQuery || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first customer'
          }
          action={
            <Button variant="primary">
              <FiPlus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          }
        />
      )}
    </div>
  );
};

export default CustomersPage;
