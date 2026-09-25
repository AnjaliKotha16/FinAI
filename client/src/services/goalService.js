import { fetchAPI } from './api';

/**
 * Fetch all goals with optional status & priority filters
 */
export const getGoals = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status && params.status !== 'all') {
    queryParams.append('status', params.status);
  }
  if (params.priority && params.priority !== 'all') {
    queryParams.append('priority', params.priority);
  }

  const queryString = queryParams.toString();
  const endpoint = `/goals${queryString ? `?${queryString}` : ''}`;
  return await fetchAPI(endpoint);
};

/**
 * Fetch single goal by ID
 */
export const getGoalById = async (id) => {
  return await fetchAPI(`/goals/${id}`);
};

/**
 * Fetch deterministic goal plan calculations
 */
export const getGoalPlan = async (id) => {
  return await fetchAPI(`/goals/${id}/plan`);
};

/**
 * Create a new goal
 */
export const createGoal = async (goalData) => {
  return await fetchAPI('/goals', {
    method: 'POST',
    body: JSON.stringify(goalData)
  });
};

/**
 * Update an existing goal
 */
export const updateGoal = async (id, goalData) => {
  return await fetchAPI(`/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(goalData)
  });
};

/**
 * Update current saved amount for a goal
 */
export const updateGoalProgress = async (id, currentAmount) => {
  return await fetchAPI(`/goals/${id}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ currentAmount })
  });
};

/**
 * Delete a goal
 */
export const deleteGoal = async (id) => {
  return await fetchAPI(`/goals/${id}`, {
    method: 'DELETE'
  });
};
