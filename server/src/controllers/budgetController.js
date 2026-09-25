const { Budget, ALLOWED_PERIODS } = require('../models/Budget');
const { Transaction, ALLOWED_CATEGORIES } = require('../models/Transaction');
const { errorResponse } = require('../utils/apiResponse');
const { isValidObjectId } = require('../middleware/securityMiddleware');

/**
 * Helper to compute budget metrics (spent, remaining, percentage, status) from transactions
 */
const computeBudgetMetrics = async (userId, budget) => {
  const startOfDay = new Date(budget.startDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(budget.endDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Sum expense transactions matching user, category, and date range
  const transactions = await Transaction.find({
    user: userId,
    type: 'expense',
    category: budget.category,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });

  const spentAmount = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const remaining = budget.amount - spentAmount;
  const percentageUsed = budget.amount > 0 ? Number(((spentAmount / budget.amount) * 100).toFixed(1)) : 0;

  let status = 'On Track';
  if (percentageUsed > 100) {
    status = 'Exceeded';
  } else if (percentageUsed >= 75) {
    status = 'Near Limit';
  }

  const now = new Date();
  let periodStatus = 'Current';
  if (now < startOfDay) {
    periodStatus = 'Upcoming';
  } else if (now > endOfDay) {
    periodStatus = 'Completed';
  }

  const budgetObj = budget.toObject ? budget.toObject() : budget;

  return {
    ...budgetObj,
    spent: spentAmount,
    remaining,
    percentageUsed,
    status,
    periodStatus,
    transactionCount: transactions.length
  };
};

/**
 * @route   GET /api/budgets
 * @desc    Get all budgets for authenticated user with spending calculations
 * @access  Private
 */
const getBudgets = async (req, res, next) => {
  try {
    const { category, periodStatus } = req.query;
    const query = { user: req.user._id };

    if (category && category !== 'all' && ALLOWED_CATEGORIES.includes(category)) {
      query.category = category;
    }

    const budgets = await Budget.find(query).sort({ startDate: -1, createdAt: -1 });

    // Compute metrics for each budget
    let budgetsWithMetrics = await Promise.all(
      budgets.map((b) => computeBudgetMetrics(req.user._id, b))
    );

    // Filter by periodStatus if specified
    if (periodStatus && periodStatus !== 'all') {
      const normalizedStatus = periodStatus.toLowerCase();
      budgetsWithMetrics = budgetsWithMetrics.filter((b) => b.periodStatus.toLowerCase() === normalizedStatus);
    }

    // Compute overall summary totals
    let totalBudgeted = 0;
    let totalSpent = 0;
    budgetsWithMetrics.forEach((b) => {
      totalBudgeted += b.amount;
      totalSpent += b.spent;
    });

    const totalRemaining = totalBudgeted - totalSpent;
    const activeCount = budgetsWithMetrics.filter((b) => b.periodStatus === 'Current').length;

    return res.status(200).json({
      success: true,
      count: budgetsWithMetrics.length,
      data: budgetsWithMetrics,
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining,
        activeCount,
        totalCount: budgetsWithMetrics.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/budgets/:id
 * @desc    Get single budget details with spending metrics
 * @access  Private
 */
const getBudgetById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Budget not found');
    }

    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return errorResponse(res, 404, 'Budget not found');
    }

    const budgetWithMetrics = await computeBudgetMetrics(req.user._id, budget);

    return res.status(200).json({
      success: true,
      data: budgetWithMetrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/budgets
 * @desc    Create a new budget with validation and overlap checking
 * @access  Private
 */
const createBudget = async (req, res, next) => {
  try {
    const { category, amount, period, startDate, endDate, notes } = req.body;

    // Validation
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return errorResponse(res, 400, 'Please select a valid budget category');
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return errorResponse(res, 400, 'Budget amount must be a positive number greater than 0');
    }

    const validPeriod = period || 'Monthly';
    if (!ALLOWED_PERIODS.includes(validPeriod)) {
      return errorResponse(res, 400, 'Period must be Monthly, Weekly, or Custom');
    }

    const parsedStart = startDate ? new Date(startDate) : new Date();
    if (isNaN(parsedStart.getTime())) {
      return errorResponse(res, 400, 'Invalid start date');
    }

    let parsedEnd;
    if (endDate) {
      parsedEnd = new Date(endDate);
    } else if (validPeriod === 'Monthly') {
      parsedEnd = new Date(parsedStart.getFullYear(), parsedStart.getMonth() + 1, 0, 23, 59, 59);
    } else if (validPeriod === 'Weekly') {
      parsedEnd = new Date(parsedStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      parsedEnd.setHours(23, 59, 59);
    } else {
      return errorResponse(res, 400, 'End date is required for custom period');
    }

    if (isNaN(parsedEnd.getTime())) {
      return errorResponse(res, 400, 'Invalid end date');
    }

    if (parsedEnd < parsedStart) {
      return errorResponse(res, 400, 'End date must be after or equal to start date');
    }

    // Check for overlapping budget for the same user and category
    const startOfDay = new Date(parsedStart);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedEnd);
    endOfDay.setHours(23, 59, 59, 999);

    const existingOverlap = await Budget.findOne({
      user: req.user._id,
      category,
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    });

    if (existingOverlap) {
      return errorResponse(
        res,
        400,
        `A budget for '${category}' already exists for the selected date range (${new Date(existingOverlap.startDate).toLocaleDateString()} - ${new Date(existingOverlap.endDate).toLocaleDateString()}).`
      );
    }

    const newBudget = await Budget.create({
      user: req.user._id,
      category,
      amount: numericAmount,
      period: validPeriod,
      startDate: startOfDay,
      endDate: endOfDay,
      notes: notes ? notes.trim() : ''
    });

    const budgetWithMetrics = await computeBudgetMetrics(req.user._id, newBudget);

    return res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: budgetWithMetrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/budgets/:id
 * @desc    Update an existing budget
 * @access  Private
 */
const updateBudget = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Budget not found');
    }

    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return errorResponse(res, 404, 'Budget not found');
    }

    const { category, amount, period, startDate, endDate, notes } = req.body;

    const targetCategory = category || budget.category;
    if (!ALLOWED_CATEGORIES.includes(targetCategory)) {
      return errorResponse(res, 400, 'Invalid budget category');
    }

    const numericAmount = amount !== undefined ? Number(amount) : budget.amount;
    if (isNaN(numericAmount) || !isFinite(numericAmount) || numericAmount <= 0) {
      return errorResponse(res, 400, 'Budget amount must be a positive number greater than 0');
    }

    const targetPeriod = period || budget.period;
    if (!ALLOWED_PERIODS.includes(targetPeriod)) {
      return errorResponse(res, 400, 'Invalid budget period');
    }

    const parsedStart = startDate ? new Date(startDate) : new Date(budget.startDate);
    const parsedEnd = endDate ? new Date(endDate) : new Date(budget.endDate);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return errorResponse(res, 400, 'Invalid dates provided');
    }

    if (parsedEnd < parsedStart) {
      return errorResponse(res, 400, 'End date must be after or equal to start date');
    }

    const startOfDay = new Date(parsedStart);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedEnd);
    endOfDay.setHours(23, 59, 59, 999);

    // Check for overlap excluding this budget ID
    const existingOverlap = await Budget.findOne({
      _id: { $ne: budget._id },
      user: req.user._id,
      category: targetCategory,
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    });

    if (existingOverlap) {
      return errorResponse(
        res,
        400,
        `Another budget for '${targetCategory}' already exists for the selected date range.`
      );
    }

    budget.category = targetCategory;
    budget.amount = numericAmount;
    budget.period = targetPeriod;
    budget.startDate = startOfDay;
    budget.endDate = endOfDay;
    if (notes !== undefined) budget.notes = notes.trim();

    await budget.save();

    const updatedWithMetrics = await computeBudgetMetrics(req.user._id, budget);

    return res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: updatedWithMetrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/budgets/:id
 * @desc    Delete a budget (does NOT delete any transactions)
 * @access  Private
 */
const deleteBudget = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Budget not found');
    }

    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return errorResponse(res, 404, 'Budget not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
};
