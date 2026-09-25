const { Goal, ALLOWED_PRIORITIES, ALLOWED_STATUSES } = require('../models/Goal');
const { calculateGoalPlan } = require('../services/goalPlanningService');
const { errorResponse } = require('../utils/apiResponse');
const { isValidObjectId } = require('../middleware/securityMiddleware');

/**
 * Helper to compute calculated goal metrics (remaining, progress, time remaining)
 */
const computeGoalMetrics = (goal) => {
  const goalObj = goal.toObject ? goal.toObject() : goal;

  const target = Number(goalObj.targetAmount) || 0;
  const current = Number(goalObj.currentAmount) || 0;

  const isCompleted = current >= target || goalObj.status === 'Completed';
  const remainingAmount = isCompleted ? 0 : Math.max(0, target - current);
  const progressPercentage = target > 0 ? Number(((current / target) * 100).toFixed(1)) : 0;

  // Time remaining calculation
  const now = new Date();
  const targetDateObj = new Date(goalObj.targetDate);
  const diffTimeMs = targetDateObj.getTime() - now.getTime();
  const isTargetDatePassed = diffTimeMs < 0;

  const totalDaysRemaining = Math.max(0, Math.ceil(diffTimeMs / (1000 * 60 * 60 * 24)));
  const monthsRemaining = Number((totalDaysRemaining / 30.4375).toFixed(1));

  let timeRemainingText = '';
  if (isCompleted) {
    timeRemainingText = 'Goal Completed!';
  } else if (isTargetDatePassed) {
    timeRemainingText = 'Target date passed';
  } else if (totalDaysRemaining < 30) {
    timeRemainingText = `${totalDaysRemaining} day${totalDaysRemaining === 1 ? '' : 's'} remaining`;
  } else {
    timeRemainingText = `Approx. ${monthsRemaining} month${monthsRemaining === 1 ? '' : 's'} remaining`;
  }

  return {
    ...goalObj,
    remainingAmount,
    progressPercentage,
    isCompleted,
    isTargetDatePassed,
    totalDaysRemaining,
    monthsRemaining,
    timeRemainingText
  };
};

/**
 * @route   GET /api/goals
 * @desc    Get all goals for authenticated user with metrics & summary
 * @access  Private
 */
