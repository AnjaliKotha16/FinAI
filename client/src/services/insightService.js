import { fetchAPI } from './api';

export const insightService = {
  /**
   * Get personalized insights for authenticated user
   * @param {string} [category] Filter category ('all', 'spending', 'budget', 'savings', 'goals', 'investments')
   */
  getInsights: async (category = 'all') => {
    return fetchAPI(`/insights?category=${category}`, {
      method: 'GET'
    });
  },

  /**
   * Get compact insights summary for Dashboard widget
   */
  getInsightsSummary: async () => {
    return fetchAPI('/insights/summary', {
      method: 'GET'
    });
  }
};
