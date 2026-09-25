const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { expensiveOpsLimiter } = require('../middleware/rateLimiterMiddleware');
const { getMonthlyReview } = require('../controllers/monthlyReviewController');

// All monthly review routes require authentication
router.use(protect);

router.get('/', expensiveOpsLimiter(15 * 60 * 1000, 60), getMonthlyReview);

module.exports = router;
