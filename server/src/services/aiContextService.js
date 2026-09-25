const { Transaction, ALLOWED_CATEGORIES } = require('../models/Transaction');
const { Budget } = require('../models/Budget');
const { Goal } = require('../models/Goal');
const investmentService = require('./investmentService');
const goalPlanningService = require('./goalPlanningService');

/**
 * Detect user question intent based on natural language keywords
 */
const detectIntent = (question) => {
  const q = (question || '').toLowerCase();

  const isBudget = q.includes('budget') || q.includes('limit') || q.includes('utilization') || q.includes('overspending');
  const isGoal = q.includes('goal') || q.includes('target') || q.includes('saving for') || q.includes('save for') || q.includes('buy');
  const isInvestment = q.includes('invest') || q.includes('portfolio') || q.includes('risk') || q.includes('asset') || q.includes('allocation') || q.includes('horizon');
  const isSpending = q.includes('spend') || q.includes('expense') || q.includes('spent') || q.includes('category') || q.includes('transaction') || q.includes('bought') || q.includes('income') || q.includes('save') || q.includes('savings');

  if (isBudget) return 'budget';
  if (isGoal) return 'goal';
  if (isInvestment) return 'investment';
  if (isSpending) return 'spending';

  return 'general';
};

/**
 * Retrieve summarized financial context strictly for authenticated user
 * based on question intent.
 */
