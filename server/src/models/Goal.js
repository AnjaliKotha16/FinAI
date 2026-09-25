const mongoose = require('mongoose');

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];
const ALLOWED_STATUSES = ['Active', 'Completed', 'Paused'];

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0.01, 'Target amount must be greater than 0']
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative']
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required']
    },
    priority: {
      type: String,
      enum: {
        values: ALLOWED_PRIORITIES,
        message: 'Priority must be Low, Medium, or High'
      },
      default: 'Medium'
    },
    status: {
      type: String,
      enum: {
        values: ALLOWED_STATUSES,
        message: 'Status must be Active, Completed, or Paused'
      },
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying user goals by status, priority, targetDate
goalSchema.index({ user: 1, status: 1, priority: 1, targetDate: 1 });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = {
  Goal,
  ALLOWED_PRIORITIES,
  ALLOWED_STATUSES
};
