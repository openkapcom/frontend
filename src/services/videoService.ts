import apiClient from './apiClient';
import type { Video, Comment, ZoomEvent, ZoomSettings } from '@/types';

export const videoService = {
  async getVideos(params?: { search?: string; sort?: string; folder_id?: number }): Promise<Video[]> {
    const { data } = await apiClient.get('/api/videos', { params });
    return data.data || data;
  },

  async getFavourites(): Promise<Video[]> {
    const { data } = await apiClient.get('/api/videos/favourites');
    return data.data || data;
  },

  async getVideo(id: number): Promise<Video> {
    const { data } = await apiClient.get(`/api/videos/${id}`);
    return data.data || data;
  },

  async uploadVideo(formData: FormData, onProgress?: (p: number) => void): Promise<Video> {
    const { data } = await apiClient.post('/api/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return data.data || data;
  },

  async updateVideo(id: number, payload: { title?: string; description?: string }): Promise<Video> {
    const { data } = await apiClient.put(`/api/videos/${id}`, payload);
    return data.data || data;
  },

  async deleteVideo(id: number): Promise<void> {
    await apiClient.delete(`/api/videos/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post('/api/videos/bulk-delete', { video_ids: ids });
  },

  async bulkFavourite(ids: number[]): Promise<void> {
    await apiClient.post('/api/videos/bulk-favourite', { video_ids: ids });
  },

  async bulkUnfavourite(ids: number[]): Promise<void> {
    await apiClient.delete('/api/videos/bulk-favourite', { data: { video_ids: ids } });
  },

  async toggleSharing(id: number): Promise<Video> {
    const { data } = await apiClient.post(`/api/videos/${id}/toggle-sharing`);
    return data.data || data;
  },

  async toggleFavourite(id: number): Promise<Video> {
    const { data } = await apiClient.post(`/api/videos/${id}/toggle-favourite`);
    return data.data || data;
  },

  async regenerateToken(id: number): Promise<{ share_token: string }> {
    const { data } = await apiClient.post(`/api/videos/${id}/regenerate-token`);
    return data;
  },

  // Comments
  async getComments(id: number): Promise<Comment[]> {
    const { data } = await apiClient.get(`/api/videos/${id}/comments`);
    return data.data || data;
  },

  async addComment(id: number, body: string, timestamp?: number): Promise<Comment> {
    const { data } = await apiClient.post(`/api/videos/${id}/comments`, { body, timestamp });
    return data.data || data;
  },

  async deleteComment(videoId: number, commentId: number): Promise<void> {
    await apiClient.delete(`/api/videos/${videoId}/comments/${commentId}`);
  },

  // Reactions
  async getReactions(id: number): Promise<{ emoji: string; count: number }[]> {
    const { data } = await apiClient.get(`/api/videos/${id}/reactions`);
    return data.data || data;
  },

  async addReaction(id: number, emoji: string): Promise<void> {
    await apiClient.post(`/api/videos/${id}/reactions`, { emoji });
  },

  // Views
  async recordView(id: number): Promise<void> {
    await apiClient.post(`/api/videos/${id}/view`);
  },

  async getStats(id: number): Promise<{ views: number; unique_viewers: number; avg_watch_time: number }> {
    const { data } = await apiClient.get(`/api/videos/${id}/stats`);
    return data;
  },

  // Transcription
  async requestTranscription(id: number): Promise<void> {
    await apiClient.post(`/api/videos/${id}/transcription`);
  },

  async getTranscription(id: number): Promise<{ text: string; status: string }> {
    const { data } = await apiClient.get(`/api/videos/${id}/transcription`);
    return data;
  },

  async updateTranscription(id: number, text: string): Promise<void> {
    await apiClient.put(`/api/videos/${id}/transcription`, { text });
  },

  async getTranscriptionStatus(id: number): Promise<{ status: string }> {
    const { data } = await apiClient.get(`/api/videos/${id}/transcription/status`);
    return data;
  },

  // Summary
  async requestSummary(id: number): Promise<void> {
    await apiClient.post(`/api/videos/${id}/summary`);
  },

  async getSummary(id: number): Promise<{ text: string }> {
    const { data } = await apiClient.get(`/api/videos/${id}/summary`);
    return data;
  },

  // Zoom
  async updateZoomSettings(id: number, settings: ZoomSettings): Promise<void> {
    await apiClient.put(`/api/videos/${id}/zoom-settings`, settings);
  },

  async getZoomEvents(id: number): Promise<ZoomEvent[]> {
    const { data } = await apiClient.get(`/api/videos/${id}/zoom-events`);
    return data.data || data;
  },

  async updateZoomEvents(id: number, events: ZoomEvent[]): Promise<void> {
    await apiClient.put(`/api/videos/${id}/zoom-events`, { events });
  },

  async getZoomStatus(id: number): Promise<{ status: string }> {
    const { data } = await apiClient.get(`/api/videos/${id}/zoom-status`);
    return data;
  },

  // Editor
  async applyEdits(id: number, edits: Record<string, unknown>): Promise<void> {
    await apiClient.post(`/api/videos/${id}/apply-edits`, edits);
  },

  async getEditStatus(id: number): Promise<{ status: string; progress?: number }> {
    const { data } = await apiClient.get(`/api/videos/${id}/edit-status`);
    return data;
  },

  // Trim
  async trimVideo(id: number, start: number, end: number): Promise<void> {
    await apiClient.post(`/api/videos/${id}/trim`, { start, end });
  },

  // Blur
  async applyBlur(id: number, regions: Record<string, unknown>[]): Promise<void> {
    await apiClient.post(`/api/videos/${id}/blur`, { regions });
  },

  async getBlurStatus(id: number): Promise<{ status: string }> {
    const { data } = await apiClient.get(`/api/videos/${id}/blur-status`);
    return data;
  },

  // Conversion
  async getConversionStatus(id: number): Promise<{ status: string }> {
    const { data } = await apiClient.get(`/api/videos/${id}/conversion-status`);
    return data;
  },

  // MP4 download
  async requestDownloadMp4(id: number): Promise<void> {
    await apiClient.post(`/api/videos/${id}/request-download-mp4`);
  },

  async downloadMp4(id: number): Promise<Blob> {
    const { data } = await apiClient.get(`/api/videos/${id}/download-mp4`, { responseType: 'blob' });
    return data;
  },

  // Stream URL helpers
  getStreamUrl(id: number): string {
    const token = localStorage.getItem('auth_token');
    return `${apiClient.defaults.baseURL}/api/videos/${id}/stream?token=${token}`;
  },

  getHlsUrl(id: number): string {
    const token = localStorage.getItem('auth_token');
    return `${apiClient.defaults.baseURL}/api/videos/${id}/hls/master.m3u8?token=${token}`;
  },

  // Shared video endpoints
  async getSharedVideo(token: string): Promise<Video> {
    const { data } = await apiClient.get(`/api/share/video/${token}`);
    return data.data || data;
  },

  async getSharedComments(token: string): Promise<Comment[]> {
    const { data } = await apiClient.get(`/api/share/video/${token}/comments`);
    return data.data || data;
  },

  async addSharedComment(token: string, body: string, timestamp?: number): Promise<Comment> {
    const { data } = await apiClient.post(`/api/share/video/${token}/comments`, { body, timestamp });
    return data.data || data;
  },

  async recordSharedView(token: string): Promise<void> {
    await apiClient.post(`/api/share/video/${token}/view`);
  },

  getSharedStreamUrl(token: string): string {
    return `${apiClient.defaults.baseURL}/api/share/video/${token}/stream`;
  },

  getSharedHlsUrl(token: string): string {
    return `${apiClient.defaults.baseURL}/api/share/video/${token}/hls/master.m3u8`;
  },

  getSharedCaptionsUrl(token: string): string {
    return `${apiClient.defaults.baseURL}/api/share/video/${token}/captions.vtt`;
  },
};
