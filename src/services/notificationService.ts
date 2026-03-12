import apiClient, { unwrapArray } from './apiClient';
import type { Notification } from '@/types';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const { data } = await apiClient.get('/api/notifications');
    return unwrapArray<Notification>(data);
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get('/api/notifications/unread-count');
    return data.count;
  },

  async markAllRead(): Promise<void> {
    await apiClient.post('/api/notifications/mark-all-read');
  },

  async markRead(id: number): Promise<void> {
    await apiClient.post(`/api/notifications/${id}/read`);
  },

  async deleteNotification(id: number): Promise<void> {
    await apiClient.delete(`/api/notifications/${id}`);
  },
};
