const express = require('express');
const router = express.Router();
const { getTasks, toggleTask } = require('../controllers/onboardingController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getTasks);
router.put('/:id', authenticateToken, toggleTask);

module.exports = router;
