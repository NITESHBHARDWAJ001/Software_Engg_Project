export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalCustomers: number;
  customerGrowth: number;
  totalExhibitions: number;
  exhibitionGrowth: number;
  pendingTasks: number;
  taskGrowth: number;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  target?: number;
}

export interface TopPerformingExhibition {
  id: string;
  name: string;
  revenue: number;
  roi: number;
  leads: number;
}

export interface RecentActivity {
  id: string;
  type: 'TASK' | 'LEAD' | 'CUSTOMER' | 'INVOICE' | 'EXHIBITION';
  title: string;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  type: 'EXHIBITION' | 'MEETING' | 'DEADLINE' | 'FOLLOWUP';
  date: string;
  relatedId?: string;
}
