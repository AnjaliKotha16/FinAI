const { Transaction, ALLOWED_CATEGORIES } = require('../models/Transaction');
const { Budget } = require('../models/Budget');
const { Goal } = require('../models/Goal');
const goalPlanningService = require('./goalPlanningService');
const investmentService = require('./investmentService');
const insightService = require('./insightService');

/**
 * Parse a month string (YYYY-MM) into precise start and end Date objects in UTC/local time
 */
const parseMonthRange = (monthStr) => {
  let dateObj = new Date();

  if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
    const [year, month] = monthStr.split('-').map(Number);
    dateObj = new Date(year, month - 1, 1);
  }

  const year = dateObj.getFullYear();
  const monthIdx = dateObj.getMonth();

  const startDate = new Date(year, monthIdx, 1, 0, 0, 0, 0);
  const endDate = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

  // Preceding month range for MoM comparison
  const prevStartDate = new Date(year, monthIdx - 1, 1, 0, 0, 0, 0);
  const prevEndDate = new Date(year, monthIdx, 0, 23, 59, 59, 999);

  const monthLabel = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonthLabel = prevStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const canonicalMonthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
  const canonicalPrevMonthStr = `${prevStartDate.getFullYear()}-${String(prevStartDate.getMonth() + 1).padStart(2, '0')}`;

  return {
    monthStr: canonicalMonthStr,
    prevMonthStr: canonicalPrevMonthStr,
    monthLabel,
    prevMonthLabel,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    daysInMonth: endDate.getDate()
  };
};

/**
 * Safely compute percentage change between two numbers
 */
const calculatePercentageChange = (currentVal, previousVal) => {
  if (previousVal === 0 && currentVal === 0) {
    return { changePercentage: 0, changeAmount: 0, text: 'No change', status: 'neutral' };
  }
  if (previousVal === 0) {
    return { changePercentage: null, changeAmount: currentVal, text: 'No previous data', status: 'new' };
  }

  const diff = currentVal - previousVal;
  const pct = Number(((diff / Math.abs(previousVal)) * 100).toFixed(1));
  let text = 'No change';
  let status = 'neutral';

  if (pct > 0) {
    text = `+${pct}%`;
    status = 'increased';
  } else if (pct < 0) {
    text = `${pct}%`;
    status = 'decreased';
  }

  return {
    changePercentage: pct,
    changeAmount: diff,
    text,
    status
  };
};

/**
 * Main Monthly Financial Review generator
 */
