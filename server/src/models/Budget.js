const mongoose = require('mongoose');
const { ALLOWED_CATEGORIES } = require('./Transaction');

const ALLOWED_PERIODS = ['Monthly', 'Weekly', 'Custom'];

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ALLOWED_CATEGORIES,
        message: 'Invalid budget category'
      }
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0.01, 'Budget amount must be greater than 0']
    },
    period: {
      type: String,
      required: [true, 'Period is required'],
      enum: {
        values: ALLOWED_PERIODS,
        message: 'Period must be Monthly, Weekly, or Custom'
      },
      default: 'Monthly'
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast lookup of a user's budgets by category and dates
budgetSchema.index({ user: 1, category: 1, startDate: 1, endDate: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = {
  Budget,
  ALLOWED_PERIODS
};
