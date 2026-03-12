import apiClient from './apiClient';
import type { Folder, Video } from '@/types';

export const folderService = {
  async getFolders(): Promise<Folder[]> {
    const { data } = await apiClient.get('/api/folders');
    return data.data || data;
  },

  async createFolder(name: string, color: string = '#6366f1'): Promise<Folder> {
    const { data } = await apiClient.post('/api/folders', { name, color });
    return data.data || data;
  },

  async updateFolder(id: number, payload: { name?: string; color?: string }): Promise<Folder> {
    const { data } = await apiClient.patch(`/api/folders/${id}`, payload);
    return data.data || data;
  },

  async deleteFolder(id: number): Promise<void> {
    await apiClient.delete(`/api/folders/${id}`);
  },

  async getFolderVideos(id: number): Promise<Video[]> {
    const { data } = await apiClient.get(`/api/folders/${id}/videos`);
    return data.data || data;
  },

  async addVideosToFolder(id: number, videoIds: number[]): Promise<void> {
    await apiClient.post(`/api/folders/${id}/videos`, { video_ids: videoIds });
  },

  async removeVideoFromFolder(folderId: number, videoId: number): Promise<void> {
    await apiClient.delete(`/api/folders/${folderId}/videos/${videoId}`);
  },
};
