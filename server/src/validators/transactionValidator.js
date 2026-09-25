const { ALLOWED_CATEGORIES, ALLOWED_PAYMENT_METHODS } = require('../models/Transaction');

/**
 * Validates request payload for creating or updating a transaction.
 */
const validateTransactionInput = (data) => {
  const errors = {};
  const { type, amount, category, date, paymentMethod, description, notes } = data;

  // Type validation
  if (!type || !['income', 'expense'].includes(type.toLowerCase())) {
    errors.type = 'Type must be either "income" or "expense".';
  }

  // Amount validation
  const numericAmount = Number(amount);
  if (amount === undefined || amount === null || isNaN(numericAmount)) {
    errors.amount = 'Please provide a valid numeric amount.';
  } else if (numericAmount <= 0) {
    errors.amount = 'Amount must be greater than 0.';
  }

  // Strict Category validation
  if (!category || typeof category !== 'string' || !ALLOWED_CATEGORIES.includes(category)) {
    errors.category = 'Invalid transaction category. Please select a valid category.';
  }

  // Date validation
  if (!date || isNaN(new Date(date).getTime())) {
    errors.date = 'Please provide a valid date.';
  }

  // Payment method validation
  if (paymentMethod && !ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    errors.paymentMethod = `Payment method must be one of: ${ALLOWED_PAYMENT_METHODS.join(', ')}.`;
  }

  // Description validation
  if (description && typeof description === 'string' && description.length > 200) {
    errors.description = 'Description cannot exceed 200 characters.';
  }

  // Notes validation
  if (notes && typeof notes === 'string' && notes.length > 500) {
    errors.notes = 'Notes cannot exceed 500 characters.';
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
};

module.exports = {
  validateTransactionInput
};
