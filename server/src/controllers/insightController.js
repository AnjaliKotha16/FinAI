const insightService = require('../services/insightService');
const aiInsightService = require('../services/aiInsightService');

/**
 * @route   GET /api/insights
 * @desc    Get personalized, proactive financial insights for authenticated user
 * @access  Private (Authenticated User only)
 */
const getInsights = async (req, res, next) => {
  try {
    const rawInsights = await insightService.generateUserInsights(req.user._id);
    const enhancedInsights = await aiInsightService.enhanceInsightsWithAI(rawInsights);

    const categoryFilter = (req.query.category || 'all').toLowerCase();
    let filteredInsights = enhancedInsights;

    if (categoryFilter !== 'all') {
      filteredInsights = enhancedInsights.filter((ins) => {
        const cat = (ins.category || '').toLowerCase();
        const type = (ins.type || '').toLowerCase();
        return cat.includes(categoryFilter) || type.includes(categoryFilter);
      });
    }

    const warningCount = enhancedInsights.filter((i) => i.severity === 'warning').length;
    const positiveCount = enhancedInsights.filter((i) => i.severity === 'positive').length;
    const infoCount = enhancedInsights.filter((i) => i.severity === 'info').length;

    return res.status(200).json({
      success: true,
      count: filteredInsights.length,
      data: {
        insights: filteredInsights
      },
      summary: {
        totalCount: enhancedInsights.length,
        warningCount,
        positiveCount,
        infoCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/insights/summary
 * @desc    Get top 3 compact financial insights summary for Dashboard widget
 * @access  Private
 */
const getInsightsSummary = async (req, res, next) => {
  try {
    const rawInsights = await insightService.generateUserInsights(req.user._id);
    const enhanced = await aiInsightService.enhanceInsightsWithAI(rawInsights);

    // Pick top 3 most relevant insights
    const top3 = enhanced.slice(0, 3);

    return res.status(200).json({
      success: true,
      count: top3.length,
      data: {
        summaryInsights: top3,
        totalInsightsCount: enhanced.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInsights,
  getInsightsSummary
};
