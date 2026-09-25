import { fetchAPI } from './api';

export const monthlyReviewService = {
  /**
   * Get monthly review for authenticated user for a specific month (YYYY-MM)
   * @param {string} [monthStr] Month string in YYYY-MM format
   */
  getMonthlyReview: async (monthStr = '') => {
    const query = monthStr ? `?month=${monthStr}` : '';
    return fetchAPI(`/monthly-review${query}`, {
      method: 'GET'
    });
  }
};
