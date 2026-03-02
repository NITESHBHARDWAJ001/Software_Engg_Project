import React, { useEffect, useState } from 'react';
import {
  FiPackage,
  FiAlertTriangle,
  FiXCircle,
  FiCheckCircle,
  FiDollarSign,
  FiBarChart2,
  FiTrendingDown,
  FiSearch,
  FiFilter,
  FiPlus,
  FiEdit,
  FiMapPin,
  FiTruck,
  FiClock,
} from 'react-icons/fi';
import { InventoryItem, InventoryCategory, InventoryStatus } from '../../../types';
import {
  inventoryService,
  InventoryStats,
  StockTransaction,
} from '../../../services/mock/inventoryService';
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  [InventoryCategory.SAREES]: '#7B2CBF',
  [InventoryCategory.SALWAR_KAMEEZ]: '#D4AF37',
  [InventoryCategory.LEHENGA]: '#E63946',
  [InventoryCategory.FABRIC]: '#06A77D',
  [InventoryCategory.DUPATTA]: '#118AB2',
  [InventoryCategory.KURTA]: '#F77F00',
  [InventoryCategory.BLOUSE]: '#C9184A',
  [InventoryCategory.ACCESSORIES]: '#8338EC',
};

const InventoryPage: React.FC = () => {
  const { currentOrganization } = useOrganizationStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<InventoryCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<InventoryStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');

  useEffect(() => {
    loadInventory();
    loadStats();
  }, [currentOrganization?.id]);

  const loadInventory = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const data = await inventoryService.getAllInventory(currentOrganization.id);
      setInventory(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!currentOrganization?.id) return;

    try {
      const statsData = await inventoryService.getInventoryStats(currentOrganization.id);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTransactions = async (itemId: string) => {
    try {
      const txnData = await inventoryService.getStockTransactions(itemId);
      setTransactions(txnData);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleItemClick = async (item: InventoryItem) => {
    setSelectedItem(item);
    await loadTransactions(item.id);
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    setTransactions([]);
  };

  const getStatusColor = (
    status: InventoryStatus
  ): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case InventoryStatus.IN_STOCK:
        return 'success';
      case InventoryStatus.LOW_STOCK:
        return 'warning';
      case InventoryStatus.CRITICAL:
      case InventoryStatus.OUT_OF_STOCK:
        return 'danger';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.IN_STOCK:
        return FiCheckCircle;
      case InventoryStatus.LOW_STOCK:
        return FiAlertTriangle;
      case InventoryStatus.CRITICAL:
      case InventoryStatus.OUT_OF_STOCK:
        return FiXCircle;
      default:
        return FiPackage;
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Chart data
  const categoryChartData =
    stats?.categoryCounts.map(c => ({
      name: c.category.replace('_', ' '),
      value: c.value,
      count: c.count,
    })) || [];

  const stockLevelData = inventory
    .filter(i => i.currentStock > 0)
    .slice(0, 10)
    .map(i => ({
      name: i.name.substring(0, 15) + '...',
      stock: i.currentStock,
      reorder: i.reorderLevel,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  // Detail View
  if (selectedItem) {
    const StatusIcon = getStatusIcon(selectedItem.status);
    const stockPercentage = (selectedItem.currentStock / selectedItem.reorderLevel) * 100;
    const potentialValue = selectedItem.currentStock * selectedItem.unitPrice;
    const potentialProfit = selectedItem.currentStock * (selectedItem.unitPrice - selectedItem.costPrice);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBackToList}>
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info">{selectedItem.sku}</Badge>
                <Badge variant={getStatusColor(selectedItem.status)}>
                  {selectedItem.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-gray-600">{selectedItem.category.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FiEdit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="primary" size="sm">
              <FiPlus className="w-4 h-4 mr-2" />
              Restock
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {selectedItem.currentStock}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Reorder at: {selectedItem.reorderLevel}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${
                    selectedItem.status === InventoryStatus.IN_STOCK
                      ? 'bg-success/10'
                      : 'bg-danger/10'
                  } rounded-lg flex items-center justify-center`}
                >
                  <StatusIcon
                    className={`w-6 h-6 ${
                      selectedItem.status === InventoryStatus.IN_STOCK
                        ? 'text-success'
                        : 'text-danger'
                    }`}
                  />
                </div>
              </div>
              {/* Stock level bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stockPercentage >= 100
                        ? 'bg-success'
                        : stockPercentage >= 50
                        ? 'bg-warning'
                        : 'bg-danger'
                    }`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unit Price</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(selectedItem.unitPrice)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cost: {formatCurrency(selectedItem.costPrice)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-success mt-2">
                Margin: {formatCurrency(selectedItem.unitPrice - selectedItem.costPrice)}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(potentialValue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Potential profit</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <FiBarChart2 className="w-6 h-6 text-warning" />
                </div>
              </div>
              <p className="text-xs text-success mt-2">
                {formatCurrency(potentialProfit)}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Restocked</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {getRelativeTime(new Date(selectedItem.lastRestocked))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(new Date(selectedItem.lastRestocked))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Details */}
          <Card>
            <CardHeader title="Item Details" />
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedItem.category.replace('_', ' ')}
                </p>
              </div>
              {selectedItem.supplier && (
                <div className="flex items-start gap-3">
                  <FiTruck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Supplier</p>
                    <p className="text-sm font-medium text-gray-900">{selectedItem.supplier}</p>
                  </div>
                </div>
              )}
              {selectedItem.location && (
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-sm font-medium text-gray-900">{selectedItem.location}</p>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">SKU</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedItem.sku}</code>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="lg:col-span-2">
            <CardHeader title="Stock Transactions" />
            <CardContent className="p-6">
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map(txn => (
                    <div
                      key={txn.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              txn.type === 'IN'
                                ? 'success'
                                : txn.type === 'OUT'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {txn.type}
                          </Badge>
                          <span
                            className={`font-semibold ${
                              txn.quantity > 0 ? 'text-success' : 'text-danger'
                            }`}
                          >
                            {txn.quantity > 0 ? '+' : ''}
                            {txn.quantity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mt-1">{txn.notes}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatDate(new Date(txn.date))} • by {txn.performedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FiBarChart2}
                  message="No transactions yet"
                  description="Transaction history will appear here"
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your product stock</p>
        </div>
        <Button variant="primary">
          <FiPlus className="w-4 h-4 mr-2" />
          Add Item
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
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FiPackage className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
              filterStatus === InventoryStatus.IN_STOCK ? 'ring-2 ring-success' : ''
            }`}
            onClick={() => setFilterStatus(InventoryStatus.IN_STOCK)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inStock}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
              filterStatus === InventoryStatus.LOW_STOCK ? 'ring-2 ring-warning' : ''
            }`}
            onClick={() => setFilterStatus(InventoryStatus.LOW_STOCK)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.lowStock}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <FiAlertTriangle className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all ${
              filterStatus === InventoryStatus.OUT_OF_STOCK ? 'ring-2 ring-danger' : ''
            }`}
            onClick={() => setFilterStatus(InventoryStatus.OUT_OF_STOCK)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.outOfStock}</p>
                </div>
                <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                  <FiXCircle className="w-6 h-6 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'list'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Inventory List
        </button>
        <button
          onClick={() => setViewMode('analytics')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'analytics'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Stock by Category" />
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.count}`}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          CATEGORY_COLORS[entry.name.replace(' ', '_').toUpperCase()] ||
                          '#7B2CBF'
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Stock Levels vs Reorder Point" />
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockLevelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stock" fill="#7B2CBF" name="Current Stock" />
                  <Bar dataKey="reorder" fill="#D4AF37" name="Reorder Level" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, SKU, or supplier..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value as InventoryCategory | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {Object.values(InventoryCategory).map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm">
                  <FiFilter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory List */}
      {viewMode === 'list' && (
        <>
          {filteredInventory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInventory.map(item => {
                const StatusIcon = getStatusIcon(item.status);
                const stockHealth = (item.currentStock / item.reorderLevel) * 100;

                return (
                  <Card
                    key={item.id}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.sku}</p>
                        </div>
                        <Badge variant={getStatusColor(item.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {/* Stock Level */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Stock</span>
                            <span className="font-semibold text-gray-900">
                              {item.currentStock} / {item.reorderLevel}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                stockHealth >= 100
                                  ? 'bg-success'
                                  : stockHealth >= 50
                                  ? 'bg-warning'
                                  : 'bg-danger'
                              }`}
                              style={{ width: `${Math.min(stockHealth, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Price Info */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div>
                            <p className="text-xs text-gray-600">Unit Price</p>
                            <p className="font-semibold text-primary">
                              {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Stock Value</p>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(item.currentStock * item.unitPrice)}
                            </p>
                          </div>
                        </div>

                        {/* Category and Location */}
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <FiPackage className="w-3 h-3" />
                            {item.category.replace('_', ' ')}
                          </span>
                          {item.location && (
                            <span className="flex items-center gap-1 truncate">
                              <FiMapPin className="w-3 h-3" />
                              {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={FiPackage}
              message="No inventory items found"
              description={
                searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first inventory item'
              }
              action={
                <Button variant="primary">
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              }
            />
          )}
        </>
      )}
    </div>
  );
};

export default InventoryPage;
