const express = require('express');
const router = express.Router();
const {
  getGoals,
  getGoalById,
  getGoalPlan,
  createGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

// Protect all goal endpoints with JWT middleware
router.use(protect);

/**
 * @route   GET /api/goals
 * @desc    Get user's financial goals
 * @access  Private
 */
router.get('/', getGoals);

/**
 * @route   GET /api/goals/:id
 * @desc    Get goal details by ID
 * @access  Private
 */
router.get('/:id', getGoalById);

/**
 * @route   GET /api/goals/:id/plan
 * @desc    Get goal planning calculations & breakdown
 * @access  Private
 */
router.get('/:id/plan', getGoalPlan);

/**
 * @route   POST /api/goals
 * @desc    Create a new goal
 * @access  Private
 */
router.post('/', createGoal);

/**
 * @route   PUT /api/goals/:id
 * @desc    Update an existing goal
 * @access  Private
 */
router.put('/:id', updateGoal);

/**
 * @route   PATCH /api/goals/:id/progress
 * @desc    Update progress (currentAmount) for a goal
 * @access  Private
 */
router.patch('/:id/progress', updateGoalProgress);

/**
 * @route   DELETE /api/goals/:id
 * @desc    Delete a goal
 * @access  Private
 */
router.delete('/:id', deleteGoal);

module.exports = router;
