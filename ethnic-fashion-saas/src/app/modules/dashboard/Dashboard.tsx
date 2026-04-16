import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiDollarSign, 
  FiUsers, 
  FiCalendar, 
  FiPackage, 
  FiCheckCircle, 
  FiClock,
  FiTrendingUp,
  FiAlertCircle,
  FiUser,
  FiBarChart2,
} from 'react-icons/fi';
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
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useAuthStore } from '../../../store/authStore';
import { useOrganizationStore } from '../../../store/organizationStore';
import { UserRole } from '../../../types';
import { formatCurrency, formatNumber, getRelativeTime } from '../../../utils/helpers';
import { ROUTES } from '../../../utils/constants';
import {
  dashboardApiService,
  DashboardStats,
  RevenueChartData,
  ExhibitionPerformance,
  RecentActivity,
} from '../../../services/api/dashboardService';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { currentOrganization } = useOrganizationStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([]);
  const [exhibitionPerformance, setExhibitionPerformance] = useState<ExhibitionPerformance[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && currentOrganization) {
      loadDashboardData();
    }
  }, [user, currentOrganization]);

  const loadDashboardData = async () => {
    if (!user || !currentOrganization) return;
    
    setLoading(true);
    try {
      const [statsData, revenueChart, exhibitionData, activities] = await Promise.all([
        dashboardApiService.getDashboardStats(user.role),
        dashboardApiService.getRevenueChart(user.role),
        dashboardApiService.getExhibitionPerformance(user.role),
        dashboardApiService.getRecentActivities(user.role),
      ]);

      setStats(statsData);
      setRevenueData(revenueChart);
      setExhibitionPerformance(exhibitionData);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'customer': return FiUser;
      case 'exhibition': return FiTrendingUp;
      case 'task': return FiCheckCircle;
      case 'inventory': return FiAlertCircle;
      default: return FiClock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats || !user) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Failed to load dashboard data</div>
      </div>
    );
  }

  // STAFF Dashboard - Simplified view
  if (user.role === UserRole.STAFF) {
    return (
      <div className="p-6 space-y-6">
{/* Header */}
      <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 mt-1">Here's your activity overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning-50 flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-success-50 flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Exhibitions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeExhibitions}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
                  <FiCalendar className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Recent Activities" />
          <CardBody>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{getRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // MANAGER & ORG_ADMIN Dashboard - Full featured view
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">{currentOrganization?.name}</p>
        </div>
        <Button>
          <FiCalendar className="w-4 h-4" />
          View Calendar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalRevenue)}</p>
                  <p className={`text-sm mt-2 flex items-center gap-1 ${stats.revenueChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    <FiTrendingUp className="w-4 h-4" />
                    {stats.revenueChange > 0 ? '+' : ''}{stats.revenueChange}% from last month
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
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatNumber(stats.totalCustomers)}</p>
                <p className="text-sm text-success-600 mt-2 flex items-center gap-1">
                  <FiTrendingUp className="w-4 h-4" />
                  +{stats.customersChange}% growth
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
                <p className="text-sm font-medium text-gray-600">Active Exhibitions</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeExhibitions}</p>
                <p className="text-sm text-info-600 mt-2">
                  {stats.upcomingExhibitions} upcoming
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-info-50 flex items-center justify-center">
                <FiCalendar className="w-6 h-6 text-info-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.lowStockItems}</p>
                <p className="text-sm text-warning-600 mt-2 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  Needs attention
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-warning-50 flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {stats.customerRfm && (
        <Card>
          <CardHeader title="Customer RFM" subtitle="Behavioral customer segments for the organization" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-success-100 bg-success-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-success-700">Champions</p>
                    <p className="mt-2 text-2xl font-bold text-success-700">{stats.customerRfm.segments.CHAMPION}</p>
                  </div>
                  <FiBarChart2 className="w-5 h-5 text-success-600" />
                </div>
              </div>
              <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-700">Loyal</p>
                    <p className="mt-2 text-2xl font-bold text-primary-700">{stats.customerRfm.segments.LOYAL}</p>
                  </div>
                  <FiUsers className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div className="rounded-2xl border border-warning-100 bg-warning-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-warning-700">Potential Loyalists</p>
                    <p className="mt-2 text-2xl font-bold text-warning-700">{stats.customerRfm.segments.POTENTIAL_LOYALIST}</p>
                  </div>
                  <FiTrendingUp className="w-5 h-5 text-warning-600" />
                </div>
              </div>
              <div className="rounded-2xl border border-danger-100 bg-danger-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-danger-700">At Risk</p>
                    <p className="mt-2 text-2xl font-bold text-danger-700">{stats.customerRfm.segments.AT_RISK}</p>
                  </div>
                  <FiAlertCircle className="w-5 h-5 text-danger-600" />
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="font-medium text-gray-900">Average recency</div>
                <div className="mt-1">{stats.customerRfm.averageRecencyDays} days</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="font-medium text-gray-900">Average frequency</div>
                <div className="mt-1">{stats.customerRfm.averageFrequency} interactions</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="font-medium text-gray-900">Average monetary</div>
                <div className="mt-1">{formatCurrency(stats.customerRfm.averageMonetary)}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {currentOrganization && (
        <Card>
          <CardHeader title="Subscription" subtitle="Track your current plan and upgrade options" />
          <CardBody>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Current plan</span>
                  <Badge variant="primary">{currentOrganization.subscriptionPlan}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Billing status: {currentOrganization.billingStatus}
                </p>
              </div>
              <Link to={ROUTES.SETTINGS_SUBSCRIPTION}>
                <Button>View Plans & Upgrade</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Charts Row */}
      {revenueData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Revenue Overview" subtitle="Actual vs Target" />
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
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#7B2CBF" strokeWidth={3} name="Revenue" />
                  <Line type="monotone" dataKey="target" stroke="#D4AF37" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Exhibition Performance" subtitle="Recent exhibitions" />
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exhibitionPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  />
                  <Bar dataKey="leads" fill="#7B2CBF" radius={[8, 8, 0, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Activities and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent Activities" subtitle="Latest updates from your organization" />
          <CardBody>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{getRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick Tasks" />
          <CardBody>
            <div className="space-y-3">
              <div className="p-4 border-2 border-primary-200 rounded-lg bg-primary-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Pending Tasks</span>
                  <Badge variant="warning">{stats.pendingTasks}</Badge>
                </div>
                <Button variant="outline" size="sm" fullWidth>
                  View Tasks
                </Button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Recent Leads</span>
                  <Badge variant="primary">{stats.recentLeads}</Badge>
                </div>
                <Button variant="outline" size="sm" fullWidth>
                  View Leads
                </Button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Upcoming Events</span>
                  <Badge variant="info">{stats.upcomingExhibitions}</Badge>
                </div>
                <Button variant="outline" size="sm" fullWidth>
                  View Calendar
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
