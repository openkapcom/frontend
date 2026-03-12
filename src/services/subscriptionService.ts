import apiClient from './apiClient';
import type { SubscriptionStatus } from '@/types';

export const subscriptionService = {
  async getStatus(): Promise<SubscriptionStatus> {
    const { data } = await apiClient.get('/api/subscription/status');
    return data.data || data;
  },

  async getCheckoutUrl(plan: string, interval: string): Promise<string> {
    const { data } = await apiClient.get('/api/subscription/checkout-url', {
      params: { plan, interval },
    });
    return data.url;
  },

  async handleCheckoutSuccess(sessionId: string): Promise<void> {
    await apiClient.post('/api/subscription/checkout/success', { session_id: sessionId });
  },

  async cancel(): Promise<void> {
    await apiClient.post('/api/subscription/cancel');
  },

  async getPortalUrl(): Promise<string> {
    const { data } = await apiClient.get('/api/subscription/portal');
    return data.url;
  },

  async getHistory(): Promise<Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  }>> {
    const { data } = await apiClient.get('/api/subscription/history');
    return data.data || data;
  },
};
