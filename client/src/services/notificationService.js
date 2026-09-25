import { fetchAPI } from './api';

export const notificationService = {
  /**
   * Get user notifications
   * @param {boolean} [unreadOnly=false]
   */
  getNotifications: async (unreadOnly = false) => {
    return fetchAPI(`/notifications?unreadOnly=${unreadOnly}`, {
      method: 'GET'
    });
  },

  /**
   * Get count of unread notifications for badge
   */
  getUnreadCount: async () => {
    return fetchAPI('/notifications/unread-count', {
      method: 'GET'
    });
  },

  /**
   * Mark single notification as read
   * @param {string} id
   */
  markAsRead: async (id) => {
    return fetchAPI(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    return fetchAPI('/notifications/read-all', {
      method: 'PATCH'
    });
  },

  /**
   * Delete single notification
   * @param {string} id
   */
  deleteNotification: async (id) => {
    return fetchAPI(`/notifications/${id}`, {
      method: 'DELETE'
    });
  }
};
