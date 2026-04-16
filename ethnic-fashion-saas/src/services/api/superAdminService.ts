import {
  BillingStatus,
  type Organization,
  SubscriptionPlan,
  type User,
} from '../../types';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../utils/constants';

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type BackendOrganization = {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  totalUsers: number;
  createdAt: string;
  updatedAt: string;
};

type BackendSubscriptionPlan = {
  code: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price: number;
};

type BackendOrganizationSubscription = {
  status: string;
  startDate: string;
  endDate?: string | null;
  seats?: number | null;
  plan?: BackendSubscriptionPlan;
};

type CreateOrganizationPayload = {
  name: string;
  email?: string;
  phone?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

type CreateOrganizationResponse = {
  organization: BackendOrganization;
  adminUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string | null;
  };
};

type OrganizationWithSubscription = {
  organization: Organization;
  subscription: BackendOrganizationSubscription | null;
};

export type PlatformStats = {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  newSignupsThisMonth: number;
};

export type RevenueData = {
  month: string;
  revenue: number;
  newOrgs: number;
};

export type ServiceFeatureKey =
  | 'CUSTOMER_MANAGEMENT'
  | 'INVENTORY_MANAGEMENT'
  | 'FINANCE_MANAGEMENT'
  | 'TASK_MANAGEMENT'
  | 'EXHIBITION_MANAGEMENT'
  | string;

export type SaasPlan = {
  id: string;
  name: string;
  code: string;
  description?: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price: number;
  currency: string;
  isActive: boolean;
  features: ServiceFeatureKey[];
  limits?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PlanPayload = {
  name: string;
  code: string;
  description?: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price: number;
  currency: string;
  isActive: boolean;
  features: ServiceFeatureKey[];
  limits?: Record<string, unknown>;
};

export type MockCheckoutPayload = {
  organizationId: string;
  planId: string;
  paymentMethod: 'CARD' | 'UPI' | 'BANK_TRANSFER';
  activateNow: boolean;
  offer?: {
    code?: string;
    title?: string;
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
  };
  notes?: string;
};

export type MockCheckoutResult = {
  transactionId: string;
  mode: 'MOCK';
  paymentStatus: 'PAID';
  paymentMethod: 'CARD' | 'UPI' | 'BANK_TRANSFER';
  organizationId: string;
  plan: SaasPlan;
  invoice: {
    currency: string;
    amount: number;
    discountAmount: number;
    finalAmount: number;
  };
  offerApplied: {
    code?: string;
    title?: string;
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
  } | null;
  processedAt: string;
  message: string;
};

export type PlanOrganizationSubscription = {
  subscriptionId: string;
  organizationId: string;
  planId: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  startDate: string;
  endDate?: string | null;
  trialEndsAt?: string | null;
  autoRenew: boolean;
  seats?: number | null;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    email?: string | null;
    phone?: string | null;
    totalUsers: number;
    createdAt: string;
    updatedAt: string;
  };
};

const defaultFeatures = {
  maxUsers: 999999,
  maxExhibitions: 999999,
  maxCustomers: 999999,
  maxInventoryItems: 999999,
  analyticsAccess: true,
  exportData: true,
  customBranding: true,
  apiAccess: true,
  prioritySupport: true,
};

const mapPlanFromCode = (code?: string): SubscriptionPlan => {
  if (!code) return SubscriptionPlan.PROFESSIONAL;
  const normalized = code.toUpperCase();
  if (normalized.includes('FREE')) return SubscriptionPlan.FREE;
  if (normalized.includes('STARTER')) return SubscriptionPlan.STARTER;
  if (normalized.includes('ENTERPRISE')) return SubscriptionPlan.ENTERPRISE;
  return SubscriptionPlan.PROFESSIONAL;
};

const mapBillingStatus = (status?: string): BillingStatus => {
  if (!status) return BillingStatus.ACTIVE;
  const normalized = status.toUpperCase();
  if (normalized === 'TRIALING') return BillingStatus.TRIAL;
  if (normalized === 'CANCELED') return BillingStatus.CANCELLED;
  if (normalized === 'INCOMPLETE' || normalized === 'PAST_DUE') return BillingStatus.SUSPENDED;
  if (normalized === 'EXPIRED') return BillingStatus.EXPIRED;
  return BillingStatus.ACTIVE;
};

const isActiveBilling = (status: BillingStatus) =>
  status === BillingStatus.ACTIVE || status === BillingStatus.TRIAL;

