import apiClient from './apiClient';
import type { Feedback } from '@/types';

export const feedbackService = {
  async getFeedback(): Promise<Feedback[]> {
    const { data } = await apiClient.get('/api/feedback');
    return data.data || data;
  },

  async submitFeedback(payload: { type: string; subject: string; message: string }): Promise<Feedback> {
    const { data } = await apiClient.post('/api/feedback', payload);
    return data.data || data;
  },

  async deleteFeedback(id: number): Promise<void> {
    await apiClient.delete(`/api/feedback/${id}`);
  },
};
