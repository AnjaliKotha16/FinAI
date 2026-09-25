const mongoose = require('mongoose');
const { Transaction } = require('../models/Transaction');
const { validateTransactionInput } = require('../validators/transactionValidator');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions for the authenticated user
 * @access  Private
 */
const getTransactions = async (req, res, next) => {
  try {
    // Strictly query transactions belonging to the authenticated user ID from JWT
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/transactions/:id
 * @desc    Get a single transaction by ID (must belong to authenticated user)
 * @access  Private
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 404, 'Transaction not found.');
    }

    // Verify BOTH transaction ID and user ownership
    const transaction = await Transaction.findOne({ _id: id, user: req.user._id });

    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found.');
    }

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction for the authenticated user
 * @access  Private
 */
const createTransaction = async (req, res, next) => {
  try {
    const { isValid, errors } = validateTransactionInput(req.body);

    if (!isValid) {
      const firstError = Object.values(errors)[0] || 'Invalid transaction data.';
      return errorResponse(res, 400, firstError, errors);
    }

    const { type, amount, category, description, date, paymentMethod, notes } = req.body;

    // Server enforces ownership using req.user._id from verified JWT
    const transaction = await Transaction.create({
      user: req.user._id,
      type: type.toLowerCase(),
      amount: Number(amount),
      category,
      description: description ? description.trim() : '',
      date: new Date(date),
      paymentMethod: paymentMethod || 'Other',
      notes: notes ? notes.trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update a transaction belonging to the authenticated user
 * @access  Private
 */
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 404, 'Transaction not found.');
    }

    // Find transaction belonging to authenticated user
    const transaction = await Transaction.findOne({ _id: id, user: req.user._id });

    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found.');
    }

    // Validate update input
    const { isValid, errors } = validateTransactionInput(req.body);
    if (!isValid) {
      const firstError = Object.values(errors)[0] || 'Invalid transaction data.';
      return errorResponse(res, 400, firstError, errors);
    }

    const { type, amount, category, description, date, paymentMethod, notes } = req.body;

    // Update fields while preserving original user ownership and createdAt
    transaction.type = type.toLowerCase();
    transaction.amount = Number(amount);
    transaction.category = category;
    transaction.description = description ? description.trim() : '';
    transaction.date = new Date(date);
    transaction.paymentMethod = paymentMethod || 'Other';
    transaction.notes = notes ? notes.trim() : '';

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a transaction belonging to the authenticated user
 * @access  Private
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 404, 'Transaction not found.');
    }

    // Find and delete strictly matching transaction ID and user ownership
    const transaction = await Transaction.findOneAndDelete({ _id: id, user: req.user._id });

    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found.');
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};
