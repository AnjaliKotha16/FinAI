const { errorResponse } = require('../utils/apiResponse');

const validateUpdateProfile = (req, res, next) => {
  const { riskPreference, investmentHorizon, emergencyFundMonths, monthlyInvestmentAmount } = req.body;

  if (riskPreference && !['Conservative', 'Moderate', 'Aggressive'].includes(riskPreference)) {
    return errorResponse(res, 400, 'Invalid riskPreference. Allowed: Conservative, Moderate, Aggressive');
  }

  if (investmentHorizon && !['Short Term', 'Medium Term', 'Long Term'].includes(investmentHorizon)) {
    return errorResponse(res, 400, 'Invalid investmentHorizon. Allowed: Short Term, Medium Term, Long Term');
  }

  if (emergencyFundMonths !== undefined && ![3, 6, 9, 12].includes(Number(emergencyFundMonths))) {
    return errorResponse(res, 400, 'Invalid emergencyFundMonths. Allowed: 3, 6, 9, 12');
  }

  if (monthlyInvestmentAmount !== undefined && (typeof monthlyInvestmentAmount !== 'number' || monthlyInvestmentAmount < 0 || isNaN(monthlyInvestmentAmount))) {
    return errorResponse(res, 400, 'monthlyInvestmentAmount must be a non-negative number');
  }

  next();
};

const validateSimulate = (req, res, next) => {
  const { initialAmount, monthlyContribution, years, annualReturnAssumption } = req.body;

  if (initialAmount !== undefined && (typeof initialAmount !== 'number' || initialAmount < 0 || isNaN(initialAmount) || !isFinite(initialAmount))) {
    return errorResponse(res, 400, 'initialAmount must be a valid non-negative number');
  }

  if (monthlyContribution !== undefined && (typeof monthlyContribution !== 'number' || monthlyContribution < 0 || isNaN(monthlyContribution) || !isFinite(monthlyContribution))) {
    return errorResponse(res, 400, 'monthlyContribution must be a valid non-negative number');
  }

  if (years !== undefined && (typeof years !== 'number' || years <= 0 || years > 50 || isNaN(years) || !isFinite(years))) {
    return errorResponse(res, 400, 'years must be a number between 0.5 and 50');
  }

  if (annualReturnAssumption !== undefined && (typeof annualReturnAssumption !== 'number' || annualReturnAssumption < -20 || annualReturnAssumption > 50 || isNaN(annualReturnAssumption) || !isFinite(annualReturnAssumption))) {
    return errorResponse(res, 400, 'annualReturnAssumption must be a number between -20% and 50%');
  }

  next();
};

module.exports = {
  validateUpdateProfile,
  validateSimulate
};
