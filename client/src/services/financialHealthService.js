import { fetchAPI } from './api';

/**
 * Fetch Financial Health indicators, score, and trends
 */
export const getFinancialHealth = async (period = 'month') => {
  return await fetchAPI(`/financial-health?period=${period}`);
};
