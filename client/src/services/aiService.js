import { fetchAPI } from './api';

export const aiService = {
  /**
   * Send chat message to AI assistant
   * @param {string} message
   * @param {string} [conversationId]
   */
  sendMessage: async (message, conversationId = null) => {
    return fetchAPI('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId })
    });
  },

  /**
   * Get all conversations for authenticated user
   */
  getConversations: async () => {
    return fetchAPI('/ai/conversations', {
      method: 'GET'
    });
  },

  /**
   * Get conversation details by ID
   * @param {string} id
   */
  getConversationById: async (id) => {
    return fetchAPI(`/ai/conversations/${id}`, {
      method: 'GET'
    });
  },

  /**
   * Delete conversation by ID
   * @param {string} id
   */
  deleteConversation: async (id) => {
    return fetchAPI(`/ai/conversations/${id}`, {
      method: 'DELETE'
    });
  }
};
