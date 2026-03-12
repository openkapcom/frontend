import apiClient from './apiClient';
import type { UserSettings } from '@/types';

export const settingsService = {
  async getPublicSettings(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get('/api/settings');
    return data;
  },

  async getUserSettings(): Promise<UserSettings> {
    const { data } = await apiClient.get('/api/user/settings');
    return data.data || data;
  },

  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const { data } = await apiClient.put('/api/user/settings', settings);
    return data.data || data;
  },

  async resetUserSettings(): Promise<UserSettings> {
    const { data } = await apiClient.post('/api/user/settings/reset');
    return data.data || data;
  },

  async uploadLogo(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await apiClient.post('/api/user/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async removeLogo(): Promise<void> {
    await apiClient.delete('/api/user/settings/logo');
  },
};
