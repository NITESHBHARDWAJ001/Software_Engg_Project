import { useEffect, useState } from 'react';
import { FiUsers, FiDollarSign, FiTrendingUp, FiPackage, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { superAdminService, PlatformStats, RevenueData } from '../services/mock/superAdminService';
import { Organization, BillingStatus, SubscriptionPlan } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, revenueChartData, orgsData] = await Promise.all([
        superAdminService.getPlatformStats(),
        superAdminService.getRevenueData(),
        superAdminService.getAllOrganizations(),
      ]);
      
      setStats(statsData);
      setRevenueData(revenueChartData);
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBillingStatusBadge = (status: BillingStatus) => {
    const statusConfig: Record<BillingStatus, { variant: 'success' | 'warning' | 'danger' | 'info'; icon: React.ElementType; label: string }> = {
      [BillingStatus.ACTIVE]: { variant: 'success' as const, icon: FiCheckCircle, label: 'Active' },
      [BillingStatus.TRIAL]: { variant: 'warning' as const, icon: FiClock, label: 'Trial' },
      [BillingStatus.CANCELLED]: { variant: 'danger' as const, icon: FiAlertCircle, label: 'Cancelled' },
      [BillingStatus.EXPIRED]: { variant: 'danger' as const, icon: FiAlertCircle, label: 'Expired' },
      [BillingStatus.SUSPENDED]: { variant: 'warning' as const, icon: FiAlertCircle, label: 'Suspended' },
    };
    
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const planColors = {
    [SubscriptionPlan.FREE]: '#94A3B8',
    [SubscriptionPlan.STARTER]: '#3B82F6',
    [SubscriptionPlan.PROFESSIONAL]: '#7B2CBF',
    [SubscriptionPlan.ENTERPRISE]: '#D4AF37',
  };

  const planDistribution = organizations.reduce((acc, org) => {
    const existingPlan = acc.find(item => item.name === org.subscriptionPlan);
    if (existingPlan) {
      existingPlan.value += 1;
    } else {
      acc.push({ name: org.subscriptionPlan, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor your SaaS platform performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrganizations}</p>
                <p className="text-sm text-success-600 mt-2 flex items-center gap-1">
                  <FiTrendingUp className="w-4 h-4" />
                  {stats.activeOrganizations} Active
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="text-sm text-success-600 mt-2 flex items-center gap-1">
                  <FiTrendingUp className="w-4 h-4" />
                  +{stats.revenueGrowth}% growth
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success-50 flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                <p className="text-sm text-gray-500 mt-2">Across all organizations</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-info-50 flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-info-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Signups</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.newSignupsThisMonth}</p>
                <p className="text-sm text-gray-500 mt-2">This month</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-warning-50 flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader title="Revenue Trend" subtitle="Last 6 months" />
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#7B2CBF" 
                  strokeWidth={3}
                  dot={{ fill: '#7B2CBF', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* New Organizations */}
        <Card>
          <CardHeader title="New Organizations" subtitle="Monthly signups" />
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                />
                <Bar dataKey="newOrgs" fill="#7B2CBF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Plan Distribution & Organizations Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution Pie Chart */}
        <Card>
          <CardHeader title="Plan Distribution" subtitle="By subscription tier" />
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={planColors[entry.name as SubscriptionPlan]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Recent Organizations */}
        <Card className="lg:col-span-2">
          <CardHeader title="Organizations" subtitle="All registered organizations" />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Organization</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Users</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-sm text-gray-500">{org.contactEmail || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={org.subscriptionPlan === SubscriptionPlan.PROFESSIONAL ? 'primary' : 'neutral'}>
                          <FiPackage className="w-3 h-3" />
                          {org.subscriptionPlan}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {getBillingStatusBadge(org.billingStatus)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">{org.totalUsers}</span>
                        <span className="text-gray-500 text-sm"> / {org.maxUsers}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(org.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
