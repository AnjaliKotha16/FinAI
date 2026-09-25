const { AIConversation } = require('../models/AIConversation');
const aiContextService = require('../services/aiContextService');
const aiService = require('../services/aiService');
const { errorResponse } = require('../utils/apiResponse');
const { isValidObjectId } = require('../middleware/securityMiddleware');

/**
 * @route   POST /api/ai/chat
 * @desc    Send a message to personalized AI assistant and get context-grounded response
 * @access  Private (Authenticated User only)
 */
const chatWithAI = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;

    // 1. Input Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse(res, 400, 'Message is required and must be a non-empty string.');
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 1000) {
      return errorResponse(res, 400, 'Message exceeds maximum length of 1000 characters.');
    }

    // 2. Fetch or Create Conversation strictly for authenticated user
    let conversation;
    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return errorResponse(res, 404, 'Specified conversation not found or unauthorized.');
      }

      conversation = await AIConversation.findOne({
        _id: conversationId,
        user: req.user._id
      });

      if (!conversation) {
        return errorResponse(res, 404, 'Specified conversation not found or unauthorized.');
      }
    } else {
      // Auto-generate title from initial user message
      const rawTitle = trimmedMessage.length > 40 ? `${trimmedMessage.substring(0, 37)}...` : trimmedMessage;
      const cleanTitle = rawTitle.replace(/[\r\n]+/g, ' ');

      conversation = new AIConversation({
        user: req.user._id,
        title: cleanTitle || 'New Financial Conversation',
        messages: []
      });
    }

    // Add user message to conversation
    const userMsgObj = {
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date()
    };
    conversation.messages.push(userMsgObj);

    // 3. Retrieve Intent-Aware User Financial Context
    const context = await aiContextService.buildUserFinancialContext(req.user._id, trimmedMessage);

    // 4. Send request to AI Service (Provider API or Fallback Engine)
    let aiResponseText = '';
    try {
      aiResponseText = await aiService.generateAIResponse(trimmedMessage, context);
    } catch (aiErr) {
      console.error('AI Processing Error:', aiErr.message);
      aiResponseText = 'The AI assistant is temporarily unavailable. Please try again shortly.';
    }

    // Add assistant response to conversation
    const assistantMsgObj = {
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date()
    };
    conversation.messages.push(assistantMsgObj);

    // Save updated conversation
    await conversation.save();

    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      title: conversation.title,
      message: assistantMsgObj,
      intent: context.intent,
      disclaimer: 'This response is generated for educational and planning purposes based on your recorded financial data.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ai/conversations
 * @desc    Get all conversation histories for authenticated user
 * @access  Private
 */
const getUserConversations = async (req, res, next) => {
  try {
    const conversations = await AIConversation.find({ user: req.user._id })
      .select('title messages createdAt updatedAt')
      .sort({ updatedAt: -1 });

    const formattedList = conversations.map((conv) => {
      const lastMsg = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
      return {
        _id: conv._id,
        title: conv.title,
        messageCount: conv.messages.length,
        lastMessage: lastMsg ? { content: lastMsg.content, timestamp: lastMsg.timestamp, role: lastMsg.role } : null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedList.length,
      data: formattedList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ai/conversations/:id
 * @desc    Get single conversation history by ID for authenticated user
 * @access  Private
 */
const getConversationById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Conversation not found.');
    }

    const conversation = await AIConversation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!conversation) {
      return errorResponse(res, 404, 'Conversation not found.');
    }

    return res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/ai/conversations/:id
 * @desc    Delete conversation history
 * @access  Private
 */
const deleteConversation = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Conversation not found.');
    }

    const conversation = await AIConversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!conversation) {
      return errorResponse(res, 404, 'Conversation not found.');
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAI,
  getUserConversations,
  getConversationById,
  deleteConversation
};
