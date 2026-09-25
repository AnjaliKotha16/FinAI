const { Transaction } = require('../models/Transaction');
const { Budget } = require('../models/Budget');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Helper to compute date range filter and preceding comparison date range
 */
const getDateRanges = (period) => {
  const now = new Date();
  let startDate;
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === 'last_month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === '3months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
  } else if (period === '6months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  } else {
    // Default: 'month' (current month)
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  // Calculate preceding equivalent period for comparison
  const durationMs = endDate.getTime() - startDate.getTime();
  const previousEndDate = new Date(startDate.getTime() - 1);
  const previousStartDate = new Date(previousEndDate.getTime() - durationMs);

  return {
    startDate,
    endDate,
    previousStartDate,
    previousEndDate
  };
};

/**
 * @route   GET /api/financial-health
 * @desc    Get deterministic financial health assessment, score, indicators, and trends
 * @access  Private (Authenticated User only)
 */
const getFinancialHealth = async (req, res, next) => {
  try {
    const period = (req.query.period || 'month').toLowerCase();
    const { startDate, endDate, previousStartDate, previousEndDate } = getDateRanges(period);

    // 1. Fetch current period transactions strictly for authenticated user
    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    // 2. Fetch previous period transactions for trend comparison
    const previousTransactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: previousStartDate, $lte: previousEndDate }
    });

    // 3. Fetch all-time transactions count to check if data is sufficient
    const totalUserTxCount = await Transaction.countDocuments({ user: req.user._id });

    // Calculate core metrics for current period
    let income = 0;
    let expenses = 0;
    const incomeTxs = [];
    const expenseTxs = [];
    const dailyExpenses = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
        incomeTxs.push(tx);
      } else if (tx.type === 'expense') {
        expenses += amt;
        expenseTxs.push(tx);

        const dayKey = new Date(tx.date).toISOString().split('T')[0];
        dailyExpenses[dayKey] = (dailyExpenses[dayKey] || 0) + amt;
      }
    });

    const savings = income - expenses;
    const savingsRate = income > 0 ? Number(((savings / income) * 100).toFixed(1)) : 0;

    // Calculate previous period metrics
    let prevIncome = 0;
    let prevExpenses = 0;
    previousTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') prevIncome += amt;
      if (tx.type === 'expense') prevExpenses += amt;
    });

    const expenseChangeAmount = expenses - prevExpenses;
    const expenseChangePercentage = prevExpenses > 0
      ? Number(((expenseChangeAmount / prevExpenses) * 100).toFixed(1))
      : 0;

    let expenseTrendDirection = 'stable';
    if (expenseChangeAmount > 50) expenseTrendDirection = 'increased';
    else if (expenseChangeAmount < -50) expenseTrendDirection = 'decreased';

    // 4. Spending Consistency Analysis
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const activeSpendDays = Object.keys(dailyExpenses).length;
    const avgDailySpend = Number((expenses / totalDays).toFixed(2));

    let highestSpendDay = null;
    let lowestSpendDay = null;
    Object.entries(dailyExpenses).forEach(([day, amt]) => {
      if (!highestSpendDay || amt > highestSpendDay.amount) {
        highestSpendDay = { date: day, amount: amt };
      }
      if (!lowestSpendDay || amt < lowestSpendDay.amount) {
        lowestSpendDay = { date: day, amount: amt };
      }
    });

    // 5. Budget Performance Analysis (Reusing Phase 7 Budgets)
    const userBudgets = await Budget.find({ user: req.user._id });
    let totalBudgetedAmount = 0;
    let totalBudgetSpent = 0;
    let withinLimitCount = 0;
    let nearLimitCount = 0;
    let exceededCount = 0;

    for (const budget of userBudgets) {
      const bStart = new Date(budget.startDate);
      bStart.setHours(0, 0, 0, 0);
      const bEnd = new Date(budget.endDate);
      bEnd.setHours(23, 59, 59, 999);

      const bTxs = await Transaction.find({
        user: req.user._id,
        type: 'expense',
        category: budget.category,
        date: { $gte: bStart, $lte: bEnd }
      });

      const bSpent = bTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      totalBudgetedAmount += budget.amount;
      totalBudgetSpent += bSpent;

      const pct = budget.amount > 0 ? (bSpent / budget.amount) * 100 : 0;
      if (pct > 100) exceededCount++;
      else if (pct >= 75) nearLimitCount++;
      else withinLimitCount++;
    }

    const budgetUtilization = totalBudgetedAmount > 0
      ? Number(((totalBudgetSpent / totalBudgetedAmount) * 100).toFixed(1))
      : 0;

    // 6. Income Consistency Analysis
    const incomeCount = incomeTxs.length;
    const avgIncomeTx = incomeCount > 0 ? Number((income / incomeCount).toFixed(2)) : 0;
    let maxIncomeTx = null;
    let minIncomeTx = null;
    incomeTxs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (!maxIncomeTx || amt > maxIncomeTx.amount) maxIncomeTx = tx;
      if (!minIncomeTx || amt < minIncomeTx.amount) minIncomeTx = tx;
    });

    // 7. Monthly Trends (Last 6 Months Time-Series)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trendTransactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: sixMonthsAgo }
    }).sort({ date: 1 });

    const monthlyMap = {};
    trendTransactions.forEach((tx) => {
      const d = new Date(tx.date);
      const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthlyMap[monthLabel]) {
        monthlyMap[monthLabel] = { month: monthLabel, income: 0, expenses: 0, savings: 0 };
      }
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') monthlyMap[monthLabel].income += amt;
      if (tx.type === 'expense') monthlyMap[monthLabel].expenses += amt;
    });

    const monthlyTrends = Object.values(monthlyMap).map((m) => ({
      ...m,
      savings: m.income - m.expenses
    }));

    // 8. Deterministic Health Score Calculation (0-100)
    // Savings Rate Score (0-30 pts)
    let savingsRateScore = 0;
    if (savingsRate >= 25) savingsRateScore = 30;
    else if (savingsRate > 0) savingsRateScore = (savingsRate / 25) * 30;

    // Expense Ratio Score (0-30 pts)
    let expenseRatioScore = 0;
    const expenseRatio = income > 0 ? (expenses / income) : 1;
    if (expenseRatio <= 0.60) expenseRatioScore = 30;
    else if (expenseRatio < 1.0) expenseRatioScore = (1 - (expenseRatio - 0.60) / 0.40) * 30;

    // Budget Discipline Score (0-20 pts)
    let budgetDisciplineScore = 15; // default neutral if no budgets
    if (userBudgets.length > 0) {
      budgetDisciplineScore = ((withinLimitCount + nearLimitCount * 0.5) / userBudgets.length) * 20;
    }

    // Cash Flow Score (0-20 pts)
    let cashFlowScore = 5;
    if (income > 0 && savings > 0) cashFlowScore = 20;
    else if (income > 0 && savings === 0) cashFlowScore = 10;

    const totalHealthScore = Math.min(
      100,
      Math.max(0, Math.round(savingsRateScore + expenseRatioScore + budgetDisciplineScore + cashFlowScore))
    );

    let scoreRating = 'Fair';
    if (totalHealthScore >= 80) scoreRating = 'Excellent';
    else if (totalHealthScore >= 65) scoreRating = 'Good';
    else if (totalHealthScore < 50) scoreRating = 'Needs Attention';

    return res.status(200).json({
      success: true,
      period,
      data: {
        hasInsufficientData: totalUserTxCount < 2,
        totalUserTxCount,
        metrics: {
          income,
          expenses,
          savings,
          savingsRate
        },
        healthScore: {
          score: totalHealthScore,
          rating: scoreRating,
          breakdown: {
            savingsRateScore: Math.round(savingsRateScore),
            expenseRatioScore: Math.round(expenseRatioScore),
            budgetDisciplineScore: Math.round(budgetDisciplineScore),
            cashFlowScore: Math.round(cashFlowScore)
          },
          disclaimer: 'Application-generated metric based strictly on recorded numerical data for informational purposes only. Not financial advice.'
        },
        expenseTrend: {
          prevExpenses,
          currentExpenses: expenses,
          changeAmount: expenseChangeAmount,
          changePercentage: expenseChangePercentage,
          direction: expenseTrendDirection
        },
        spendingConsistency: {
          totalDays,
          activeSpendDays,
          avgDailySpend,
          highestSpendDay,
          lowestSpendDay
        },
        budgetPerformance: {
          activeBudgetsCount: userBudgets.length,
          withinLimitCount,
          nearLimitCount,
          exceededCount,
          overallBudgetUtilization: budgetUtilization
        },
        incomeAnalysis: {
          incomeCount,
          avgIncomeTx,
          maxIncomeAmount: maxIncomeTx ? maxIncomeTx.amount : 0,
          minIncomeAmount: minIncomeTx ? minIncomeTx.amount : 0
        },
        monthlyTrends
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinancialHealth
};
