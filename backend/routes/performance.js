const express = require('express');
const router = express.Router();
const {
    getReviewsForUser,
    getReviewById,
    createReview,
    updateReview,
    generateDraft
} = require('../controllers/performanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, createEvaluationRules } = require('../middleware/validators');
const { aiLimiter } = require('../middleware/rateLimiter');

router.get('/user/:userId', authenticateToken, getReviewsForUser);
router.get('/:id', authenticateToken, getReviewById);
router.post('/', authenticateToken, authorizeRoles('admin', 'hr', 'manager'), createEvaluationRules, validate, createReview);
router.post('/generate-draft', authenticateToken, authorizeRoles('admin', 'hr', 'manager'), aiLimiter, generateDraft);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'hr', 'manager'), updateReview);

module.exports = router;
