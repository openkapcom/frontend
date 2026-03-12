import apiClient from './apiClient';
import type { Screenshot } from '@/types';

export const screenshotService = {
  async getScreenshots(): Promise<Screenshot[]> {
    const { data } = await apiClient.get('/api/screenshots');
    return data.data || data;
  },

  async uploadScreenshot(formData: FormData): Promise<Screenshot> {
    const { data } = await apiClient.post('/api/screenshots', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data || data;
  },

  async getScreenshot(id: number): Promise<Screenshot> {
    const { data } = await apiClient.get(`/api/screenshots/${id}`);
    return data.data || data;
  },

  async updateScreenshot(id: number, payload: { title?: string }): Promise<Screenshot> {
    const { data } = await apiClient.put(`/api/screenshots/${id}`, payload);
    return data.data || data;
  },

  async deleteScreenshot(id: number): Promise<void> {
    await apiClient.delete(`/api/screenshots/${id}`);
  },

  async toggleSharing(id: number): Promise<Screenshot> {
    const { data } = await apiClient.post(`/api/screenshots/${id}/toggle-sharing`);
    return data.data || data;
  },

  async getSharedScreenshot(token: string): Promise<Screenshot> {
    const { data } = await apiClient.get(`/api/share/screenshot/${token}`);
    return data.data || data;
  },
};