const buildUserFinancialContext = async (userId, userQuestion) => {
  const intent = detectIntent(userQuestion);

  const contextData = {
    intent,
    currencySymbol: '₹', // Application default currency
    financialSnapshot: null,
    spendingData: null,
    budgetData: null,
    goalData: null,
    investmentData: null
  };

  // Always compute basic financial summary
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const allTransactions = await Transaction.find({ user: userId });
  const monthTransactions = await Transaction.find({
    user: userId,
    date: { $gte: startOfMonth }
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  allTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') totalIncome += amt;
    if (tx.type === 'expense') totalExpenses += amt;
  });
  const currentNetBalance = totalIncome - totalExpenses;

  let monthIncome = 0;
  let monthExpenses = 0;
  const categoryMap = {};

  monthTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') monthIncome += amt;
    if (tx.type === 'expense') {
      monthExpenses += amt;
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + amt;
    }
  });

  const monthSavings = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? Number(((monthSavings / monthIncome) * 100).toFixed(1)) : 0;

  // Previous month expenses for comparison
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const prevMonthTxs = await Transaction.find({
    user: userId,
    type: 'expense',
    date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
  });
  const prevMonthExpenses = prevMonthTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const expenseDiffMonth = monthExpenses - prevMonthExpenses;

  contextData.financialSnapshot = {
    netBalance: currentNetBalance,
    currentMonthIncome: monthIncome,
    currentMonthExpenses: monthExpenses,
    currentMonthSavings: monthSavings,
    savingsRatePercentage: savingsRate,
    prevMonthExpenses,
    expenseMonthDifference: expenseDiffMonth,
    totalTransactionCount: allTransactions.length
  };

  // Intent Specific Data Retrieval
  if (intent === 'spending' || intent === 'general') {
    const topCategories = Object.entries(categoryMap)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: monthExpenses > 0 ? Number(((amount / monthExpenses) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const recent5 = await Transaction.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    contextData.spendingData = {
      monthExpenses,
      topCategories,
      highestCategory: topCategories.length > 0 ? topCategories[0] : null,
      recentTransactions: recent5.map((t) => ({
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date.toISOString().split('T')[0]
      }))
    };
  }

  if (intent === 'budget' || intent === 'general') {
    const userBudgets = await Budget.find({ user: userId });
    let totalBudgeted = 0;
    let totalSpentInBudgets = 0;
    const budgetList = [];

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
      const remaining = Math.max(0, b.amount - spent);
      const utilization = b.amount > 0 ? Number(((spent / b.amount) * 100).toFixed(1)) : 0;

      totalBudgeted += b.amount;
      totalSpentInBudgets += spent;

      let status = 'Within Limit';
      if (utilization > 100) status = 'Exceeded';
      else if (utilization >= 75) status = 'Near Limit';

      budgetList.push({
        category: b.category,
        budgetAmount: b.amount,
        spentAmount: spent,
        remainingAmount: remaining,
        utilizationPercentage: utilization,
        status,
        period: b.period
      });
    }

    const overallUtilization = totalBudgeted > 0 ? Number(((totalSpentInBudgets / totalBudgeted) * 100).toFixed(1)) : 0;

    contextData.budgetData = {
      totalBudgetsCount: userBudgets.length,
      totalBudgetedAmount: totalBudgeted,
      totalSpentInBudgets,
      overallUtilizationPercentage: overallUtilization,
      budgets: budgetList
    };
  }

  if (intent === 'goal' || intent === 'general') {
    const userGoals = await Goal.find({ user: userId }).sort({ targetDate: 1 });
    const goalsList = [];

    for (const g of userGoals) {
      const target = Number(g.targetAmount) || 0;
      const current = Number(g.currentAmount) || 0;
      const remaining = Math.max(0, target - current);
      const progressPct = target > 0 ? Number(((current / target) * 100).toFixed(1)) : 0;

      let detailedPlan = null;
      try {
        detailedPlan = await goalPlanningService.calculateGoalPlan(userId, g._id);
      } catch (e) {
        detailedPlan = null;
      }

      goalsList.push({
        goalId: g._id,
        name: g.name,
        targetAmount: target,
        currentAmount: current,
        remainingAmount: remaining,
        progressPercentage: progressPct,
        status: g.status,
        priority: g.priority,
        targetDate: g.targetDate.toISOString().split('T')[0],
        requiredMonthlySavings: detailedPlan ? detailedPlan.planSummary.requiredSavings.monthly : 0,
        currentSavingsPace: detailedPlan ? detailedPlan.planSummary.currentPace.monthlySavings : monthSavings
      });
    }

    contextData.goalData = {
      totalGoalsCount: userGoals.length,
      goals: goalsList
    };
  }

  if (intent === 'investment' || intent === 'general') {
    try {
      const plan = await investmentService.getInvestmentPlan(userId);
      contextData.investmentData = {
        riskPreference: plan.profile.riskPreference,
        investmentHorizon: plan.profile.investmentHorizon,
        emergencyFundMonths: plan.profile.emergencyFundMonths,
        emergencyFundStatus: plan.emergencyFundEstimate.emergencyFundStatus,
        emergencyFundTarget: plan.emergencyFundEstimate.estimatedEmergencyFundTarget,
        suggestedInvestmentCapacity: plan.investmentCapacity.suggestedInvestmentAmount,
        assetAllocation: plan.assetAllocation,
        riskCapacityRating: plan.riskAnalysis.riskCapacityRating,
        riskCapacityScore: plan.riskAnalysis.riskCapacityScore
      };
    } catch (e) {
      contextData.investmentData = null;
    }
  }

  return contextData;
};

/**
 * Format context object into a clear text prompt for the LLM
 */
