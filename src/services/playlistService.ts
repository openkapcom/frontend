import apiClient, { unwrap, unwrapArray } from './apiClient';
import type { Playlist } from '@/types';

export const playlistService = {
  async getPlaylists(): Promise<Playlist[]> {
    const { data } = await apiClient.get('/api/playlists');
    return unwrapArray<Playlist>(data);
  },

  async createPlaylist(name: string, description?: string): Promise<Playlist> {
    const { data } = await apiClient.post('/api/playlists', { name, description });
    return unwrap<Playlist>(data);
  },

  async getPlaylist(id: number): Promise<Playlist> {
    const { data } = await apiClient.get(`/api/playlists/${id}`);
    return unwrap<Playlist>(data);
  },

  async updatePlaylist(id: number, payload: { name?: string; description?: string }): Promise<Playlist> {
    const { data } = await apiClient.put(`/api/playlists/${id}`, payload);
    return unwrap<Playlist>(data);
  },

  async deletePlaylist(id: number): Promise<void> {
    await apiClient.delete(`/api/playlists/${id}`);
  },

  async toggleSharing(id: number): Promise<Playlist> {
    const { data } = await apiClient.post(`/api/playlists/${id}/toggle-sharing`);
    return unwrap<Playlist>(data);
  },

  async setPassword(id: number, password: string | null): Promise<void> {
    await apiClient.put(`/api/playlists/${id}/password`, { password });
  },

  async setSortBy(id: number, sortBy: string): Promise<void> {
    await apiClient.put(`/api/playlists/${id}/sort-by`, { sort_by: sortBy });
  },

  async addVideo(playlistId: number, videoId: number): Promise<void> {
    await apiClient.post(`/api/playlists/${playlistId}/videos`, { video_id: videoId });
  },

  async bulkAddVideos(playlistId: number, videoIds: number[]): Promise<void> {
    await apiClient.post(`/api/playlists/${playlistId}/bulk-add-videos`, { video_ids: videoIds });
  },

  async removeVideo(playlistId: number, videoId: number): Promise<void> {
    await apiClient.delete(`/api/playlists/${playlistId}/videos/${videoId}`);
  },

  async reorderVideos(playlistId: number, videoIds: number[]): Promise<void> {
    await apiClient.put(`/api/playlists/${playlistId}/reorder`, { video_ids: videoIds });
  },

  // Shared playlist
  async getSharedPlaylist(token: string, password?: string): Promise<Playlist> {
    const { data } = await apiClient.get(`/api/share/playlist/${token}`, {
      params: password ? { password } : undefined,
    });
    return unwrap<Playlist>(data);
  },
};
