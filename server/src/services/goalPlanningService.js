const { Goal } = require('../models/Goal');
const { Transaction } = require('../models/Transaction');
const { Budget } = require('../models/Budget');

/**
 * Deterministic Goal Planning Engine
 * Computes exact required savings, recent transaction savings pace, budget context, and estimated timeline.
 */
const calculateGoalPlan = async (userId, goalId) => {
  // 1. Fetch goal belonging to authenticated user
  const goal = await Goal.findOne({ _id: goalId, user: userId });
  if (!goal) {
    const error = new Error('Goal not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const targetAmount = Number(goal.targetAmount) || 0;
  const currentAmount = Number(goal.currentAmount) || 0;
  const isCompleted = currentAmount >= targetAmount || goal.status === 'Completed';
  const remainingAmount = isCompleted ? 0 : Math.max(0, targetAmount - currentAmount);

  // 2. Time calculations
  const now = new Date();
  const targetDateObj = new Date(goal.targetDate);
  const diffMs = targetDateObj.getTime() - now.getTime();
  const isTargetDatePassed = diffMs < 0;

  const daysRemaining = isCompleted ? 0 : Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const weeksRemaining = isCompleted ? 0 : Number((daysRemaining / 7).toFixed(1));
  const monthsRemaining = isCompleted ? 0 : Number((daysRemaining / 30.4375).toFixed(1));

  // 3. Required Savings calculations (Monthly, Weekly, Daily)
  let requiredMonthlySavings = 0;
  let requiredWeeklySavings = 0;
  let requiredDailySavings = 0;

  if (!isCompleted && remainingAmount > 0) {
    requiredMonthlySavings = monthsRemaining > 0
      ? Number((remainingAmount / monthsRemaining).toFixed(2))
      : remainingAmount;

    requiredWeeklySavings = weeksRemaining > 0
      ? Number((remainingAmount / weeksRemaining).toFixed(2))
      : remainingAmount;

    requiredDailySavings = daysRemaining > 0
      ? Number((remainingAmount / daysRemaining).toFixed(2))
      : remainingAmount;
  }

  // 4. Current Savings Pace from Recent Transactions (Last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentTxs = await Transaction.find({
    user: userId,
    date: { $gte: ninetyDaysAgo }
  });

  let totalRecentIncome = 0;
  let totalRecentExpenses = 0;
  recentTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') totalRecentIncome += amt;
    if (tx.type === 'expense') totalRecentExpenses += amt;
  });

  const totalRecentSavings = totalRecentIncome - totalRecentExpenses;
  // Average monthly savings over 90 days (3 months)
  const currentMonthlySavingsPace = Number((totalRecentSavings / 3).toFixed(2));

  // 5. Current Pace vs Required Comparison
  const savingsDifference = Number((requiredMonthlySavings - currentMonthlySavingsPace).toFixed(2));

  // 6. Plan Status Determination
  let planStatus = 'On Track';
  if (isCompleted) {
    planStatus = 'Completed';
  } else if (isTargetDatePassed) {
    planStatus = 'Target Date Passed';
  } else if (currentMonthlySavingsPace < requiredMonthlySavings) {
    planStatus = 'Needs Adjustment';
  }

  // 7. Estimated Completion Timeframe based on current pace
  let estimatedCompletionText = '';
  let estimatedMonths = null;

  if (isCompleted) {
    estimatedCompletionText = 'Goal already completed!';
  } else if (currentMonthlySavingsPace <= 0) {
    estimatedCompletionText = 'Insufficient positive savings pace to estimate completion.';
  } else {
    estimatedMonths = Math.ceil(remainingAmount / currentMonthlySavingsPace);
    estimatedCompletionText = `Approximately ${estimatedMonths} month${estimatedMonths === 1 ? '' : 's'} at current pace`;
  }

  // 8. Phase 7 Budget Context
  const userBudgets = await Budget.find({ user: userId });
  let totalBudgetedAmount = 0;
  let totalBudgetSpent = 0;

  for (const budget of userBudgets) {
    const bStart = new Date(budget.startDate);
    bStart.setHours(0, 0, 0, 0);
    const bEnd = new Date(budget.endDate);
    bEnd.setHours(23, 59, 59, 999);

    const bTxs = await Transaction.find({
      user: userId,
      type: 'expense',
      category: budget.category,
      date: { $gte: bStart, $lte: bEnd }
    });

    const bSpent = bTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    totalBudgetedAmount += budget.amount;
    totalBudgetSpent += bSpent;
  }

  const remainingBudgetBuffer = totalBudgetedAmount - totalBudgetSpent;

  return {
    goal: {
      _id: goal._id,
      name: goal.name,
      description: goal.description,
      targetAmount,
      currentAmount,
      targetDate: goal.targetDate,
      priority: goal.priority,
      status: goal.status
    },
    planSummary: {
      targetAmount,
      currentAmount,
      remainingAmount,
      isCompleted,
      isTargetDatePassed,
      timeRemaining: {
        daysRemaining,
        weeksRemaining,
        monthsRemaining
      },
      requiredSavings: {
        monthly: requiredMonthlySavings,
        weekly: requiredWeeklySavings,
        daily: requiredDailySavings
      },
      currentPace: {
        monthlySavingsPace: currentMonthlySavingsPace,
        recentIncome: totalRecentIncome,
        recentExpenses: totalRecentExpenses,
        recentSavings: totalRecentSavings
      },
      comparison: {
        difference: savingsDifference,
        isDeficit: savingsDifference > 0,
        deficitAmount: savingsDifference > 0 ? savingsDifference : 0,
        surplusAmount: savingsDifference < 0 ? Math.abs(savingsDifference) : 0
      },
      planStatus,
      estimatedCompletionText,
      estimatedMonths,
      budgetContext: {
        activeBudgetsCount: userBudgets.length,
        totalBudgetedAmount,
        totalBudgetSpent,
        remainingBudgetBuffer
      }
    },
    explanations: {
      requiredMonthlySavings: 'The approximate amount that would need to be saved each month to reach the target by the selected target date, without assuming investment returns.',
      currentSavingsPace: 'An estimate based on your recorded income and expenses over the last 90 days.',
      projectedCompletion: 'An estimate calculated using your current recorded savings pace.',
      simulationNotice: 'The interactive simulation is for planning purposes only and does not alter your saved transactions or budgets.'
    }
  };
};

module.exports = {
  calculateGoalPlan
};
