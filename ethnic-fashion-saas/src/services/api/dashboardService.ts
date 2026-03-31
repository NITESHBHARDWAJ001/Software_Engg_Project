import { UserRole, type Task, type Exhibition } from '../../types';
import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import { customerApiService } from './customerService';
import { inventoryApiService } from './inventoryService';
import { taskService } from './taskService';
import { exhibitionService } from './exhibitionService';

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalCustomers: number;
  customersChange: number;
  activeExhibitions: number;
  exhibitionsChange: number;
  lowStockItems: number;
  stockChange: number;
  pendingTasks: number;
  completedTasks: number;
  upcomingExhibitions: number;
  recentLeads: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  target: number;
}

export interface ExhibitionPerformance {
  name: string;
  leads: number;
  revenue: number;
  roi: number;
}

export interface RecentActivity {
  id: string;
  type: 'customer' | 'exhibition' | 'task' | 'inventory';
  title: string;
  description: string;
  timestamp: Date;
}

type FinanceTrendRow = {
  period: string;
  income: number;
  expense: number;
  net: number;
};

type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

const monthLabel = (period: string) => {
  const [year, month] = period.split('-').map((part) => Number(part));
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' });
};

const pctChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

async function request<T>(path: string): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload as T;
}

const buildRecentActivities = (
  tasks: Task[],
  exhibitions: Exhibition[],
  lowStockCount: number,
): RecentActivity[] => {
  const activities: RecentActivity[] = [];

  for (const task of tasks.slice(0, 3)) {
    activities.push({
      id: `task-${task.id}`,
      type: 'task',
      title: `Task: ${task.title}`,
      description: `Status ${task.status.replace('_', ' ')}${task.assignedToName ? ` • ${task.assignedToName}` : ''}`,
      timestamp: new Date(task.updatedAt || task.createdAt),
    });
  }

  for (const exhibition of exhibitions.slice(0, 3)) {
    activities.push({
      id: `exhibition-${exhibition.id}`,
      type: 'exhibition',
      title: `Exhibition: ${exhibition.name}`,
      description: `${exhibition.status} • ${exhibition.location}`,
      timestamp: new Date(exhibition.updatedAt || exhibition.createdAt),
    });
  }

  if (lowStockCount > 0) {
    activities.push({
      id: 'inventory-low-stock',
      type: 'inventory',
      title: 'Low Stock Alert',
      description: `${lowStockCount} inventory items need replenishment`,
      timestamp: new Date(),
    });
  }

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 6);
};

const getCustomerGrowth = async () => {
  try {
    const allCustomers = await customerApiService.list();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);

    const currentMonthCount = allCustomers.filter((customer) => {
      const date = new Date(customer.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const prevMonthCount = allCustomers.filter((customer) => {
      const date = new Date(customer.createdAt);
      return date.getMonth() === prevMonthDate.getMonth() && date.getFullYear() === prevMonthDate.getFullYear();
    }).length;

    return pctChange(currentMonthCount, prevMonthCount);
  } catch {
    return 0;
  }
};

const getFinanceTrends = async (): Promise<FinanceTrendRow[]> => {
  try {
    const response = await request<ApiSuccess<FinanceTrendRow[]>>('/v1/finance/analytics/trends?groupBy=month');
    return response.data;
  } catch {
    return [];
  }
};

export const dashboardApiService = {
  async getDashboardStats(role: UserRole): Promise<DashboardStats> {
    const [customerStats, inventoryStats, taskStats, exhibitionStats, exhibitions, customerGrowth, trends] =
      await Promise.all([
        customerApiService.stats(),
        inventoryApiService.stats(),
        taskService.getTaskStats(),
        exhibitionService.getExhibitionStats(),
        exhibitionService.getAllExhibitions(''),
        getCustomerGrowth(),
        getFinanceTrends(),
      ]);

    const sortedTrends = [...trends].sort((a, b) => a.period.localeCompare(b.period));
    const current = sortedTrends[sortedTrends.length - 1]?.income ?? customerStats.totalRevenue;
    const previous = sortedTrends[sortedTrends.length - 2]?.income ?? 0;
    const upcomingExhibitions = exhibitions.filter((item) => item.status === 'UPCOMING').length;

    const base: DashboardStats = {
      totalRevenue: current,
      revenueChange: Number(pctChange(current, previous).toFixed(1)),
      totalCustomers: customerStats.totalCustomers,
      customersChange: Number(customerGrowth.toFixed(1)),
      activeExhibitions: exhibitionStats.ongoingExhibitions,
      exhibitionsChange: 0,
      lowStockItems: inventoryStats.lowStockItems,
      stockChange: 0,
      pendingTasks: taskStats.todo + taskStats.inProgress + taskStats.review,
      completedTasks: taskStats.completed,
      upcomingExhibitions,
      recentLeads: exhibitionStats.totalLeads,
    };

    if (role === UserRole.STAFF) {
      return {
        ...base,
        totalRevenue: 0,
        revenueChange: 0,
        totalCustomers: 0,
        customersChange: 0,
        lowStockItems: 0,
      };
    }

    return base;
  },

  async getRevenueChart(role: UserRole): Promise<RevenueChartData[]> {
    if (role === UserRole.STAFF) return [];
    const trends = await getFinanceTrends();
    const sorted = [...trends].sort((a, b) => a.period.localeCompare(b.period)).slice(-6);
    return sorted.map((row, index) => ({
      month: monthLabel(row.period),
      revenue: row.income,
      target: index === 0 ? row.income : Math.max(sorted[index - 1].income, row.income * 0.9),
    }));
  },

  async getExhibitionPerformance(role: UserRole): Promise<ExhibitionPerformance[]> {
    if (role === UserRole.STAFF) return [];
    const exhibitions = await exhibitionService.getAllExhibitions('');
    return exhibitions
      .slice()
      .sort((a, b) => (b.totalLeads || 0) - (a.totalLeads || 0))
      .slice(0, 6)
      .map((item) => ({
        name: item.name.length > 18 ? `${item.name.slice(0, 18)}...` : item.name,
        leads: item.totalLeads || 0,
        revenue: item.actualRevenue || 0,
        roi: item.budget > 0 ? (((item.actualRevenue || 0) - item.budget) / item.budget) * 100 : 0,
      }));
  },

  async getRecentActivities(role: UserRole): Promise<RecentActivity[]> {
    const userId = useAuthStore.getState().user?.id;
    const [tasks, exhibitions, inventoryStats] = await Promise.all([
      role === UserRole.STAFF && userId ? taskService.getTasksByUser(userId) : taskService.getAllTasks(''),
      exhibitionService.getAllExhibitions(''),
      inventoryApiService.stats(),
    ]);

    return buildRecentActivities(tasks, exhibitions, inventoryStats.lowStockItems);
  },
};
