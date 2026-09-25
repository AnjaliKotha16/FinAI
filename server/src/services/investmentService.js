const { InvestmentProfile } = require('../models/InvestmentProfile');
const { Goal } = require('../models/Goal');
const { Transaction } = require('../models/Transaction');
const { Budget } = require('../models/Budget');
const goalPlanningService = require('./goalPlanningService');

/**
 * Get or create default investment profile for a user
 */
const getOrCreateProfile = async (userId) => {
  let profile = await InvestmentProfile.findOne({ user: userId });
  if (!profile) {
    profile = await InvestmentProfile.create({
      user: userId,
      riskPreference: 'Moderate',
      investmentHorizon: 'Medium Term',
      emergencyFundMonths: 6,
      monthlyInvestmentAmount: 0,
      preferredGoalId: null
    });
  }
  return profile;
};

/**
 * Update investment profile for a user
 */
const updateProfile = async (userId, data) => {
  const profile = await getOrCreateProfile(userId);

  if (data.riskPreference && ['Conservative', 'Moderate', 'Aggressive'].includes(data.riskPreference)) {
    profile.riskPreference = data.riskPreference;
  }
  if (data.investmentHorizon && ['Short Term', 'Medium Term', 'Long Term'].includes(data.investmentHorizon)) {
    profile.investmentHorizon = data.investmentHorizon;
  }
  if (typeof data.emergencyFundMonths === 'number' && [3, 6, 9, 12].includes(data.emergencyFundMonths)) {
    profile.emergencyFundMonths = data.emergencyFundMonths;
  }
  if (typeof data.monthlyInvestmentAmount === 'number' && data.monthlyInvestmentAmount >= 0) {
    profile.monthlyInvestmentAmount = data.monthlyInvestmentAmount;
  }
  if (data.preferredGoalId !== undefined) {
    if (data.preferredGoalId === null || data.preferredGoalId === '') {
      profile.preferredGoalId = null;
    } else {
      // Ensure goal belongs to user
      const goalExists = await Goal.findOne({ _id: data.preferredGoalId, user: userId });
      if (goalExists) {
        profile.preferredGoalId = data.preferredGoalId;
      }
    }
  }

  await profile.save();
  return profile;
};

/**
 * Educational asset allocation mappings based on risk preference
 */
const getAssetAllocation = (riskPreference) => {
  switch (riskPreference) {
    case 'Conservative':
      return {
        cashSavingsPct: 50,
        fixedIncomePct: 35,
        equityPct: 15,
        hybridPct: 0,
        description: 'Emphasizes capital preservation and lower market volatility.'
      };
    case 'Aggressive':
      return {
        cashSavingsPct: 10,
        fixedIncomePct: 15,
        equityPct: 65,
        hybridPct: 10,
        description: 'Focuses on long-term capital growth, accepting higher market fluctuation.'
      };
    case 'Moderate':
    default:
      return {
        cashSavingsPct: 20,
        fixedIncomePct: 30,
        equityPct: 40,
        hybridPct: 10,
        description: 'Balances growth potential with moderate downside protection.'
      };
  }
};

/**
 * Category descriptions for educational display
 */
const ASSET_CATEGORY_INFO = {
  cashSavings: {
    title: 'Cash / Savings',
    characteristics: 'High liquidity, low risk of capital loss, lower long-term growth potential.'
  },
  fixedIncome: {
    title: 'Fixed Income',
    characteristics: 'Generally lower volatility than equity instruments, providing predictable yield.'
  },
  equity: {
    title: 'Equity',
    characteristics: 'Higher long-term growth potential accompanied by higher market volatility.'
  },
  hybrid: {
    title: 'Hybrid',
    characteristics: 'Combines debt and equity elements to balance risk and return.'
  }
};

/**
 * Generate full investment plan for user
 */
