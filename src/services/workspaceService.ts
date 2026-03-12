import apiClient from './apiClient';
import type { Workspace, WorkspaceMember, WorkspaceInvitation, Video } from '@/types';

export const workspaceService = {
  async getWorkspaces(): Promise<Workspace[]> {
    const { data } = await apiClient.get('/api/workspaces');
    return data.data || data;
  },

  async createWorkspace(name: string, description?: string): Promise<Workspace> {
    const { data } = await apiClient.post('/api/workspaces', { name, description });
    return data.data || data;
  },

  async getWorkspace(slug: string): Promise<Workspace> {
    const { data } = await apiClient.get(`/api/workspaces/${slug}`);
    return data.data || data;
  },

  async updateWorkspace(slug: string, payload: { name?: string; description?: string }): Promise<Workspace> {
    const { data } = await apiClient.patch(`/api/workspaces/${slug}`, payload);
    return data.data || data;
  },

  async deleteWorkspace(slug: string): Promise<void> {
    await apiClient.delete(`/api/workspaces/${slug}`);
  },

  async leaveWorkspace(slug: string): Promise<void> {
    await apiClient.post(`/api/workspaces/${slug}/leave`);
  },

  async getWorkspaceVideos(slug: string): Promise<Video[]> {
    const { data } = await apiClient.get(`/api/workspaces/${slug}/videos`);
    return data.data || data;
  },

  async getMembers(slug: string): Promise<WorkspaceMember[]> {
    const { data } = await apiClient.get(`/api/workspaces/${slug}/members`);
    return data.data || data;
  },

  async updateMemberRole(slug: string, userId: number, role: string): Promise<void> {
    await apiClient.patch(`/api/workspaces/${slug}/members/${userId}`, { role });
  },

  async removeMember(slug: string, userId: number): Promise<void> {
    await apiClient.delete(`/api/workspaces/${slug}/members/${userId}`);
  },

  async getInvitations(slug: string): Promise<WorkspaceInvitation[]> {
    const { data } = await apiClient.get(`/api/workspaces/${slug}/invitations`);
    return data.data || data;
  },

  async inviteMember(slug: string, email: string, role: string = 'member'): Promise<WorkspaceInvitation> {
    const { data } = await apiClient.post(`/api/workspaces/${slug}/invitations`, { email, role });
    return data.data || data;
  },

  async cancelInvitation(slug: string, invitationId: number): Promise<void> {
    await apiClient.delete(`/api/workspaces/${slug}/invitations/${invitationId}`);
  },

  async resendInvitation(slug: string, invitationId: number): Promise<void> {
    await apiClient.post(`/api/workspaces/${slug}/invitations/${invitationId}/resend`);
  },

  async getInvitationByToken(token: string): Promise<WorkspaceInvitation> {
    const { data } = await apiClient.get(`/api/invitations/${token}`);
    return data.data || data;
  },

  async acceptInvitation(token: string): Promise<void> {
    await apiClient.post(`/api/invitations/${token}/accept`);
  },
};
