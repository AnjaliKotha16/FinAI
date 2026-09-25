import { fetchAPI } from './api';

/**
 * Health check service
 */
export const checkBackendHealth = async () => {
  return await fetchAPI('/health');
};
