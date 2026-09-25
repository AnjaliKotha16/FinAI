const investmentService = require('../services/investmentService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/investments/profile
 * @desc    Get user's investment planning profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await investmentService.getOrCreateProfile(req.user._id);
    return successResponse(res, 200, 'Investment profile retrieved successfully', { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/investments/profile
 * @desc    Update user's risk preference, horizon, or emergency fund settings
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const updatedProfile = await investmentService.updateProfile(req.user._id, req.body);
    return successResponse(res, 200, 'Investment profile updated successfully', { profile: updatedProfile });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/investments/plan
 * @route   GET /api/investments/plan/:goalId
 * @desc    Get complete deterministic investment plan & goal funding gap
 * @access  Private
 */
const getPlan = async (req, res, next) => {
  try {
    const goalId = req.params.goalId || req.query.goalId;
    const planData = await investmentService.getInvestmentPlan(req.user._id, goalId);
    return successResponse(res, 200, 'Investment plan generated successfully', planData);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/investments/simulate
 * @desc    Simulate hypothetical compound growth scenarios
 * @access  Private
 */
const simulate = async (req, res, next) => {
  try {
    const simulationResult = investmentService.simulateInvestment(req.body);
    return successResponse(res, 200, 'Simulation computed successfully', simulationResult);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getPlan,
  simulate
};
