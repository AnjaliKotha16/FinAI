const mongoose = require('mongoose');
const { Transaction, ALLOWED_CATEGORIES } = require('../models/Transaction');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Helper to compute date range filter based on period parameter
 */
const getPeriodDateFilter = (period) => {
  const now = new Date();

  if (period === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { $gte: startOfDay };
  }

  if (period === 'week') {
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return { $gte: startOfWeek };
  }

  if (period === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { $gte: startOfMonth };
  }

  // 'all' or default -> no date filter
  return null;
};

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard financial summary, category breakdown, and recent transactions
 * @access  Private (Authenticated User only)
 */
const getDashboardData = async (req, res, next) => {
  try {
    const period = (req.query.period || 'month').toLowerCase();
    const dateFilter = getPeriodDateFilter(period);

    // Build query filter strictly for the authenticated user ID from verified JWT
    const periodQuery = { user: req.user._id };
    if (dateFilter) {
      periodQuery.date = dateFilter;
    }

    // 1. Fetch period transactions
    const periodTransactions = await Transaction.find(periodQuery)
      .sort({ date: -1, createdAt: -1 });

    // 2. Fetch all-time transactions for net balance computation
    const allTransactions = await Transaction.find({ user: req.user._id });

    // Calculate all-time net balance
    let allTimeIncome = 0;
    let allTimeExpenses = 0;
    allTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') allTimeIncome += amt;
      if (tx.type === 'expense') allTimeExpenses += amt;
    });
    const netBalance = allTimeIncome - allTimeExpenses;

    // Calculate period totals
    let periodIncome = 0;
    let periodExpenses = 0;
    const categoryTotals = {};

    ALLOWED_CATEGORIES.forEach((cat) => {
      categoryTotals[cat] = 0;
    });

    periodTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        periodIncome += amt;
      } else if (tx.type === 'expense') {
        periodExpenses += amt;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
      }
    });

    const periodSavings = periodIncome - periodExpenses;

    // Build Expense By Category breakdown
    const expenseByCategory = ALLOWED_CATEGORIES.map((cat) => {
      const amount = categoryTotals[cat] || 0;
      const percentage = periodExpenses > 0 ? Number(((amount / periodExpenses) * 100).toFixed(1)) : 0;
      return {
        category: cat,
        amount,
        percentage
      };
    }).filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // 3. Fetch latest 5 recent transactions
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      period,
      data: {
        income: periodIncome,
        expenses: periodExpenses,
        balance: netBalance,
        savings: periodSavings,
        summary: {
          income: periodIncome,
          expenses: periodExpenses,
          balance: netBalance,
          savings: periodSavings
        },
        expenseByCategory,
        recentTransactions,
        totalTransactionCount: periodTransactions.length,
        allTimeTransactionCount: allTransactions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData
};
