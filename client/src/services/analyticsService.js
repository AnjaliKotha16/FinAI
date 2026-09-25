import { fetchAPI } from './api';

/**
 * Analytics Service calls
 */
export const getDashboardData = async (period = 'month') => {
  return await fetchAPI(`/analytics/dashboard?period=${period}`);
};
