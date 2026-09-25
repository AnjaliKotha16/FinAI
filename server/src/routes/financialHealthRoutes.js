const express = require('express');
const router = express.Router();
const { getFinancialHealth } = require('../controllers/financialHealthController');
const { protect } = require('../middleware/authMiddleware');

// Protect endpoint with JWT middleware
router.use(protect);

/**
 * @route   GET /api/financial-health
 * @desc    Get user's financial health indicators, score, and trends
 * @access  Private
 */
router.get('/', getFinancialHealth);

module.exports = router;
