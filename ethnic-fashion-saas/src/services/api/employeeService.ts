import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'TEMPORARY';

export type Employee = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  jobTitle?: string | null;
  role: string;
  isActive: boolean;
  employmentType?: EmploymentType | null;
  employmentValidFrom?: string | null;
  employmentValidTo?: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId?: string | null;
};

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type ApiPaged<T> = {
  success: true;
  data: T;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  employmentType: EmploymentType;
  employmentValidFrom?: string;
  employmentValidTo?: string;
  password: string;
};

export type UpdateEmployeePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  employmentType?: EmploymentType;
  employmentValidFrom?: string | null;
  employmentValidTo?: string | null;
  isActive?: boolean;
};

export type EmployeeModuleKey =
  | 'CUSTOMER_MANAGEMENT'
  | 'INVENTORY_MANAGEMENT'
  | 'FINANCE_MANAGEMENT'
  | 'TASK_MANAGEMENT'
  | 'EXHIBITION_MANAGEMENT'
  | 'ANALYTICS_MANAGEMENT';

export type EmployeeModulePolicy = {
  allowed: boolean;
  limits?: Record<string, string | number | boolean>;
};

export type EmployeeModuleAccess = {
  employeeId: string;
  moduleAccessPolicies: Record<EmployeeModuleKey, EmployeeModulePolicy>;
};

const buildHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers || {}),
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload as T;
}

export const employeeService = {
  async getEmployees(): Promise<Employee[]> {
    const res = await request<ApiPaged<Employee[]>>('/v1/employees?page=1&pageSize=100');
    return res.data;
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
    const res = await request<ApiSuccess<Employee>>('/v1/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateEmployee(employeeId: string, payload: UpdateEmployeePayload): Promise<Employee> {
    const res = await request<ApiSuccess<Employee>>(`/v1/employees/${employeeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateEmployeeStatus(employeeId: string, isActive: boolean): Promise<Employee> {
    const res = await request<ApiSuccess<Employee>>(`/v1/employees/${employeeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return res.data;
  },

  async getEmployeeModuleAccess(employeeId: string): Promise<EmployeeModuleAccess> {
    const res = await request<ApiSuccess<EmployeeModuleAccess>>(`/v1/employees/${employeeId}/module-access`);
    return res.data;
  },

  async updateEmployeeModuleAccess(
    employeeId: string,
    moduleAccessPolicies: Record<EmployeeModuleKey, EmployeeModulePolicy>
  ): Promise<EmployeeModuleAccess> {
    const res = await request<ApiSuccess<EmployeeModuleAccess>>(`/v1/employees/${employeeId}/module-access`, {
      method: 'PATCH',
      body: JSON.stringify({ moduleAccessPolicies }),
    });
    return res.data;
  },
};
