const { Notification } = require('../models/Notification');
const { Transaction } = require('../models/Transaction');
const { Budget } = require('../models/Budget');
const { Goal } = require('../models/Goal');
const goalPlanningService = require('./goalPlanningService');

/**
 * Safely create a deduplicated notification if it doesn't already exist for the user
 */
const createDeduplicatedNotification = async (notificationData) => {
  try {
    const { user, dedupKey } = notificationData;
    // Upsert using $setOnInsert to ensure duplicates are strictly ignored
    await Notification.updateOne(
      { user, dedupKey },
      { $setOnInsert: notificationData },
      { upsert: true }
    );
  } catch (err) {
    // Ignore duplicate key error safely
    if (err.code !== 11000) {
      console.error('Notification Creation Error:', err.message);
    }
  }
};

/**
 * Evaluate user financial conditions and generate appropriate in-app notifications
 */
const evaluateAndGenerateUserNotifications = async (userId) => {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. Evaluate Budget Alerts
  const userBudgets = await Budget.find({ user: userId });

  for (const b of userBudgets) {
    const bStart = new Date(b.startDate);
    bStart.setHours(0, 0, 0, 0);
    const bEnd = new Date(b.endDate);
    bEnd.setHours(23, 59, 59, 999);

    const bTxs = await Transaction.find({
      user: userId,
      type: 'expense',
      category: b.category,
      date: { $gte: bStart, $lte: bEnd }
    });

    const spent = bTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const utilization = b.amount > 0 ? Number(((spent / b.amount) * 100).toFixed(1)) : 0;

    if (utilization > 100) {
      const overAmount = spent - b.amount;
      await createDeduplicatedNotification({
        user: userId,
        type: 'Budget',
        title: `${b.category} budget exceeded`,
        message: `Your spending is ₹${overAmount.toLocaleString()} above your ${b.category} budget limit of ₹${b.amount.toLocaleString()}.`,
        severity: 'warning',
        metadata: { category: b.category, limit: b.amount, spent, overAmount, actionUrl: '/budgets' },
        dedupKey: `${userId}_budget_exceeded_${b._id}_${monthStr}`
      });
    } else if (utilization >= 80) {
      await createDeduplicatedNotification({
        user: userId,
        type: 'Budget',
        title: `${b.category} budget is nearing its limit`,
        message: `You have used ${utilization}% of your ${b.category} budget (₹${spent.toLocaleString()} spent of ₹${b.amount.toLocaleString()}).`,
        severity: 'warning',
        metadata: { category: b.category, limit: b.amount, spent, utilizationPercentage: utilization, actionUrl: '/budgets' },
        dedupKey: `${userId}_budget_near_${b._id}_${monthStr}`
      });
    }
  }

  // 2. Evaluate Goal Progress Alerts
  const userGoals = await Goal.find({ user: userId, status: 'Active' });

  for (const g of userGoals) {
    const target = Number(g.targetAmount) || 0;
    const current = Number(g.currentAmount) || 0;
    const progressPct = target > 0 ? Number(((current / target) * 100).toFixed(1)) : 0;

    if (progressPct >= 100) {
      await createDeduplicatedNotification({
        user: userId,
        type: 'Goal',
        title: `Goal completed: ${g.name}`,
        message: `Congratulations! Your "${g.name}" goal has reached 100% of its target amount (₹${target.toLocaleString()}).`,
        severity: 'success',
        metadata: { goalId: g._id, goalName: g.name, actionUrl: '/goals' },
        dedupKey: `${userId}_goal_completed_${g._id}`
      });
    } else if (progressPct >= 50) {
      await createDeduplicatedNotification({
        user: userId,
        type: 'Goal',
        title: `Goal progress milestone: ${g.name}`,
        message: `Your "${g.name}" goal is currently ${progressPct}% complete (₹${current.toLocaleString()} saved of ₹${target.toLocaleString()}).`,
        severity: 'info',
        metadata: { goalId: g._id, goalName: g.name, progressPercentage: progressPct, actionUrl: '/goals' },
        dedupKey: `${userId}_goal_50pct_${g._id}`
      });
    }

    // Evaluate Goal Pace Adjustment via Planning Engine
    try {
      const plan = await goalPlanningService.calculateGoalPlan(userId, g._id);
      if (plan && plan.planSummary.fundingGap.fundingStatusText.includes('Below')) {
        await createDeduplicatedNotification({
          user: userId,
          type: 'Goal',
          title: `Goal planning update: ${g.name}`,
          message: `Your current savings pace is below the ₹${plan.planSummary.requiredSavings.monthly.toLocaleString()}/month required to reach "${g.name}" by target date.`,
          severity: 'warning',
          metadata: { goalId: g._id, goalName: g.name, actionUrl: '/goals' },
          dedupKey: `${userId}_goal_pace_${g._id}_${monthStr}`
        });
      }
    } catch (e) {
      // Ignore plan errors
    }
  }

  // 3. Evaluate Savings Milestones
  const currentMonthTxs = await Transaction.find({
    user: userId,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  });

  let curIncome = 0;
  let curExpenses = 0;
  currentMonthTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') curIncome += amt;
    if (tx.type === 'expense') curExpenses += amt;
  });

  const curSavings = curIncome - curExpenses;
  const curSavingsRate = curIncome > 0 ? Number(((curSavings / curIncome) * 100).toFixed(1)) : null;

  if (curSavingsRate !== null && curSavingsRate >= 25) {
    await createDeduplicatedNotification({
      user: userId,
      type: 'Savings',
      title: 'Savings milestone achieved',
      message: `Your savings rate reached ${curSavingsRate}% this month. Excellent progress!`,
      severity: 'success',
      metadata: { savingsRate: curSavingsRate, actionUrl: '/financial-health' },
      dedupKey: `${userId}_savings_milestone_${monthStr}`
    });
  }

  // 4. Monthly Review Notification
  if (currentMonthTxs.length > 0) {
    const monthLabel = startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    await createDeduplicatedNotification({
      user: userId,
      type: 'Monthly Review',
      title: `Your ${monthLabel} financial review is ready`,
      message: `Review your income, expenses, savings rate, and goal progress for ${monthLabel}.`,
      severity: 'info',
      metadata: { monthStr, actionUrl: '/monthly-review' },
      dedupKey: `${userId}_monthly_review_${monthStr}`
    });
  }
};

module.exports = {
  createDeduplicatedNotification,
  evaluateAndGenerateUserNotifications
};
