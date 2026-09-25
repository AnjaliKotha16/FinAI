const express = require('express');
const router = express.Router();
const {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

// Protect all budget endpoints with JWT middleware
router.use(protect);

/**
 * @route   GET /api/budgets
 * @desc    Get user's budgets
 * @access  Private
 */
router.get('/', getBudgets);

/**
 * @route   GET /api/budgets/:id
 * @desc    Get budget details by ID
 * @access  Private
 */
router.get('/:id', getBudgetById);

/**
 * @route   POST /api/budgets
 * @desc    Create a new budget
 * @access  Private
 */
router.post('/', createBudget);

/**
 * @route   PUT /api/budgets/:id
 * @desc    Update an existing budget
 * @access  Private
 */
router.put('/:id', updateBudget);

/**
 * @route   DELETE /api/budgets/:id
 * @desc    Delete a budget
 * @access  Private
 */
router.delete('/:id', deleteBudget);

module.exports = router;
