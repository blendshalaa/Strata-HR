const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getConversationMessages,
  deleteConversation
} = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/message', authenticateToken, aiLimiter, sendMessage);
router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:id', authenticateToken, getConversationMessages);
router.delete('/conversations/:id', authenticateToken, deleteConversation);

module.exports = router;