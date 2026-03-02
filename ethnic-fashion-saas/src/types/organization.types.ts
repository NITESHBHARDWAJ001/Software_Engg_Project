export enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum BillingStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export interface PlanFeatures {
  maxUsers: number;
  maxExhibitions: number;
  maxCustomers: number;
  maxInventoryItems: number;
  analyticsAccess: boolean;
  exportData: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface SubscriptionPlanDetails {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: PlanFeatures;
  description: string;
  popular?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  website?: string;
  subscriptionPlan: SubscriptionPlan;
  billingStatus: BillingStatus;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  totalUsers: number;
  maxUsers: number;
  currentUsers?: number;
  features: PlanFeatures;
  createdAt: string;
  address?: string;
  phone?: string;
  contactPhone?: string;
  contactEmail?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface OrganizationStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
  totalCustomers: number;
  totalExhibitions: number;
  completedTasks: number;
}
