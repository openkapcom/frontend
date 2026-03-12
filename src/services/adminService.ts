import apiClient from './apiClient';
import type { AdminStats } from '@/types';

export const adminService = {
  async getDashboardStats(): Promise<AdminStats> {
    const { data } = await apiClient.get('/api/admin/dashboard');
    return data.data || data;
  },
};
