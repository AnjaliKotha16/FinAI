import { fetchAPI } from './api';

/**
 * Fetch all budgets with optional query filters (category, periodStatus)
 */
export const getBudgets = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.category && params.category !== 'all') {
    queryParams.append('category', params.category);
  }
  if (params.periodStatus && params.periodStatus !== 'all') {
    queryParams.append('periodStatus', params.periodStatus);
  }

  const queryString = queryParams.toString();
  const endpoint = `/budgets${queryString ? `?${queryString}` : ''}`;
  return await fetchAPI(endpoint);
};

/**
 * Fetch a single budget by ID
 */
export const getBudgetById = async (id) => {
  return await fetchAPI(`/budgets/${id}`);
};

/**
 * Create a new budget
 */
export const createBudget = async (budgetData) => {
  return await fetchAPI('/budgets', {
    method: 'POST',
    body: JSON.stringify(budgetData)
  });
};

/**
 * Update an existing budget
 */
export const updateBudget = async (id, budgetData) => {
  return await fetchAPI(`/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(budgetData)
  });
};

/**
 * Delete a budget
 */
export const deleteBudget = async (id) => {
  return await fetchAPI(`/budgets/${id}`, {
    method: 'DELETE'
  });
};
