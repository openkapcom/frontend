import apiClient from './apiClient';
import type { Integration, IntegrationTarget } from '@/types';

export const integrationService = {
  async getIntegrations(): Promise<Integration[]> {
    const { data } = await apiClient.get('/api/integrations');
    return data.data || data;
  },

  async getProviders(): Promise<Integration[]> {
    const { data } = await apiClient.get('/api/integrations/providers');
    return data.data || data;
  },

  async getConnectUrl(provider: string): Promise<string> {
    const { data } = await apiClient.get(`/api/integrations/${provider}/connect`);
    return data.url;
  },

  async disconnect(provider: string): Promise<void> {
    await apiClient.delete(`/api/integrations/${provider}`);
  },

  async getTargets(provider: string): Promise<IntegrationTarget[]> {
    const { data } = await apiClient.get(`/api/integrations/${provider}/targets`);
    return data.data || data;
  },

  async shareVideo(provider: string, videoId: number, targetId: string, message?: string): Promise<void> {
    await apiClient.post(`/api/integrations/${provider}/videos/${videoId}/share`, {
      target_id: targetId,
      message,
    });
  },

  async createBug(provider: string, videoId: number, payload: {
    target_id: string;
    title: string;
    description: string;
  }): Promise<void> {
    await apiClient.post(`/api/integrations/${provider}/videos/${videoId}/bug`, payload);
  },

  async getShareHistory(videoId: number): Promise<Array<{
    provider: string;
    target_name: string;
    shared_at: string;
  }>> {
    const { data } = await apiClient.get(`/api/integrations/videos/${videoId}/history`);
    return data.data || data;
  },

  async handleTrelloCallback(token: string): Promise<void> {
    await apiClient.get(`/api/integrations/trello/callback`, { params: { token } });
  },
};
