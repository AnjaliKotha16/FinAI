const mongoose = require('mongoose');

const investmentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    riskPreference: {
      type: String,
      enum: ['Conservative', 'Moderate', 'Aggressive'],
      default: 'Moderate'
    },
    investmentHorizon: {
      type: String,
      enum: ['Short Term', 'Medium Term', 'Long Term'],
      default: 'Medium Term'
    },
    monthlyInvestmentAmount: {
      type: Number,
      min: [0, 'Monthly investment amount cannot be negative'],
      default: 0
    },
    emergencyFundMonths: {
      type: Number,
      enum: [3, 6, 9, 12],
      default: 6
    },
    preferredGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null
    }
  },
  {
    timestamps: true
  }
);

const InvestmentProfile = mongoose.model('InvestmentProfile', investmentProfileSchema);

module.exports = { InvestmentProfile };
