import apiClient from './apiClient';
import type { User } from '@/types';

export const profileService = {
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get('/api/profile');
    return data.data || data;
  },

  async updateProfile(formData: FormData): Promise<User> {
    const { data } = await apiClient.post('/api/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data || data;
  },

  async deleteAvatar(): Promise<void> {
    await apiClient.delete('/api/profile/avatar');
  },
};