const getInvestmentPlan = async (userId, targetGoalId) => {
  const profile = await getOrCreateProfile(userId);

  // 1. Fetch user's financial transactions over last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: ninetyDaysAgo }
  });

  const allTimeTransactions = await Transaction.find({ user: userId });

  let total90DayIncome = 0;
  let total90DayExpenses = 0;
  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') total90DayIncome += amt;
    if (tx.type === 'expense') total90DayExpenses += amt;
  });

  let totalAllTimeIncome = 0;
  let totalAllTimeExpenses = 0;
  allTimeTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') totalAllTimeIncome += amt;
    if (tx.type === 'expense') totalAllTimeExpenses += amt;
  });

  const monthlyIncome = Number((total90DayIncome / 3).toFixed(2));
  const monthlyExpenses = Number((total90DayExpenses / 3).toFixed(2));
  const monthlySavings = Number((monthlyIncome - monthlyExpenses).toFixed(2));
  const savingsRate = monthlyIncome > 0 ? Number(((monthlySavings / monthlyIncome) * 100).toFixed(1)) : 0;
  const currentBalance = Number((totalAllTimeIncome - totalAllTimeExpenses).toFixed(2));

  // 2. Emergency Fund Consideration
  const estimatedEssentialExpenses = Number((monthlyExpenses * 0.75).toFixed(2));
  const emergencyFundMonths = profile.emergencyFundMonths || 6;
  const estimatedEmergencyFundTarget = Number((estimatedEssentialExpenses * emergencyFundMonths).toFixed(2));
  const emergencyFundStatus = currentBalance >= estimatedEmergencyFundTarget ? 'Sufficient Liquid Cushion' : 'Needs Review';

  // 3. Investment Capacity Calculation
  // Distinguish Monthly Savings from Suggested Investment Amount
  let suggestedInvestmentAmount = 0;
  if (profile.monthlyInvestmentAmount > 0) {
    suggestedInvestmentAmount = profile.monthlyInvestmentAmount;
  } else if (monthlySavings > 0) {
    // Default suggested allocation: 60% of net monthly savings to retain 40% liquidity
    suggestedInvestmentAmount = Number((monthlySavings * 0.60).toFixed(2));
  }

  // 4. Fetch Active Goals
  const userGoals = await Goal.find({ user: userId }).sort({ targetDate: 1 });
  const activeGoals = userGoals.map((g) => ({
    _id: g._id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    targetDate: g.targetDate,
    priority: g.priority,
    status: g.status
  }));

  // 5. Goal Funding Gap Calculation (if goalId selected or profile preferred goal)
  let goalPlan = null;
  const goalToCalculate = targetGoalId || profile.preferredGoalId || (userGoals.length > 0 ? userGoals[0]._id : null);

  if (goalToCalculate) {
    try {
      const detailedPlan = await goalPlanningService.calculateGoalPlan(userId, goalToCalculate);
      const requiredMonthly = detailedPlan.planSummary.requiredSavings.monthly;
      const capacityDiff = Number((suggestedInvestmentAmount - requiredMonthly).toFixed(2));

      let fundingStatusText = 'Approximately aligned with required contribution';
      if (capacityDiff < -100) {
        fundingStatusText = 'Below required monthly contribution';
      } else if (capacityDiff > 100) {
        fundingStatusText = 'Above required monthly contribution';
      }

      goalPlan = {
        goal: detailedPlan.goal,
        planSummary: detailedPlan.planSummary,
        fundingGap: {
          requiredMonthlySavings: requiredMonthly,
          suggestedInvestmentCapacity: suggestedInvestmentAmount,
          capacityDifference: capacityDiff,
          fundingStatusText
        }
      };
    } catch (err) {
      // Handle missing/invalid goal gracefully
      goalPlan = null;
    }
  }

  // 6. Risk-Based Asset Allocation & Info
  const assetAllocation = getAssetAllocation(profile.riskPreference);

  // 7. Deterministic Risk Analysis Indicators
  const userBudgets = await Budget.find({ user: userId });
  let totalBudgeted = 0;
  let totalSpent = 0;
  userBudgets.forEach((b) => {
    totalBudgeted += b.amount;
  });
  const budgetUtilization = totalBudgeted > 0 ? Number(((monthlyExpenses / totalBudgeted) * 100).toFixed(1)) : 0;

  // Deterministic risk capacity score (0-100)
  let horizonPts = profile.investmentHorizon === 'Long Term' ? 30 : (profile.investmentHorizon === 'Medium Term' ? 20 : 10);
  let savingsPts = savingsRate >= 20 ? 30 : (savingsRate > 0 ? (savingsRate / 20) * 30 : 0);
  let emergencyPts = currentBalance >= estimatedEmergencyFundTarget ? 20 : (currentBalance > 0 ? 10 : 0);
  let budgetPts = userBudgets.length > 0 ? (budgetUtilization <= 90 ? 20 : 10) : 15;

  const riskCapacityScore = Math.min(100, Math.max(0, Math.round(horizonPts + savingsPts + emergencyPts + budgetPts)));

  let riskCapacityRating = 'Moderate Risk Tolerance';
  if (riskCapacityScore >= 75) riskCapacityRating = 'High Risk Capacity';
  else if (riskCapacityScore < 50) riskCapacityRating = 'Conservative Risk Capacity';

  const riskAnalysis = {
    riskCapacityScore,
    riskCapacityRating,
    indicators: [
      {
        label: 'Investment Horizon',
        value: profile.investmentHorizon,
        detail: `Selected ${profile.investmentHorizon} timeline affects short-term market volatility tolerance.`
      },
      {
        label: 'Savings Rate & Consistency',
        value: `${savingsRate}% (${monthlySavings >= 0 ? 'Positive Savings' : 'Net Deficit'})`,
        detail: 'Based on 90-day income and expense records.'
      },
      {
        label: 'Emergency Fund Cushion',
        value: emergencyFundStatus,
        detail: `Estimated target is ₹${estimatedEmergencyFundTarget.toLocaleString()} (${emergencyFundMonths} months essential expenses).`
      },
      {
        label: 'Risk Preference',
        value: profile.riskPreference,
        detail: assetAllocation.description
      }
    ],
    scoreDisclaimer: 'This application-generated indicator evaluates financial stability and timeline factors for educational planning only. It is not a professional risk assessment.'
  };

  return {
    profile: {
      riskPreference: profile.riskPreference,
      investmentHorizon: profile.investmentHorizon,
      emergencyFundMonths: profile.emergencyFundMonths,
      monthlyInvestmentAmount: profile.monthlyInvestmentAmount,
      preferredGoalId: profile.preferredGoalId
    },
    financialSnapshot: {
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate,
      currentBalance
    },
    emergencyFundEstimate: {
      estimatedEssentialExpenses,
      emergencyFundMonths,
      estimatedEmergencyFundTarget,
      emergencyFundStatus,
      disclaimer: 'Based on current expense patterns. Clearly an informational application planning assumption to consider liquidity before investing.'
    },
    investmentCapacity: {
      monthlySavings,
      suggestedInvestmentAmount,
      distinctionNotice: 'Monthly Savings is total unspent cash flow, whereas Suggested Investment Amount reserves liquidity for short-term needs and emergencies.'
    },
    activeGoals,
    goalPlan,
    assetAllocation,
    assetCategoryInfo: ASSET_CATEGORY_INFO,
    riskAnalysis,
    disclaimer: 'Important: This tool provides educational and planning information based on the data you enter. It does not provide personalized financial advice, guarantee investment returns, or execute investments. Investment values shown in simulations are hypothetical and actual results may differ.'
  };
};

