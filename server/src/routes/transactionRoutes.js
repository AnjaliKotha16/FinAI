const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// Protect all transaction routes with JWT authentication middleware
router.use(protect);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions for authenticated user
 * @access  Private
 */
/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private
 */
router.route('/')
  .get(getTransactions)
  .post(createTransaction);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
router.route('/:id')
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
