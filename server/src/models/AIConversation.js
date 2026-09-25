const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'New Financial Conversation'
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

// Compound index for querying user's conversations ordered by update time
aiConversationSchema.index({ user: 1, updatedAt: -1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

module.exports = {
  AIConversation
};
