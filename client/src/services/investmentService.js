import { fetchAPI } from './api';

/**
 * Get user's investment profile
 */
export const getInvestmentProfile = async () => {
  return await fetchAPI('/investments/profile');
};

/**
 * Update investment profile (risk preference, horizon, emergency fund months, preferred goal)
 */
export const updateInvestmentProfile = async (profileData) => {
  return await fetchAPI('/investments/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
};

/**
 * Get comprehensive investment plan & optional goal funding gap
 */
export const getInvestmentPlan = async (goalId = null) => {
  const endpoint = goalId ? `/investments/plan/${goalId}` : '/investments/plan';
  return await fetchAPI(endpoint);
};

/**
 * Run deterministic investment compound growth simulation
 */
export const simulateInvestment = async (simulationData) => {
  return await fetchAPI('/investments/simulate', {
    method: 'POST',
    body: JSON.stringify(simulationData)
  });
};