const estimateByPlan = (plan: SubscriptionPlan) => {
  if (plan === SubscriptionPlan.FREE) return 0;
  if (plan === SubscriptionPlan.STARTER) return 49;
  if (plan === SubscriptionPlan.ENTERPRISE) return 499;
  return 149;
};

const monthlyEquivalent = (plan?: BackendSubscriptionPlan, fallbackPlan?: SubscriptionPlan) => {
  if (!plan) return estimateByPlan(fallbackPlan || SubscriptionPlan.PROFESSIONAL);
  if (plan.billingCycle === 'YEARLY') return Number(plan.price || 0) / 12;
  if (plan.billingCycle === 'QUARTERLY') return Number(plan.price || 0) / 3;
  return Number(plan.price || 0);
};

const getMonthBounds = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const buildHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mapOrganization = (org: BackendOrganization): Organization => ({
  id: org.id,
  name: org.name,
  subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
  billingStatus: BillingStatus.ACTIVE,
  subscriptionStartDate: org.createdAt,
  subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  totalUsers: org.totalUsers,
  maxUsers: 999999,
  features: defaultFeatures,
  createdAt: org.createdAt,
  contactEmail: org.email ?? undefined,
  phone: org.phone ?? undefined,
});

const mapSaasPlan = (plan: any): SaasPlan => ({
  id: plan.id,
  name: plan.name,
  code: plan.code,
  description: plan.description ?? undefined,
  billingCycle: plan.billingCycle,
  price: Number(plan.price || 0),
  currency: plan.currency,
  isActive: Boolean(plan.isActive),
  features: Array.isArray(plan.features) ? plan.features : [],
  limits: plan.limits ?? undefined,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers || {}),
    },
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload as T;
}

const fetchOrganizationsWithSubscriptions = async (): Promise<OrganizationWithSubscription[]> => {
  const res = await request<ApiSuccess<BackendOrganization[]>>('/v1/organizations', { method: 'GET' });
  const organizations = res.data.map(mapOrganization);

  const rows = await Promise.all(
    organizations.map(async (organization) => {
      try {
        const subRes = await request<ApiSuccess<BackendOrganizationSubscription | null>>(
          `/v1/subscriptions/organizations/${organization.id}/current`,
          { method: 'GET' },
        );
        const subscription = subRes.data;

        if (!subscription) {
          return { organization, subscription: null };
        }

        return {
          organization: {
            ...organization,
            subscriptionPlan: mapPlanFromCode(subscription.plan?.code),
            billingStatus: mapBillingStatus(subscription.status),
            subscriptionStartDate: subscription.startDate || organization.subscriptionStartDate,
            subscriptionEndDate:
              subscription.endDate ||
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            maxUsers: subscription.seats || organization.maxUsers,
          },
          subscription,
        };
      } catch {
        return { organization, subscription: null };
      }
    }),
  );

  return rows;
};

