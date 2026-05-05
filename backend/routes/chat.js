const express = require('express');
const router = express.Router();
const {
  sendMessage,
  confirmAction,
  getConversations,
  getConversationMessages,
  deleteConversation
} = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/message', authenticateToken, aiLimiter, sendMessage);
router.post('/confirm', authenticateToken, aiLimiter, confirmAction);
router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:id', authenticateToken, getConversationMessages);
router.delete('/conversations/:id', authenticateToken, deleteConversation);

module.exports = router;