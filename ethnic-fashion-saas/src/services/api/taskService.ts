import { Task, TaskStatus } from '../../types';
import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

type TaskCreatePayload = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Task['priority'];
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  attachments?: string[];
  relatedExhibitionId?: string;
  relatedCustomerId?: string;
};

type TaskUpdatePayload = Partial<TaskCreatePayload>;

type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
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

type TaskStats = {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  completed: number;
  overdue: number;
};

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload as T;
}

export const taskService = {
  async getAllTasks(_organizationId: string): Promise<Task[]> {
    const res = await apiRequest<ApiPaged<Task[]>>('/v1/tasks?page=1&pageSize=100');
    return res.data;
  },

  async getTaskById(taskId: string): Promise<Task | null> {
    const res = await apiRequest<ApiSuccess<Task>>(`/v1/tasks/${taskId}`);
    return res.data;
  },

  async getTasksByStatus(_organizationId: string, status: TaskStatus): Promise<Task[]> {
    const res = await apiRequest<ApiPaged<Task[]>>(`/v1/tasks?page=1&pageSize=100&status=${status}`);
    return res.data;
  },

  async getTasksByUser(userId: string): Promise<Task[]> {
    const res = await apiRequest<ApiPaged<Task[]>>(`/v1/tasks?page=1&pageSize=100&assignedTo=${userId}`);
    return res.data;
  },

  async getTaskStats(): Promise<TaskStats> {
    const res = await apiRequest<ApiSuccess<TaskStats>>('/v1/tasks/stats');
    return res.data;
  },

  async createTask(taskData: TaskCreatePayload): Promise<Task> {
    const res = await apiRequest<ApiSuccess<Task>>('/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return res.data;
  },

  async updateTask(taskId: string, updates: TaskUpdatePayload): Promise<Task> {
    const res = await apiRequest<ApiSuccess<Task>>(`/v1/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiRequest<ApiSuccess<{ id: string }>>(`/v1/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const res = await apiRequest<ApiSuccess<Task>>(`/v1/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },
};
