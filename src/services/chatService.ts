import apiClient from './apiClient';
import type { ChatConversation, ChatMessage } from '@/types';

export const chatService = {
  async getConversations(): Promise<ChatConversation[]> {
    const { data } = await apiClient.get('/api/chat/conversations');
    return data.data || data;
  },

  async createConversation(): Promise<ChatConversation> {
    const { data } = await apiClient.post('/api/chat/conversations');
    return data.data || data;
  },

  async getMessages(conversationId: number): Promise<ChatMessage[]> {
    const { data } = await apiClient.get(`/api/chat/conversations/${conversationId}/messages`);
    return data.data || data;
  },

  async deleteConversation(conversationId: number): Promise<void> {
    await apiClient.delete(`/api/chat/conversations/${conversationId}`);
  },

  async sendMessage(conversationId: number, content: string): Promise<ChatMessage> {
    const { data } = await apiClient.post('/api/chat/send', {
      conversation_id: conversationId,
      content,
    });
    return data.data || data;
  },
};
