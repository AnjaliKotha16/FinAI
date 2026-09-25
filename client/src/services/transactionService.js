import { fetchAPI } from './api';

/**
 * Transaction Service calls
 */
export const getTransactions = async () => {
  return await fetchAPI('/transactions');
};

export const getTransactionById = async (id) => {
  return await fetchAPI(`/transactions/${id}`);
};

export const createTransaction = async (data) => {
  return await fetchAPI('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateTransaction = async (id, data) => {
  return await fetchAPI(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteTransaction = async (id) => {
  return await fetchAPI(`/transactions/${id}`, {
    method: 'DELETE',
  });
};
