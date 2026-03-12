import apiClient from './apiClient';

export const streamService = {
  async startSession(): Promise<{ session_id: string }> {
    const { data } = await apiClient.post('/api/stream/start');
    return data;
  },

  async uploadChunk(sessionId: string, chunk: Blob, chunkIndex: number): Promise<void> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunk_index', String(chunkIndex));
    await apiClient.post(`/api/stream/${sessionId}/chunk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async completeSession(sessionId: string, title?: string): Promise<{ video_id: number }> {
    const { data } = await apiClient.post(`/api/stream/${sessionId}/complete`, { title });
    return data;
  },

  async cancelSession(sessionId: string): Promise<void> {
    await apiClient.post(`/api/stream/${sessionId}/cancel`);
  },

  async getSessionStatus(sessionId: string): Promise<{ status: string }> {
    const { data } = await apiClient.get(`/api/stream/${sessionId}/status`);
    return data;
  },
};