const getGoals = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const query = { user: req.user._id };

    if (status && status !== 'all' && ALLOWED_STATUSES.includes(status)) {
      query.status = status;
    }

    if (priority && priority !== 'all' && ALLOWED_PRIORITIES.includes(priority)) {
      query.priority = priority;
    }

    const goals = await Goal.find(query).sort({ targetDate: 1, createdAt: -1 });
    const goalsWithMetrics = goals.map(computeGoalMetrics);

    // Fetch all user goals (unfiltered) for overall summary totals
    const allUserGoals = await Goal.find({ user: req.user._id });
    let totalTargetAmount = 0;
    let totalSavedAmount = 0;
    let activeGoalsCount = 0;
    let completedGoalsCount = 0;

    allUserGoals.forEach((g) => {
      const tgt = Number(g.targetAmount) || 0;
      const cur = Number(g.currentAmount) || 0;
      totalTargetAmount += tgt;
      totalSavedAmount += cur;
      if (g.status === 'Completed' || cur >= tgt) completedGoalsCount++;
      else if (g.status === 'Active') activeGoalsCount++;
    });

    const overallProgressPercentage = totalTargetAmount > 0
      ? Number(((totalSavedAmount / totalTargetAmount) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      count: goalsWithMetrics.length,
      data: goalsWithMetrics,
      summary: {
        totalGoalsCount: allUserGoals.length,
        activeGoalsCount,
        completedGoalsCount,
        totalTargetAmount,
        totalSavedAmount,
        overallProgressPercentage
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/goals/:id
 * @desc    Get single goal details
 * @access  Private
 */
const getGoalById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Goal not found');
    }

    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return errorResponse(res, 404, 'Goal not found');
    }

    return res.status(200).json({
      success: true,
      data: computeGoalMetrics(goal)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/goals/:id/plan
 * @desc    Get deterministic goal planning calculations & breakdown
 * @access  Private
 */
const getGoalPlan = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Goal not found');
    }

    const planData = await calculateGoalPlan(req.user._id, req.params.id);
    return res.status(200).json({
      success: true,
      data: planData
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return errorResponse(res, 404, error.message || 'Goal not found');
    }
    next(error);
  }
};

/**
 * @route   POST /api/goals
 * @desc    Create a new financial goal
 * @access  Private
 */
const createGoal = async (req, res, next) => {
  try {
    const { name, description, targetAmount, currentAmount, targetDate, priority, status } = req.body;

    if (!name || name.trim().length === 0) {
      return errorResponse(res, 400, 'Goal name is required');
    }

    const numTarget = Number(targetAmount);
    if (isNaN(numTarget) || numTarget <= 0) {
      return errorResponse(res, 400, 'Target amount must be a positive number greater than 0');
    }

    const numCurrent = currentAmount !== undefined ? Number(currentAmount) : 0;
    if (isNaN(numCurrent) || numCurrent < 0) {
      return errorResponse(res, 400, 'Current amount cannot be negative');
    }

    if (!targetDate || isNaN(new Date(targetDate).getTime())) {
      return errorResponse(res, 400, 'Please select a valid target date');
    }

    const validPriority = priority && ALLOWED_PRIORITIES.includes(priority) ? priority : 'Medium';
    let validStatus = status && ALLOWED_STATUSES.includes(status) ? status : 'Active';

    // Auto-complete if saved >= target
    if (numCurrent >= numTarget) {
      validStatus = 'Completed';
    }

    const newGoal = await Goal.create({
      user: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : '',
      targetAmount: numTarget,
      currentAmount: numCurrent,
      targetDate: new Date(targetDate),
      priority: validPriority,
      status: validStatus
    });

    return res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: computeGoalMetrics(newGoal)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/goals/:id
 * @desc    Update an existing financial goal
 * @access  Private
 */
const updateGoal = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Goal not found');
    }

    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return errorResponse(res, 404, 'Goal not found');
    }

    const { name, description, targetAmount, currentAmount, targetDate, priority, status } = req.body;

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return errorResponse(res, 400, 'Goal name cannot be empty');
      }
      goal.name = name.trim();
    }

    if (description !== undefined) {
      goal.description = description.trim();
    }

    if (targetAmount !== undefined) {
      const numTarget = Number(targetAmount);
      if (isNaN(numTarget) || !isFinite(numTarget) || numTarget <= 0) {
        return errorResponse(res, 400, 'Target amount must be a positive number greater than 0');
      }
      goal.targetAmount = numTarget;
    }

    if (currentAmount !== undefined) {
      const numCurrent = Number(currentAmount);
      if (isNaN(numCurrent) || !isFinite(numCurrent) || numCurrent < 0) {
        return errorResponse(res, 400, 'Current amount cannot be negative');
      }
      goal.currentAmount = numCurrent;
    }

    if (targetDate !== undefined) {
      if (isNaN(new Date(targetDate).getTime())) {
        return errorResponse(res, 400, 'Invalid target date');
      }
      goal.targetDate = new Date(targetDate);
    }

    if (priority !== undefined) {
      if (!ALLOWED_PRIORITIES.includes(priority)) {
        return errorResponse(res, 400, 'Invalid priority level');
      }
      goal.priority = priority;
    }

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return errorResponse(res, 400, 'Invalid goal status');
      }
      goal.status = status;
    }

    // Auto-update completion status based on amounts
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'Completed';
    } else if (goal.status === 'Completed' && goal.currentAmount < goal.targetAmount) {
      goal.status = 'Active';
    }

    await goal.save();

    return res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: computeGoalMetrics(goal)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/goals/:id/progress
 * @desc    Quickly update saved amount (currentAmount) for a goal
 * @access  Private
 */
const updateGoalProgress = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Goal not found');
    }

    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return errorResponse(res, 404, 'Goal not found');
    }

    const { currentAmount } = req.body;
    const numCurrent = Number(currentAmount);
    if (isNaN(numCurrent) || !isFinite(numCurrent) || numCurrent < 0) {
      return errorResponse(res, 400, 'Current saved amount cannot be negative');
    }

    goal.currentAmount = numCurrent;

    if (numCurrent >= goal.targetAmount) {
      goal.status = 'Completed';
    } else if (goal.status === 'Completed' && numCurrent < goal.targetAmount) {
      goal.status = 'Active';
    }

    await goal.save();

    return res.status(200).json({
      success: true,
      message: 'Goal progress updated successfully',
      data: computeGoalMetrics(goal)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/goals/:id
 * @desc    Delete a financial goal
 * @access  Private
 */
const deleteGoal = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Goal not found');
    }

    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return errorResponse(res, 404, 'Goal not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  getGoalById,
  getGoalPlan,
  createGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal
};
