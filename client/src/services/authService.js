import { fetchAPI } from './api';

/**
 * Authentication service functions
 */
export const register = async (name, email, password) => {
  return await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
};

export const login = async (email, password) => {
  return await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const getCurrentUser = async () => {
  return await fetchAPI('/auth/me', {
    method: 'GET',
  });
};

export const logout = async () => {
  return await fetchAPI('/auth/logout', {
    method: 'POST',
  });
};
