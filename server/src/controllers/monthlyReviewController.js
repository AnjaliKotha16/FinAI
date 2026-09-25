const monthlyReviewService = require('../services/monthlyReviewService');
const aiMonthlyReviewService = require('../services/aiMonthlyReviewService');
const { errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/monthly-review
 * @desc    Get complete monthly financial review and analysis for authenticated user
 * @access  Private (Authenticated User only)
 */
const getMonthlyReview = async (req, res, next) => {
  try {
    const { month } = req.query;

    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return errorResponse(res, 400, 'Invalid month format. Please use YYYY-MM format (e.g. 2026-09).');
    }

    // Default to current year and month if not provided
    const monthParam = month || new Date().toISOString().substring(0, 7);

    // 1. Generate deterministic monthly review data
    const reviewData = await monthlyReviewService.generateMonthlyReview(req.user._id, monthParam);

    // 2. Generate optional AI executive summary
    const aiSummary = await aiMonthlyReviewService.generateAIMonthlyReviewSummary(reviewData);

    return res.status(200).json({
      success: true,
      data: {
        ...reviewData,
        aiSummary
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonthlyReview
};
