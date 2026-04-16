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

type RawTask = Omit<Task, 'status'> & {
  status: string;
};

type TaskStats = {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  completed: number;
  overdue: number;
};

export type TaskBoardScope = 'MY' | 'GLOBAL';

const normalizeTaskStatus = (status: string): TaskStatus => {
  const normalized = String(status || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (normalized === TaskStatus.IN_PROGRESS) return TaskStatus.IN_PROGRESS;
  if (normalized === TaskStatus.REVIEW) return TaskStatus.REVIEW;
  if (normalized === TaskStatus.COMPLETED) return TaskStatus.COMPLETED;
  if (normalized === TaskStatus.CANCELLED) return TaskStatus.CANCELLED;
  return TaskStatus.TODO;
};

const mapTask = (task: RawTask): Task => ({
  ...task,
  status: normalizeTaskStatus(task.status),
});

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
  async getAllTasks(_organizationId: string, scope: TaskBoardScope = 'GLOBAL'): Promise<Task[]> {
    const res = await apiRequest<ApiPaged<RawTask[]>>(`/v1/tasks?page=1&pageSize=100&scope=${scope}`);
    return res.data.map(mapTask);
  },

  async getTaskById(taskId: string): Promise<Task | null> {
    const res = await apiRequest<ApiSuccess<RawTask>>(`/v1/tasks/${taskId}`);
    return mapTask(res.data);
  },

  async getTasksByStatus(_organizationId: string, status: TaskStatus): Promise<Task[]> {
    const res = await apiRequest<ApiPaged<RawTask[]>>(`/v1/tasks?page=1&pageSize=100&status=${status}`);
    return res.data.map(mapTask);
  },

  async getTasksByUser(_userId: string): Promise<Task[]> {
    const res = await apiRequest<ApiPaged<RawTask[]>>('/v1/tasks?page=1&pageSize=100&scope=MY');
    return res.data.map(mapTask);
  },

  async getTaskStats(scope: TaskBoardScope = 'GLOBAL'): Promise<TaskStats> {
    const res = await apiRequest<ApiSuccess<TaskStats>>(`/v1/tasks/stats?scope=${scope}`);
    return res.data;
  },

  async createTask(taskData: TaskCreatePayload): Promise<Task> {
    const res = await apiRequest<ApiSuccess<RawTask>>('/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return mapTask(res.data);
  },

  async updateTask(taskId: string, updates: TaskUpdatePayload): Promise<Task> {
    const res = await apiRequest<ApiSuccess<RawTask>>(`/v1/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return mapTask(res.data);
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiRequest<ApiSuccess<{ id: string }>>(`/v1/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const res = await apiRequest<ApiSuccess<RawTask>>(`/v1/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return mapTask(res.data);
  },
};
