const mongoose = require('mongoose');

const ALLOWED_CATEGORIES = [
  'Food',
  'Shopping',
  'Travel',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Investments',
  'Rent',
  'Others'
];

const ALLOWED_PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other'
];

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense'
      }
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ALLOWED_CATEGORIES,
        message: 'Invalid transaction category'
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: ''
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ALLOWED_PAYMENT_METHODS,
        message: 'Invalid payment method'
      },
      default: 'Other'
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

// Compound index for querying user transactions by date
transactionSchema.index({ user: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
  Transaction,
  ALLOWED_CATEGORIES,
  ALLOWED_PAYMENT_METHODS
};
