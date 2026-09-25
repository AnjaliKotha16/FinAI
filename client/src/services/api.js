import { API_BASE_URL } from '../utils/constants';

/**
 * Enhanced fetch wrapper for REST API communication with automatic JWT Authorization header.
 */
export const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`[API Error] Request failed for ${endpoint}:`, error);
    return { ok: false, status: 500, error: error.message || 'Network error' };
  }
};