const formatContextPrompt = (context) => {
  const { intent, financialSnapshot, spendingData, budgetData, goalData, investmentData } = context;

  let text = `AUTHENTICATED USER FINANCIAL CONTEXT (Detected Intent: ${intent.toUpperCase()}):\n`;
  text += `---------------------------------------------------\n`;
  text += `Financial Snapshot:\n`;
  text += `- Current Net Balance: ₹${financialSnapshot.netBalance.toLocaleString()}\n`;
  text += `- Current Month Income: ₹${financialSnapshot.currentMonthIncome.toLocaleString()}\n`;
  text += `- Current Month Expenses: ₹${financialSnapshot.currentMonthExpenses.toLocaleString()}\n`;
  text += `- Current Month Savings: ₹${financialSnapshot.currentMonthSavings.toLocaleString()} (Savings Rate: ${financialSnapshot.savingsRatePercentage}%)\n`;
  text += `- Previous Month Expenses: ₹${financialSnapshot.prevMonthExpenses.toLocaleString()} (Change: ₹${financialSnapshot.expenseMonthDifference >= 0 ? '+' : ''}${financialSnapshot.expenseMonthDifference.toLocaleString()})\n\n`;

  if (spendingData) {
    text += `Spending Analytics:\n`;
    if (spendingData.topCategories.length > 0) {
      text += `- Top Category Spending Breakdown:\n`;
      spendingData.topCategories.forEach((cat) => {
        text += `  * ${cat.category}: ₹${cat.amount.toLocaleString()} (${cat.percentage}% of month expenses)\n`;
      });
    } else {
      text += `- No expense categories recorded for this period.\n`;
    }
    if (spendingData.recentTransactions.length > 0) {
      text += `- Recent Transactions:\n`;
      spendingData.recentTransactions.forEach((t) => {
        text += `  * [${t.date}] ${t.title} (${t.category}): ₹${t.amount.toLocaleString()} (${t.type})\n`;
      });
    }
    text += `\n`;
  }

  if (budgetData) {
    text += `Budgets:\n`;
    text += `- Total Budgets Active: ${budgetData.totalBudgetsCount}\n`;
    text += `- Overall Budget Utilization: ${budgetData.overallUtilizationPercentage}% (Spent ₹${budgetData.totalSpentInBudgets.toLocaleString()} of ₹${budgetData.totalBudgetedAmount.toLocaleString()})\n`;
    if (budgetData.budgets.length > 0) {
      budgetData.budgets.forEach((b) => {
        text += `  * ${b.category}: Limit ₹${b.budgetAmount.toLocaleString()}, Spent ₹${b.spentAmount.toLocaleString()}, Remaining ₹${b.remainingAmount.toLocaleString()} (${b.status}, ${b.utilizationPercentage}%)\n`;
      });
    } else {
      text += `- No active category budgets configured.\n`;
    }
    text += `\n`;
  }

  if (goalData) {
    text += `Financial Goals:\n`;
    text += `- Total Goals: ${goalData.totalGoalsCount}\n`;
    if (goalData.goals.length > 0) {
      goalData.goals.forEach((g) => {
        text += `  * Goal "${g.name}": Target ₹${g.targetAmount.toLocaleString()}, Saved ₹${g.currentAmount.toLocaleString()} (${g.progressPercentage}%), Remaining ₹${g.remainingAmount.toLocaleString()}, Target Date ${g.targetDate}. Required Monthly Savings: ₹${g.requiredMonthlySavings.toLocaleString()} (Status: ${g.status})\n`;
      });
    } else {
      text += `- No financial goals configured.\n`;
    }
    text += `\n`;
  }

  if (investmentData) {
    text += `Investment Profile & Risk Analysis:\n`;
    text += `- Risk Preference: ${investmentData.riskPreference}\n`;
    text += `- Investment Horizon: ${investmentData.investmentHorizon}\n`;
    text += `- Emergency Fund Cushion: ${investmentData.emergencyFundStatus} (Target: ₹${investmentData.emergencyFundTarget.toLocaleString()} for ${investmentData.emergencyFundMonths} months)\n`;
    text += `- Suggested Monthly Investment Capacity: ₹${investmentData.suggestedInvestmentCapacity.toLocaleString()}\n`;
    text += `- Risk Capacity Rating: ${investmentData.riskCapacityRating} (Score: ${investmentData.riskCapacityScore}/100)\n`;
    text += `- Asset Allocation: Cash ${investmentData.assetAllocation.cashSavingsPct}%, Fixed Income ${investmentData.assetAllocation.fixedIncomePct}%, Equity ${investmentData.assetAllocation.equityPct}%, Hybrid ${investmentData.assetAllocation.hybridPct}%\n\n`;
  }

  text += `---------------------------------------------------\n`;
  text += `INSTRUCTION: Use ONLY the numbers provided above when answering the user's question. If requested data is missing or not configured above, explicitly state that it is unavailable in the user's recorded data instead of inventing fake figures.\n`;

  return text;
};

module.exports = {
  detectIntent,
  buildUserFinancialContext,
  formatContextPrompt
};
