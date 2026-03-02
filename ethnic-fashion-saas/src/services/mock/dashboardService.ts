// Mock data service for Organization Dashboard
import { UserRole } from '../../types';

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
  icon: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dashboardService = {
  async getDashboardStats(role: UserRole, _organizationId: string): Promise<DashboardStats> {
    await delay(600);
    
    // Role-based stats
    const baseStats: DashboardStats = {
      totalRevenue: 2450000,
      revenueChange: 15.3,
      totalCustomers: 487,
      customersChange: 12.5,
      activeExhibitions: 8,
      exhibitionsChange: 2,
      lowStockItems: 23,
      stockChange: -5,
      pendingTasks: 15,
      completedTasks: 42,
      upcomingExhibitions: 3,
      recentLeads: 124,
    };

    // Staff sees limited data
    if (role === UserRole.STAFF) {
      return {
        ...baseStats,
        totalRevenue: 0,
        revenueChange: 0,
        totalCustomers: 0,
        customersChange: 0,
        lowStockItems: 0,
        stockChange: 0,
      };
    }

    // Manager sees most data except detailed financial
    if (role === UserRole.MANAGER) {
      return {
        ...baseStats,
        totalRevenue: 2450000, // Can see revenue
        revenueChange: 15.3,
      };
    }

    // ORG_ADMIN sees everything
    return baseStats;
  },

  async getRevenueChart(_organizationId: string): Promise<RevenueChartData[]> {
    await delay(400);
    return [
      { month: 'Jan', revenue: 385000, target: 350000 },
      { month: 'Feb', revenue: 420000, target: 400000 },
      { month: 'Mar', revenue: 398000, target: 420000 },
      { month: 'Apr', revenue: 455000, target: 450000 },
      { month: 'May', revenue: 492000, target: 480000 },
      { month: 'Jun', revenue: 520000, target: 500000 },
    ];
  },

  async getExhibitionPerformance(_organizationId: string): Promise<ExhibitionPerformance[]> {
    await delay(500);
    return [
      { name: 'Mumbai Fashion Week', leads: 145, revenue: 425000, roi: 245 },
      { name: 'Delhi Textile Expo', leads: 98, revenue: 295000, roi: 198 },
      { name: 'Bangalore Saree Fair', leads: 76, revenue: 198000, roi: 165 },
      { name: 'Chennai Designer Show', leads: 124, revenue: 385000, roi: 220 },
    ];
  },

  async getRecentActivities(role: UserRole, _organizationId: string): Promise<RecentActivity[]> {
    await delay(400);
    
    const allActivities: RecentActivity[] = [
      {
        id: '1',
        type: 'customer',
        title: 'New customer registered',
        description: 'Priya Sharma from Mumbai added to CRM',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        icon: 'FiUser',
      },
      {
        id: '2',
        type: 'exhibition',
        title: 'Exhibition lead captured',
        description: '15 new leads from Mumbai Fashion Week',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        icon: 'FiTrendingUp',
      },
      {
        id: '3',
        type: 'task',
        title: 'Task completed',
        description: 'Follow-up with VIP customers completed',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        icon: 'FiCheckCircle',
      },
      {
        id: '4',
        type: 'inventory',
        title: 'Low stock alert',
        description: 'Designer Saree Collection below 10 units',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        icon: 'FiAlertCircle',
      },
      {
        id: '5',
        type: 'customer',
        title: 'Payment received',
        description: '₹85,000 received from Rajesh Kumar',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        icon: 'FiDollarSign',
      },
    ];

    // Staff sees limited activities
    if (role === UserRole.STAFF) {
      return allActivities.filter(a => a.type === 'task' || a.type === 'exhibition');
    }

    return allActivities;
  },
};