/**
 * Deterministic Investment Scenario Simulation
 */
const simulateInvestment = ({ initialAmount = 0, monthlyContribution = 0, years = 1, annualReturnAssumption = 0 }) => {
  // Validate non-negative & finite numbers
  const initAmt = Math.max(0, Number(initialAmount) || 0);
  const monthlyContrib = Math.max(0, Number(monthlyContribution) || 0);
  const numYears = Math.max(0.5, Math.min(50, Number(years) || 1));
  const returnRatePct = Math.max(-20, Math.min(50, Number(annualReturnAssumption) || 0));

  const totalMonths = Math.round(numYears * 12);
  const r = returnRatePct / 100;
  const i = r / 12;

  let yearByYearBreakdown = [];
  let accumulatedValue = initAmt;
  let totalPrincipalInvested = initAmt;

  for (let m = 1; m <= totalMonths; m++) {
    totalPrincipalInvested += monthlyContrib;

    if (i === 0) {
      accumulatedValue += monthlyContrib;
    } else {
      accumulatedValue = (accumulatedValue + monthlyContrib) * (1 + i);
    }

    if (m % 12 === 0 || m === totalMonths) {
      const yearNum = Number((m / 12).toFixed(1));
      const principal = Math.round(totalPrincipalInvested);
      const hypotheticalVal = Math.max(0, Math.round(accumulatedValue));
      const hypotheticalGrowth = hypotheticalVal - principal;

      yearByYearBreakdown.push({
        year: yearNum,
        principalInvested: principal,
        hypotheticalValue: hypotheticalVal,
        hypotheticalGrowth
      });
    }
  }

  const finalPrincipal = Math.round(totalPrincipalInvested);
  const finalFutureValue = Math.max(0, Math.round(accumulatedValue));
  const finalGrowth = finalFutureValue - finalPrincipal;

  return {
    inputs: {
      initialAmount: initAmt,
      monthlyContribution: monthlyContrib,
      years: numYears,
      annualReturnAssumption: returnRatePct
    },
    results: {
      totalPrincipalInvested: finalPrincipal,
      hypotheticalFutureValue: finalFutureValue,
      hypotheticalGrowth: finalGrowth,
      yearByYearBreakdown
    },
    disclaimer: 'This is a mathematical illustration, not a prediction or guarantee of investment performance. Actual returns will vary depending on market conditions.'
  };
};

module.exports = {
  getOrCreateProfile,
  updateProfile,
  getInvestmentPlan,
  simulateInvestment
};
