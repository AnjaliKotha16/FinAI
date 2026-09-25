/**
 * Centralized Frontend Constants & Configuration
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const APP_NAME = 'FinAI Assistant';
export const APP_PHASE = 'Phase 4 - Expense Categorization System';

/**
 * Standardized Category Definitions
 */
export const TRANSACTION_CATEGORIES = [
  'Food',
  'Shopping',
  'Travel',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Investments',
  'Rent',
  'Others'
];

/**
 * Category Icons Mapping
 */
export const CATEGORY_ICONS = {
  Food: '🍔',
  Shopping: '🛍️',
  Travel: '✈️',
  Bills: '💡',
  Entertainment: '🎬',
  Healthcare: '🏥',
  Education: '🎓',
  Investments: '📈',
  Rent: '🏠',
  Others: '📦'
};

/**
 * Standardized Payment Methods
 */
export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other'
];
