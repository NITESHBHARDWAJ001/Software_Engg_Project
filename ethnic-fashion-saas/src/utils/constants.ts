export const APP_NAME = 'OperIQ';
export const APP_DESCRIPTION = 'Comprehensive business management platform by OperIQ';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const ROUTES = {
  // Marketing
  HOME: '/',
  
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Super Admin
  SUPER_ADMIN: '/super-admin',
  SUPER_ADMIN_DASHBOARD: '/super-admin/dashboard',
  SUPER_ADMIN_ORGANIZATIONS: '/super-admin/organizations',
  SUPER_ADMIN_PLANS: '/super-admin/plans',
  SUPER_ADMIN_ANALYTICS: '/super-admin/analytics',
  
  // Organization App
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  TASKS: '/app/tasks',
  TASKS_LIST: '/app/tasks/list',
  TASKS_KANBAN: '/app/tasks/kanban',
  TASKS_CALENDAR: '/app/tasks/calendar',
  EXHIBITIONS: '/app/exhibitions',
  EXHIBITION_DETAIL: '/app/exhibitions/:id',
  EXHIBITION_LEAD_CAPTURE: '/app/exhibitions/:id/capture',
  CUSTOMERS: '/app/customers',
  EMPLOYEES: '/app/employees',
  CUSTOMER_DETAIL: '/app/customers/:id',
  INVENTORY: '/app/inventory',
  INVENTORY_CATEGORIES: '/app/inventory/categories',
  FINANCE: '/app/finance',
  FINANCE_TRANSACTIONS: '/app/finance/transactions',
  FINANCE_INVOICES: '/app/finance/invoices',
  MARKETING: '/app/marketing',
  ANALYTICS: '/app/analytics',
  SETTINGS: '/app/settings',
  SETTINGS_PROFILE: '/app/settings/profile',
  SETTINGS_ORGANIZATION: '/app/settings/organization',
  SETTINGS_USERS: '/app/settings/users',
  SETTINGS_SUBSCRIPTION: '/app/settings/subscription',
} as const;

export const COLORS = {
  primary: '#7B2CBF',
  primaryDark: '#5A189A',
  primaryLight: '#9D4EDD',
  accentGold: '#D4AF37',
  background: '#F9F7FC',
  surface: '#FFFFFF',
} as const;

export const DATE_FORMATS = {
  SHORT: 'MMM DD, YYYY',
  LONG: 'MMMM DD, YYYY',
  FULL: 'MMMM DD, YYYY HH:mm',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_LIMITS: [10, 25, 50, 100],
} as const;

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
} as const;
