const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { aiRateLimiter } = require('../middleware/rateLimiterMiddleware');
const {
  chatWithAI,
  getUserConversations,
  getConversationById,
  deleteConversation
} = require('../controllers/aiController');

// All AI assistant routes require authentication
router.use(protect);

// Rate-limited chat completion endpoint
router.post('/chat', aiRateLimiter(15 * 60 * 1000, 30), chatWithAI);

// Conversation management endpoints
router.get('/conversations', getUserConversations);
router.get('/conversations/:id', getConversationById);
router.delete('/conversations/:id', deleteConversation);

module.exports = router;
