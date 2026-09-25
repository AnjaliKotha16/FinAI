const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Protect all analytics endpoints with JWT middleware
router.use(protect);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get user's financial dashboard analytics & summary
 * @access  Private
 */
router.get('/dashboard', getDashboardData);

module.exports = router;
