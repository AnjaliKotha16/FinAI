const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['Budget', 'Goal', 'Savings', 'Monthly Review', 'Financial Insight', 'System'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['info', 'success', 'warning'],
      default: 'info'
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: Object,
      default: {}
    },
    dedupKey: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient user notifications query sorted by creation time
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, dedupKey: 1 }, { unique: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  Notification
};
