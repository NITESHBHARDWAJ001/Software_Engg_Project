export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface SelectOption {
  label: string;
  value: string;
  icon?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface PermissionConfig {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface ModulePermissions {
  dashboard: PermissionConfig;
  tasks: PermissionConfig;
  exhibitions: PermissionConfig;
  customers: PermissionConfig;
  inventory: PermissionConfig;
  finance: PermissionConfig;
  marketing: PermissionConfig;
  analytics: PermissionConfig;
  settings: PermissionConfig;
  users: PermissionConfig;
}