const computeStats = (organizations: Organization[]): PlatformStats => {
  const activeOrganizations = organizations.filter((org) =>
    org.billingStatus === BillingStatus.ACTIVE || org.billingStatus === BillingStatus.TRIAL,
  ).length;

  const totalUsers = organizations.reduce((sum, org) => sum + org.totalUsers, 0);

  return {
    totalOrganizations: organizations.length,
    activeOrganizations,
    totalUsers,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    newSignupsThisMonth: organizations.filter((org) => {
      const created = new Date(org.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
  };
};

const buildRevenueSeries = (rows: OrganizationWithSubscription[]): RevenueData[] => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const points: RevenueData[] = [];

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const { start, end } = getMonthBounds(date);

    const newOrgs = rows.filter((row) => {
      const created = new Date(row.organization.createdAt);
      return created.getMonth() === month && created.getFullYear() === year;
    }).length;

    const revenue = rows
      .filter((row) => {
        const status = row.organization.billingStatus;
        if (!isActiveBilling(status)) return false;

        const startDate = new Date(
          row.subscription?.startDate || row.organization.subscriptionStartDate || row.organization.createdAt,
        );
        const endDate = row.subscription?.endDate
          ? new Date(row.subscription.endDate)
          : row.organization.subscriptionEndDate
          ? new Date(row.organization.subscriptionEndDate)
          : null;

        return startDate <= end && (!endDate || endDate >= start);
      })
      .reduce(
        (sum, row) => sum + monthlyEquivalent(row.subscription?.plan, row.organization.subscriptionPlan),
        0,
      );

    points.push({
      month: monthNames[month],
      revenue,
      newOrgs,
    });
  }

  return points;
};

export const superAdminService = {
  async getPlans(activeOnly = false): Promise<SaasPlan[]> {
    const params = new URLSearchParams({ activeOnly: String(activeOnly) });
    const res = await request<ApiSuccess<any[]>>(`/v1/subscriptions/plans?${params.toString()}`, {
      method: 'GET',
    });

    return res.data.map(mapSaasPlan);
  },

  async createPlan(payload: PlanPayload): Promise<SaasPlan> {
    const res = await request<ApiSuccess<any>>('/v1/subscriptions/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return mapSaasPlan(res.data);
  },

  async updatePlan(planId: string, payload: Partial<PlanPayload>): Promise<SaasPlan> {
    const res = await request<ApiSuccess<any>>(`/v1/subscriptions/plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return mapSaasPlan(res.data);
  },

  async deactivatePlan(planId: string): Promise<SaasPlan> {
    const res = await request<ApiSuccess<any>>(`/v1/subscriptions/plans/${planId}`, {
      method: 'DELETE',
    });

    return mapSaasPlan(res.data);
  },

  async deletePlan(planId: string): Promise<SaasPlan> {
    return this.deactivatePlan(planId);
  },

  async runMockCheckout(payload: MockCheckoutPayload): Promise<MockCheckoutResult> {
    const res = await request<ApiSuccess<MockCheckoutResult>>('/v1/subscriptions/mock-checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return res.data;
  },

  async getOrganizationsOnPlan(planId: string, includeInactive = false): Promise<PlanOrganizationSubscription[]> {
    const params = new URLSearchParams({ includeInactive: String(includeInactive) });
    const res = await request<ApiSuccess<PlanOrganizationSubscription[]>>(
      `/v1/subscriptions/plans/${planId}/organizations?${params.toString()}`,
      { method: 'GET' },
    );

    return res.data;
  },

  async cancelOrganizationCurrentSubscription(organizationId: string): Promise<void> {
    await request<ApiSuccess<unknown>>(`/v1/subscriptions/organizations/${organizationId}/current/cancel`, {
      method: 'POST',
    });
  },

  async getAllOrganizations(includeSubscriptionDetails = false): Promise<Organization[]> {
    if (!includeSubscriptionDetails) {
      const res = await request<ApiSuccess<BackendOrganization[]>>('/v1/organizations', { method: 'GET' });
      return res.data.map(mapOrganization);
    }

    const rows = await fetchOrganizationsWithSubscriptions();
    return rows.map((row) => row.organization);
  },

  async getPlatformStats(organizations?: Organization[]): Promise<PlatformStats> {
    const rows = organizations
      ? organizations.map((organization) => ({ organization, subscription: null }))
      : await fetchOrganizationsWithSubscriptions();
    const orgList = rows.map((row) => row.organization);
    const base = computeStats(orgList);

    const monthlyRevenue = rows
      .filter((row) => isActiveBilling(row.organization.billingStatus))
      .reduce(
        (sum, row) => sum + monthlyEquivalent(row.subscription?.plan, row.organization.subscriptionPlan),
        0,
      );

    return {
      ...base,
      monthlyRevenue,
      revenueGrowth:
        base.newSignupsThisMonth > 0
          ? Number(
              ((base.newSignupsThisMonth / Math.max(base.totalOrganizations - base.newSignupsThisMonth, 1)) * 100).toFixed(
                1,
              ),
            )
          : 0,
    };
  },

  async getRevenueData(_organizations?: Organization[]): Promise<RevenueData[]> {
    const rows = _organizations
      ? _organizations.map((organization) => ({ organization, subscription: null }))
      : await fetchOrganizationsWithSubscriptions();
    return buildRevenueSeries(rows);
  },

  async createOrganization(data: CreateOrganizationPayload): Promise<{ organization: Organization; adminUser: User }> {
    const res = await request<ApiSuccess<CreateOrganizationResponse>>('/v1/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const mappedAdmin: User = {
      id: res.data.adminUser.id,
      email: res.data.adminUser.email,
      name: [res.data.adminUser.firstName, res.data.adminUser.lastName].filter(Boolean).join(' ').trim(),
      role: res.data.adminUser.role as User['role'],
      organizationId: res.data.adminUser.organizationId ?? undefined,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    return {
      organization: mapOrganization(res.data.organization),
      adminUser: mappedAdmin,
    };
  },
};
