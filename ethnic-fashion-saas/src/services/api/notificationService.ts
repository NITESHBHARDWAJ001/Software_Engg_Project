import { Notification } from '../../types';
import { API_BASE_URL } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';

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

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload as T;
}

export const notificationService = {
  async getNotifications(read?: boolean): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (read !== undefined) {
      params.append('read', String(read));
    }
    const res = await apiRequest<{ data: Notification[] }>(
      `/v1/notifications?${params.toString()}`,
      { method: 'GET' }
    );
    return res.data || [];
  },

  async getUnreadNotifications(): Promise<Notification[]> {
    return this.getNotifications(false);
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const res = await apiRequest<Notification>(
      `/v1/notifications/${notificationId}/read`,
      { method: 'PATCH' }
    );
    return res;
  },

  async markAllAsRead(): Promise<void> {
    await apiRequest('/v1/notifications/read-all', { method: 'PATCH' });
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await apiRequest(`/v1/notifications/${notificationId}`, { method: 'DELETE' });
  },

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    link?: string;
  }): Promise<Notification> {
    const res = await apiRequest<Notification>('/v1/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },
};
