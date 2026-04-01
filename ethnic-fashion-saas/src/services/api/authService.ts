import {
  BillingStatus,
  type LoginCredentials,
  type LoginResponse,
  type Organization,
  type RegisterData,
  SubscriptionPlan,
  type User,
  UserRole,
} from '../../types';
import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type BackendAuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string | null;
};

type BackendLoginPayload = {
  accessToken: string;
  refreshToken: string;
  user: BackendAuthUser;
};

type BackendRefreshPayload = {
  accessToken: string;
  refreshToken: string;
};

type BackendOrganization = {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendSubscriptionPlan = {
  code: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price: number;
  limits?: Record<string, unknown> | null;
};

type BackendCurrentSubscription = {
  status: string;
  startDate: string;
  endDate?: string | null;
  seats?: number | null;
  plan?: BackendSubscriptionPlan;
  effectiveFeatures?: string[];
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

const toUserRole = (role: string): UserRole => {
  if (role === UserRole.SUPER_ADMIN) return UserRole.SUPER_ADMIN;
  if (role === UserRole.ORG_ADMIN) return UserRole.ORG_ADMIN;
  return UserRole.STAFF;
};

const mapUser = (user: BackendAuthUser): User => ({
  id: user.id,
  email: user.email,
  name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email,
  role: toUserRole(user.role),
  organizationId: user.organizationId ?? undefined,
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  isActive: true,
});

const mapOrganization = (org: BackendOrganization): Organization => ({
  id: org.id,
  name: org.name,
  subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
  billingStatus: BillingStatus.ACTIVE,
  subscriptionStartDate: org.createdAt,
  subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  totalUsers: 1,
  maxUsers: 999999,
  features: defaultFeatures,
  createdAt: org.createdAt,
  contactEmail: org.email ?? undefined,
  phone: org.phone ?? undefined,
});

const mapPlanFromCode = (code?: string): SubscriptionPlan => {
  if (!code) return SubscriptionPlan.PROFESSIONAL;
  const normalized = code.toUpperCase();
  if (normalized.includes('FREE')) return SubscriptionPlan.FREE;
  if (normalized.includes('STARTER') || normalized.includes('BASIC')) return SubscriptionPlan.STARTER;
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

const toBoolean = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mergeOrganizationWithSubscription = (
  organization: Organization,
  subscription: BackendCurrentSubscription | null,
): Organization => {
  if (!subscription) {
    return organization;
  }

  const limits = subscription.plan?.limits ?? {};
  return {
    ...organization,
    subscriptionPlan: mapPlanFromCode(subscription.plan?.code),
    billingStatus: mapBillingStatus(subscription.status),
    subscriptionStartDate: subscription.startDate || organization.subscriptionStartDate,
    subscriptionEndDate:
      subscription.endDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    maxUsers: subscription.seats || toNumber((limits as Record<string, unknown>).maxUsers, organization.maxUsers),
    features: {
      ...organization.features,
      maxUsers: toNumber((limits as Record<string, unknown>).maxUsers, organization.features.maxUsers),
      maxExhibitions: toNumber((limits as Record<string, unknown>).maxExhibitions, organization.features.maxExhibitions),
      maxCustomers: toNumber((limits as Record<string, unknown>).maxCustomers, organization.features.maxCustomers),
      maxInventoryItems: toNumber(
        (limits as Record<string, unknown>).maxInventoryItems,
        organization.features.maxInventoryItems,
      ),
      analyticsAccess: toBoolean((limits as Record<string, unknown>).analyticsAccess, organization.features.analyticsAccess),
      exportData: toBoolean((limits as Record<string, unknown>).exportData, organization.features.exportData),
      customBranding: toBoolean((limits as Record<string, unknown>).customBranding, organization.features.customBranding),
      apiAccess: toBoolean((limits as Record<string, unknown>).apiAccess, organization.features.apiAccess),
      prioritySupport: toBoolean((limits as Record<string, unknown>).prioritySupport, organization.features.prioritySupport),
    },
  };
};

const buildAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload as T;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await apiRequest<ApiSuccess<BackendLoginPayload>>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    return {
      user: mapUser(res.data.user),
      token: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    };
  },

  async refresh(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const res = await apiRequest<ApiSuccess<BackendRefreshPayload>>('/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    return {
      token: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    };
  },

  async logout(): Promise<void> {
    const { refreshToken, token, logout } = useAuthStore.getState();

    if (!refreshToken) {
      logout();
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: buildAuthHeaders(token ?? undefined),
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      logout();
    }
  },

  async getCurrentOrganization(): Promise<Organization | null> {
    const token = useAuthStore.getState().token;
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/v1/organizations/me`, {
        method: 'GET',
        headers: buildAuthHeaders(token),
      });

      if (!res.ok) {
        return null;
      }

      const payload = (await res.json()) as ApiSuccess<BackendOrganization>;
      const organization = mapOrganization(payload.data);

      try {
        const subRes = await fetch(`${API_BASE_URL}/v1/subscriptions/me/current`, {
          method: 'GET',
          headers: buildAuthHeaders(token),
        });

        if (!subRes.ok) {
          return organization;
        }

        const subscriptionPayload =
          (await subRes.json()) as ApiSuccess<BackendCurrentSubscription | null>;
        return mergeOrganizationWithSubscription(organization, subscriptionPayload.data);
      } catch {
        return organization;
      }
    } catch {
      return null;
    }
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const res = await apiRequest<ApiSuccess<BackendLoginPayload>>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        organizationName: data.organizationName,
        adminName: data.adminName,
        email: data.email,
        password: data.password,
        planId: data.planId,
      }),
    });

    return {
      user: mapUser(res.data.user),
      token: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    };
  },
};
