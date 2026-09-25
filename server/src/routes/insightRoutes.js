const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { expensiveOpsLimiter } = require('../middleware/rateLimiterMiddleware');
const { getInsights, getInsightsSummary } = require('../controllers/insightController');

// All insight endpoints require authentication
router.use(protect);

router.get('/', expensiveOpsLimiter(15 * 60 * 1000, 60), getInsights);
router.get('/summary', expensiveOpsLimiter(15 * 60 * 1000, 60), getInsightsSummary);

module.exports = router;
