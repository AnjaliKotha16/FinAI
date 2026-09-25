const { Transaction, ALLOWED_CATEGORIES } = require('../models/Transaction');
const { Budget } = require('../models/Budget');
const { Goal } = require('../models/Goal');
const goalPlanningService = require('./goalPlanningService');
const investmentService = require('./investmentService');

/**
 * Generate deterministic financial insights strictly for authenticated user.
 * Combines Spending, Budget, Savings, Goal, Investment, and Positive insights.
 */
const generateUserInsights = async (userId) => {
  const insights = [];
  const now = new Date();

  // Date ranges for current month and previous month
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // 1. Fetch User Data Models
  const allUserTxs = await Transaction.find({ user: userId });
  const userBudgets = await Budget.find({ user: userId });
  const userGoals = await Goal.find({ user: userId, status: 'Active' });

  // Early return if user has no financial activity recorded yet
  if (allUserTxs.length === 0 && userBudgets.length === 0 && userGoals.length === 0) {
    return [];
  }
  const currentMonthTxs = await Transaction.find({
    user: userId,
    date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
  });
  const prevMonthTxs = await Transaction.find({
    user: userId,
    date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
  });

  // Calculate current month financial totals
  let curIncome = 0;
  let curExpenses = 0;
  const curCategoryTotals = {};
  ALLOWED_CATEGORIES.forEach((c) => (curCategoryTotals[c] = 0));

  currentMonthTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') curIncome += amt;
    if (tx.type === 'expense') {
      curExpenses += amt;
      curCategoryTotals[tx.category] = (curCategoryTotals[tx.category] || 0) + amt;
    }
  });

  // Calculate previous month financial totals
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

  const curSavings = curIncome - curExpenses;
  const curSavingsRate = curIncome > 0 ? Number(((curSavings / curIncome) * 100).toFixed(1)) : 0;

  const prevSavings = prevIncome - prevExpenses;
  const prevSavingsRate = prevIncome > 0 ? Number(((prevSavings / prevIncome) * 100).toFixed(1)) : 0;

  // --- A. SPENDING INSIGHTS ---
  if (currentMonthTxs.length > 0 || prevMonthTxs.length > 0) {
    // 1. Category Spending Comparison (Increase / Decrease)
    ALLOWED_CATEGORIES.forEach((cat) => {
      const curAmt = curCategoryTotals[cat] || 0;
      const prevAmt = prevCategoryTotals[cat] || 0;

      if (prevAmt > 0 && curAmt > 0) {
        const diff = curAmt - prevAmt;
        const pctChange = Number(((diff / prevAmt) * 100).toFixed(1));

        if (pctChange >= 15) {
          insights.push({
            id: `spending_inc_${cat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            type: 'spending',
            category: 'Spending',
            title: `${cat} spending increased`,
            description: `Your ${cat} spending increased by ${pctChange}% this month compared with last month (₹${curAmt.toLocaleString()} vs ₹${prevAmt.toLocaleString()}).`,
            severity: 'warning',
            data: { category: cat, currentAmount: curAmt, previousAmount: prevAmt, percentageChange: pctChange },
            createdAt: now
          });
        } else if (pctChange <= -15) {
          insights.push({
            id: `spending_dec_${cat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            type: 'spending',
            category: 'Spending',
            title: `${cat} spending reduced`,
            description: `Your ${cat} spending decreased by ${Math.abs(pctChange)}% compared with last month (₹${curAmt.toLocaleString()} vs ₹${prevAmt.toLocaleString()}).`,
            severity: 'positive',
            data: { category: cat, currentAmount: curAmt, previousAmount: prevAmt, percentageChange: pctChange },
            createdAt: now
          });
        }
      }
    });

    // 2. Largest Spending Category
    const sortedCategories = Object.entries(curCategoryTotals)
      .filter(([_, amt]) => amt > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
      const topCat = sortedCategories[0];
      const topPct = curExpenses > 0 ? Number(((topCat[1] / curExpenses) * 100).toFixed(1)) : 0;

      insights.push({
        id: 'spending_top_category',
        type: 'spending',
        category: 'Spending',
        title: `Top Spending Category: ${topCat[0]}`,
        description: `${topCat[0]} is your largest spending category this month, accounting for ₹${topCat[1].toLocaleString()} (${topPct}% of total expenses).`,
        severity: 'info',
        data: { category: topCat[0], amount: topCat[1], percentageOfExpenses: topPct },
        createdAt: now
      });
    }
  }

  // --- B. SAVINGS INSIGHTS & POSITIVE ACHIEVEMENTS ---
  if (curIncome > 0 && prevIncome > 0) {
    const rateDiff = Number((curSavingsRate - prevSavingsRate).toFixed(1));

    if (rateDiff >= 3) {
      insights.push({
        id: 'savings_rate_improved',
        type: 'savings',
        category: 'Savings',
        title: 'Savings Rate Improved',
        description: `Your monthly savings rate improved from ${prevSavingsRate}% last month to ${curSavingsRate}% this month.`,
        severity: 'positive',
        data: { currentSavingsRate: curSavingsRate, previousSavingsRate: prevSavingsRate, difference: rateDiff },
        createdAt: now
      });
    } else if (rateDiff <= -5) {
      insights.push({
        id: 'savings_rate_dropped',
        type: 'savings',
        category: 'Savings',
        title: 'Savings Rate Decreased',
        description: `Your savings rate dropped from ${prevSavingsRate}% last month to ${curSavingsRate}% this month.`,
        severity: 'warning',
        data: { currentSavingsRate: curSavingsRate, previousSavingsRate: prevSavingsRate, difference: rateDiff },
        createdAt: now
      });
    }
  } else if (curIncome > 0 && curSavingsRate >= 25) {
    insights.push({
      id: 'savings_rate_strong',
      type: 'positive',
      category: 'Savings',
      title: 'Strong Savings Rate',
      description: `You saved ${curSavingsRate}% of your total income this month (₹${curSavings.toLocaleString()} saved).`,
      severity: 'positive',
      data: { currentSavingsRate: curSavingsRate, savingsAmount: curSavings },
      createdAt: now
    });
  }

  // --- C. BUDGET INSIGHTS ---
  if (userBudgets.length > 0) {
    let exceededCount = 0;
    let nearLimitCount = 0;
    let withinLimitCount = 0;

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

      const spent = bTxs.reduce((s, tx) => s + (Number(tx.amount) || 0), 0);
      const utilization = b.amount > 0 ? Number(((spent / b.amount) * 100).toFixed(1)) : 0;
      const daysRemaining = Math.max(0, Math.ceil((bEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      if (utilization > 100) {
        exceededCount++;
        const overAmount = spent - b.amount;
        insights.push({
          id: `budget_exceeded_${b._id}`,
          type: 'budget',
          category: 'Budget',
          title: `${b.category} Budget Exceeded`,
          description: `Your ${b.category} spending (₹${spent.toLocaleString()}) has exceeded your limit of ₹${b.amount.toLocaleString()} by ₹${overAmount.toLocaleString()} (${utilization}% utilization).`,
          severity: 'warning',
          data: { category: b.category, limit: b.amount, spent, overAmount, utilizationPercentage: utilization },
          createdAt: now
        });
      } else if (utilization >= 75) {
        nearLimitCount++;
        const remaining = b.amount - spent;
        insights.push({
          id: `budget_near_limit_${b._id}`,
          type: 'budget',
          category: 'Budget',
          title: `${b.category} Budget Near Limit`,
          description: `You have used ${utilization}% of your ${b.category} budget (₹${spent.toLocaleString()} spent, ₹${remaining.toLocaleString()} remaining with ${daysRemaining} days left).`,
          severity: 'warning',
          data: { category: b.category, limit: b.amount, spent, remaining, daysRemaining, utilizationPercentage: utilization },
          createdAt: now
        });
      } else {
        withinLimitCount++;
      }
    }

    if (exceededCount === 0 && nearLimitCount === 0 && userBudgets.length > 0) {
      insights.push({
        id: 'budget_all_positive',
        type: 'positive',
        category: 'Budget',
        title: 'Excellent Budget Discipline',
        description: `You stayed within all ${userBudgets.length} of your active category budgets this month. Great discipline!`,
        severity: 'positive',
        data: { activeBudgetsCount: userBudgets.length },
        createdAt: now
      });
    }
  }

  // --- D. GOAL INSIGHTS ---
  for (const g of userGoals) {
    const target = Number(g.targetAmount) || 0;
    const current = Number(g.currentAmount) || 0;
    const progressPct = target > 0 ? Number(((current / target) * 100).toFixed(1)) : 0;

    let plan = null;
    try {
      plan = await goalPlanningService.calculateGoalPlan(userId, g._id);
    } catch (e) {
      plan = null;
    }

    if (plan) {
      const requiredMonthly = plan.planSummary.requiredSavings.monthly;
      const currentMonthlySavingsPace = curSavings > 0 ? curSavings : 0;

      if (progressPct >= 100) {
        insights.push({
          id: `goal_completed_${g._id}`,
          type: 'positive',
          category: 'Goals',
          title: `Goal Achieved: ${g.name}`,
          description: `Congratulations! You have successfully reached 100% of your target amount (₹${current.toLocaleString()}) for "${g.name}".`,
          severity: 'positive',
          data: { goalName: g.name, targetAmount: target, currentAmount: current },
          createdAt: now
        });
      } else if (currentMonthlySavingsPace >= requiredMonthly && requiredMonthly > 0) {
        insights.push({
          id: `goal_on_track_${g._id}`,
          type: 'goals',
          category: 'Goals',
          title: `Goal On Track: ${g.name}`,
          description: `Your "${g.name}" goal is on track. Your current savings pace (₹${currentMonthlySavingsPace.toLocaleString()}/month) meets or exceeds the required ₹${requiredMonthly.toLocaleString()}/month pace.`,
          severity: 'positive',
          data: { goalName: g.name, progressPercentage: progressPct, requiredMonthly, currentPace: currentMonthlySavingsPace },
          createdAt: now
        });
      } else if (requiredMonthly > currentMonthlySavingsPace && requiredMonthly > 0) {
        const gap = requiredMonthly - currentMonthlySavingsPace;
        insights.push({
          id: `goal_behind_pace_${g._id}`,
          type: 'goals',
          category: 'Goals',
          title: `Goal Savings Adjustment Needed: ${g.name}`,
          description: `Your current monthly savings pace (₹${currentMonthlySavingsPace.toLocaleString()}) is below the ₹${requiredMonthly.toLocaleString()}/month pace needed to reach "${g.name}" by ${new Date(g.targetDate).toLocaleDateString()}. Shortfall: ₹${gap.toLocaleString()}/month.`,
          severity: 'warning',
          data: { goalName: g.name, progressPercentage: progressPct, requiredMonthly, currentPace: currentMonthlySavingsPace, shortfall: gap },
          createdAt: now
        });
      }
    }
  }

  // --- E. INVESTMENT & FINANCIAL HEALTH INSIGHTS ---
  try {
    const invPlan = await investmentService.getInvestmentPlan(userId);
    if (invPlan && invPlan.emergencyFundEstimate) {
      const { emergencyFundStatus, estimatedEmergencyFundTarget } = invPlan.emergencyFundEstimate;

      if (emergencyFundStatus === 'Needs Review') {
        insights.push({
          id: 'investment_emergency_fund_gap',
          type: 'investment',
          category: 'Investments',
          title: 'Emergency Cushion Recommendation',
          description: `Your estimated liquid cushion target is ₹${estimatedEmergencyFundTarget.toLocaleString()} (${invPlan.profile.emergencyFundMonths} months of essential expenses). Consider building this reserve alongside long-term investments.`,
          severity: 'info',
          data: { targetAmount: estimatedEmergencyFundTarget, emergencyFundMonths: invPlan.profile.emergencyFundMonths },
          createdAt: now
        });
      } else if (emergencyFundStatus === 'Sufficient Liquid Cushion') {
        insights.push({
          id: 'investment_emergency_fund_healthy',
          type: 'positive',
          category: 'Investments',
          title: 'Sufficient Emergency Fund',
          description: `You have a healthy liquid cushion covering at least ${invPlan.profile.emergencyFundMonths} months of essential expenses. This provides strong stability for investing.`,
          severity: 'positive',
          data: { emergencyFundMonths: invPlan.profile.emergencyFundMonths },
          createdAt: now
        });
      }
    }
  } catch (err) {
    // Gracefully continue if investment profile not created
  }

  // Sorting insights: warnings first, then positive, then info
  const severityOrder = { warning: 1, positive: 2, info: 3 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return insights;
};

module.exports = {
  generateUserInsights
};
