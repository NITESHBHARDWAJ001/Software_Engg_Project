import { 
  LoginCredentials, 
  RegisterData, 
  LoginResponse, 
  User, 
  UserRole,
  Organization,
  SubscriptionPlan,
  BillingStatus
} from '../../types';
import { generateId } from '../../utils/helpers';

// Mock delay to simulate API call
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Users Database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'superadmin@ethnicfashion.com',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    avatar: undefined,
    phone: '+91 9876543210',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: '2',
    email: 'admin@store1.com',
    name: 'Store Admin',
    role: UserRole.ORG_ADMIN,
    organizationId: 'org-1',
    avatar: undefined,
    phone: '+91 9876543211',
    createdAt: '2024-02-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: '3',
    email: 'manager@store1.com',
    name: 'Sales Manager',
    role: UserRole.MANAGER,
    organizationId: 'org-1',
    avatar: undefined,
    phone: '+91 9876543212',
    createdAt: '2024-03-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: '4',
    email: 'staff@store1.com',
    name: 'Store Staff',
    role: UserRole.STAFF,
    organizationId: 'org-1',
    avatar: undefined,
    phone: '+91 9876543213',
    createdAt: '2024-04-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
];

// Mock Organizations Database
export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Elegant Sarees Pvt Ltd',
    logo: undefined,
    industry: 'Ethnic Fashion',
    website: 'https://elegentsarees.com',
    subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
    billingStatus: BillingStatus.ACTIVE,
    subscriptionStartDate: '2024-01-01T00:00:00Z',
    subscriptionEndDate: '2025-01-01T00:00:00Z',
    totalUsers: 15,
    maxUsers: 15,
    features: {
      maxUsers: 15,
      maxExhibitions: 999999,
      maxCustomers: 999999,
      maxInventoryItems: 999999,
      analyticsAccess: true,
      exportData: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
    },
    createdAt: '2024-01-01T00:00:00Z',
    address: '123 Fashion Street, Mumbai',
    phone: '+91 22 12345678',
    contactEmail: 'contact@elegentsarees.com',
  },
  {
    id: 'org-2',
    name: 'Heritage Textiles',
    logo: undefined,
    industry: 'Ethnic Fashion',
    subscriptionPlan: SubscriptionPlan.STARTER,
    billingStatus: BillingStatus.ACTIVE,
    subscriptionStartDate: '2024-02-01T00:00:00Z',
    subscriptionEndDate: '2025-02-01T00:00:00Z',
    totalUsers: 5,
    maxUsers: 5,
    features: {
      maxUsers: 5,
      maxExhibitions: 10,
      maxCustomers: 500,
      maxInventoryItems: 1000,
      analyticsAccess: true,
      exportData: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
    },
    createdAt: '2024-02-01T00:00:00Z',
    address: '456 Textile Road, Surat',
    phone: '+91 261 2345678',
    contactEmail: 'info@heritagetextiles.com',
  },
];

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    await delay(800);

    const user = mockUsers.find(
      (u) => u.email === credentials.email && u.isActive
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // In real app, verify password here
    // For demo, any password works

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate fake JWT token
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    return {
      user: { ...user },
      token,
    };
  },

  // Register
  async register(data: RegisterData): Promise<LoginResponse> {
    await delay(1000);

    // Check if email already exists
    const existingUser = mockUsers.find((u) => u.email === data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create new organization
    const newOrgId = generateId();
    const selectedPlan =
      data.planId === 'starter'
        ? SubscriptionPlan.STARTER
        : data.planId === 'professional'
        ? SubscriptionPlan.PROFESSIONAL
        : SubscriptionPlan.ENTERPRISE;

    const planFeatures = {
      [SubscriptionPlan.STARTER]: {
        maxUsers: 5,
        maxExhibitions: 10,
        maxCustomers: 500,
        maxInventoryItems: 1000,
        analyticsAccess: true,
        exportData: false,
        customBranding: false,
        apiAccess: false,
        prioritySupport: false,
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        maxUsers: 15,
        maxExhibitions: 999999,
        maxCustomers: 999999,
        maxInventoryItems: 999999,
        analyticsAccess: true,
        exportData: true,
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
      },
      [SubscriptionPlan.ENTERPRISE]: {
        maxUsers: 999999,
        maxExhibitions: 999999,
        maxCustomers: 999999,
        maxInventoryItems: 999999,
        analyticsAccess: true,
        exportData: true,
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
      },
    };

    const newOrg: Organization = {
      id: newOrgId,
      name: data.organizationName,
      subscriptionPlan: selectedPlan,
      billingStatus: BillingStatus.TRIAL,
      subscriptionStartDate: new Date().toISOString(),
      subscriptionEndDate: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(), // 14 days trial
      totalUsers: 1,
      maxUsers: planFeatures[selectedPlan].maxUsers,
      features: planFeatures[selectedPlan],
      createdAt: new Date().toISOString(),
    };

    mockOrganizations.push(newOrg);

    // Create new user as org admin
    const newUserId = generateId();
    const newUser: User = {
      id: newUserId,
      email: data.email,
      name: data.adminName,
      role: UserRole.ORG_ADMIN,
      organizationId: newOrgId,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
    };

    mockUsers.push(newUser);

    // Generate token
    const token = `mock-jwt-token-${newUserId}-${Date.now()}`;

    return {
      user: newUser,
      token,
    };
  },

  // Logout
  async logout(): Promise<void> {
    await delay(300);
    // In real app, invalidate token on server
  },

  // Get current user (verify token)
  async getCurrentUser(token: string): Promise<User> {
    await delay(500);

    // Extract user ID from mock token
    const userId = token.split('-')[3];
    const user = mockUsers.find((u) => u.id === userId);

    if (!user) {
      throw new Error('Invalid token');
    }

    return { ...user };
  },

  // Demo: Get all mock users (for demo purposes)
  getDemoUsers(): Array<{ email: string; role: UserRole; password: string }> {
    return [
      {
        email: 'superadmin@ethnicfashion.com',
        role: UserRole.SUPER_ADMIN,
        password: 'demo123',
      },
      {
        email: 'admin@store1.com',
        role: UserRole.ORG_ADMIN,
        password: 'demo123',
      },
      {
        email: 'manager@store1.com',
        role: UserRole.MANAGER,
        password: 'demo123',
      },
      {
        email: 'staff@store1.com',
        role: UserRole.STAFF,
        password: 'demo123',
      },
    ];
  },
};
