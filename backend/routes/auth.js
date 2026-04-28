const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { requestReset, resetPassword, changePassword } = require('../controllers/passwordController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, registerRules, loginRules } = require('../middleware/validators');

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', authenticateToken, getMe);
router.post('/forgot-password', authLimiter, requestReset);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;