const generateMonthlyReview = async (userId, monthParam) => {
  const range = parseMonthRange(monthParam);

  // 1. Query Transactions for Selected Month and Previous Month
  const currentMonthTxs = await Transaction.find({
    user: userId,
    date: { $gte: range.startDate, $lte: range.endDate }
  }).sort({ date: -1 });

  const prevMonthTxs = await Transaction.find({
    user: userId,
    date: { $gte: range.prevStartDate, $lte: range.prevEndDate }
  });

  // Calculate Selected Month Totals
  let income = 0;
  let expenses = 0;
  const categoryTotals = {};
  ALLOWED_CATEGORIES.forEach((c) => (categoryTotals[c] = 0));

  currentMonthTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') income += amt;
    if (tx.type === 'expense') {
      expenses += amt;
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
    }
  });

  const savings = income - expenses;
  const savingsRate = income > 0 ? Number(((savings / income) * 100).toFixed(1)) : null;
  const avgDailySpending = range.daysInMonth > 0 ? Number((expenses / range.daysInMonth).toFixed(2)) : 0;

  // Calculate Previous Month Totals
  let prevIncome = 0;
  let prevExpenses = 0;
  const prevCategoryTotals = {};
  ALLOWED_CATEGORIES.forEach((c) => (prevCategoryTotals[c] = 0));

  prevMonthTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') prevIncome += amt;
    if (tx.type === 'expense') {
      prevExpenses += amt;
      prevCategoryTotals[tx.category] = (prevCategoryTotals[tx.category] || 0) + amt;
    }
  });

  const prevSavings = prevIncome - prevExpenses;
  const prevSavingsRate = prevIncome > 0 ? Number(((prevSavings / prevIncome) * 100).toFixed(1)) : null;

  // 2. Spending Category Breakdown
  const categoryBreakdown = ALLOWED_CATEGORIES.map((cat) => {
    const amount = categoryTotals[cat] || 0;
    const prevAmount = prevCategoryTotals[cat] || 0;
    const percentageOfExpenses = expenses > 0 ? Number(((amount / expenses) * 100).toFixed(1)) : 0;
    const momComparison = calculatePercentageChange(amount, prevAmount);

    return {
      category: cat,
      amount,
      prevAmount,
      percentageOfExpenses,
      momComparison
    };
  }).filter((c) => c.amount > 0 || c.prevAmount > 0)
    .sort((a, b) => b.amount - a.amount);

  const largestCategoryItem = categoryBreakdown.length > 0 && categoryBreakdown[0].amount > 0 ? categoryBreakdown[0] : null;

  // 3. Budget Performance for Selected Month
  const allBudgets = await Budget.find({ user: userId });
  const applicableBudgets = [];

  for (const b of allBudgets) {
    const bStart = new Date(b.startDate);
    bStart.setHours(0, 0, 0, 0);
    const bEnd = new Date(b.endDate);
    bEnd.setHours(23, 59, 59, 999);

    // Include budget if its date range overlaps with the selected month
    if (bStart <= range.endDate && bEnd >= range.startDate) {
      const bTxs = await Transaction.find({
        user: userId,
        type: 'expense',
        category: b.category,
        date: { $gte: bStart, $lte: bEnd }
      });

      const spent = bTxs.reduce((s, tx) => s + (Number(tx.amount) || 0), 0);
      const remaining = Math.max(0, b.amount - spent);
      const utilizationPercentage = b.amount > 0 ? Number(((spent / b.amount) * 100).toFixed(1)) : 0;

      let status = 'On Track';
      if (utilizationPercentage > 100) status = 'Exceeded';
      else if (utilizationPercentage >= 75) status = 'Near Limit';

      applicableBudgets.push({
        budgetId: b._id,
        category: b.category,
        budgetLimit: b.amount,
        spentAmount: spent,
        remainingAmount: remaining,
        utilizationPercentage,
        status,
        period: b.period
      });
    }
  }

  // 4. Month-Over-Month Comparisons
  const comparison = {
    income: calculatePercentageChange(income, prevIncome),
    expenses: calculatePercentageChange(expenses, prevExpenses),
    savings: calculatePercentageChange(savings, prevSavings),
    savingsRate: prevSavingsRate !== null && savingsRate !== null
      ? { changePercentage: Number((savingsRate - prevSavingsRate).toFixed(1)), text: `${(savingsRate - prevSavingsRate).toFixed(1)}% pts` }
      : { changePercentage: null, text: 'N/A' }
  };

  // 5. Goal Progress Integration
  const activeGoals = await Goal.find({ user: userId });
  const goalProgressList = [];

  for (const g of activeGoals) {
    const target = Number(g.targetAmount) || 0;
    const current = Number(g.currentAmount) || 0;
    const remaining = Math.max(0, target - current);
    const progressPct = target > 0 ? Number(((current / target) * 100).toFixed(1)) : 0;

    let plan = null;
    try {
      plan = await goalPlanningService.calculateGoalPlan(userId, g._id);
    } catch (e) {
      plan = null;
    }

    let status = 'On Track';
    let requiredMonthlySavings = 0;

    if (plan) {
      requiredMonthlySavings = plan.planSummary.requiredSavings.monthly;
      const currentPace = savings > 0 ? savings : 0;
      if (progressPct >= 100) status = 'Completed';
      else if (currentPace < requiredMonthlySavings && requiredMonthlySavings > 0) status = 'Needs Adjustment';
    }

    goalProgressList.push({
      goalId: g._id,
      name: g.name,
      targetAmount: target,
      currentAmount: current,
      remainingAmount: remaining,
      progressPercentage: progressPct,
      targetDate: g.targetDate.toISOString().split('T')[0],
      requiredMonthlySavings,
      status
    });
  }

  // 6. Investment Planning Summary
  let investmentSummary = null;
  try {
    const invPlan = await investmentService.getInvestmentPlan(userId);
    if (invPlan) {
      investmentSummary = {
        riskPreference: invPlan.profile.riskPreference,
        investmentHorizon: invPlan.profile.investmentHorizon,
        emergencyFundMonths: invPlan.profile.emergencyFundMonths,
        emergencyFundStatus: invPlan.emergencyFundEstimate.emergencyFundStatus,
        emergencyFundTarget: invPlan.emergencyFundEstimate.estimatedEmergencyFundTarget,
        suggestedInvestmentCapacity: invPlan.investmentCapacity.suggestedInvestmentAmount,
        riskCapacityRating: invPlan.riskAnalysis.riskCapacityRating
      };
    }
  } catch (err) {
    investmentSummary = null;
  }

  // 7. Personalized Insights Integration (Phase 13)
  const rawInsights = await insightService.generateUserInsights(userId);
  const insights = rawInsights.slice(0, 5); // Pick top 5 insights

  // 8. Factual Monthly Highlights Generator
  const highlights = [];

  if (currentMonthTxs.length === 0) {
    highlights.push('No financial transactions were recorded for this month.');
  } else {
    // Expense change highlight
    if (prevMonthTxs.length > 0) {
      if (comparison.expenses.status === 'decreased') {
        highlights.push(`Your expenses decreased by ${Math.abs(comparison.expenses.changePercentage)}% compared with ${range.prevMonthLabel}.`);
      } else if (comparison.expenses.status === 'increased') {
        highlights.push(`Your expenses increased by ${comparison.expenses.changePercentage}% compared with ${range.prevMonthLabel}.`);
      } else {
        highlights.push(`Your total expenses remained similar to ${range.prevMonthLabel}.`);
      }
    }

    // Largest category highlight
    if (largestCategoryItem) {
      highlights.push(`${largestCategoryItem.category} was your largest spending category this month (₹${largestCategoryItem.amount.toLocaleString()} accounting for ${largestCategoryItem.percentageOfExpenses}% of expenses).`);
    }

    // Savings rate highlight
    if (savingsRate !== null) {
      highlights.push(`You achieved a savings rate of ${savingsRate}% by saving ₹${savings.toLocaleString()} of your income.`);
    }

    // Budget performance highlight
    if (applicableBudgets.length > 0) {
      const withinCount = applicableBudgets.filter((b) => b.status === 'On Track' || b.status === 'Near Limit').length;
      highlights.push(`You stayed within ${withinCount} out of ${applicableBudgets.length} applicable budgets.`);
    }

    // Goals highlight
    if (goalProgressList.length > 0) {
      const onTrackCount = goalProgressList.filter((g) => g.status === 'On Track' || g.status === 'Completed').length;
      highlights.push(`${onTrackCount} out of ${goalProgressList.length} active financial goals are on track or completed.`);
    }
  }

  return {
    period: {
      monthStr: range.monthStr,
      prevMonthStr: range.prevMonthStr,
      label: range.monthLabel,
      prevLabel: range.prevMonthLabel,
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      daysInMonth: range.daysInMonth
    },
    summary: {
      income,
      expenses,
      savings,
      savingsRate,
      savingsRateText: savingsRate !== null ? `${savingsRate}%` : 'Unavailable (No income recorded)',
      transactionCount: currentMonthTxs.length,
      avgDailySpending
    },
    categoryBreakdown,
    largestCategory: largestCategoryItem ? { category: largestCategoryItem.category, amount: largestCategoryItem.amount } : null,
    budgetPerformance: applicableBudgets,
    comparison,
    goalProgress: goalProgressList,
    investmentSummary,
    insights,
    highlights,
    disclaimer: 'This review provides educational and planning information based on verified account data for the selected month.'
  };
};

module.exports = {
  parseMonthRange,
  calculatePercentageChange,
  generateMonthlyReview
};
