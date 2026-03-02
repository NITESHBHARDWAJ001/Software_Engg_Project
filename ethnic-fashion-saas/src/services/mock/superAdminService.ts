// Mock data service for Super Admin operations
import { Organization, SubscriptionPlan, BillingStatus } from '../../types';
import { mockOrganizations } from './authService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  newSignupsThisMonth: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  newOrgs: number;
}

export const superAdminService = {
  async getPlatformStats(): Promise<PlatformStats> {
    await delay(500);
    
    const activeOrgs = mockOrganizations.filter(
      org => org.billingStatus === BillingStatus.ACTIVE || org.billingStatus === BillingStatus.TRIAL
    );
    
    const totalUsers = mockOrganizations.reduce((sum, org) => sum + org.totalUsers, 0);
    
    // Mock monthly revenue calculation
    const planPrices: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.STARTER]: 2999,
      [SubscriptionPlan.PROFESSIONAL]: 5999,
      [SubscriptionPlan.ENTERPRISE]: 15000,
    };
    
    const monthlyRevenue = activeOrgs.reduce((sum, org) => {
      return sum + planPrices[org.subscriptionPlan];
    }, 0);
    
    return {
      totalOrganizations: mockOrganizations.length,
      activeOrganizations: activeOrgs.length,
      totalUsers,
      monthlyRevenue,
      revenueGrowth: 12.5,
      newSignupsThisMonth: 8,
    };
  },

  async getRevenueData(): Promise<RevenueData[]> {
    await delay(400);
    return [
      { month: 'Jan', revenue: 125000, newOrgs: 5 },
      { month: 'Feb', revenue: 145000, newOrgs: 7 },
      { month: 'Mar', revenue: 168000, newOrgs: 8 },
      { month: 'Apr', revenue: 192000, newOrgs: 10 },
      { month: 'May', revenue: 215000, newOrgs: 12 },
      { month: 'Jun', revenue: 248000, newOrgs: 15 },
    ];
  },

  async getAllOrganizations(): Promise<Organization[]> {
    await delay(600);
    return [...mockOrganizations];
  },

  async updateOrganizationStatus(orgId: string, status: BillingStatus): Promise<void> {
    await delay(400);
    const org = mockOrganizations.find(o => o.id === orgId);
    if (org) {
      org.billingStatus = status;
    }
  },

  async updateOrganizationPlan(orgId: string, plan: SubscriptionPlan): Promise<void> {
    await delay(400);
    const org = mockOrganizations.find(o => o.id === orgId);
    if (org) {
      org.subscriptionPlan = plan;
    }
  },
};
