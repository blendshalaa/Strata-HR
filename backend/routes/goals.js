const express = require('express');
const router = express.Router();
const { getGoals, getGoalById, createGoal, updateGoal, deleteGoal, updateKeyResult, addKeyResult, deleteKeyResult } = require('../controllers/goalController');
const { authenticateToken } = require('../middleware/auth');

// Goals
router.get('/', authenticateToken, getGoals);
router.get('/:id', authenticateToken, getGoalById);
router.post('/', authenticateToken, createGoal);
router.put('/:id', authenticateToken, updateGoal);
router.delete('/:id', authenticateToken, deleteGoal);

// Key Results
router.post('/:goalId/key-results', authenticateToken, addKeyResult);
router.put('/key-results/:id', authenticateToken, updateKeyResult);
router.delete('/key-results/:id', authenticateToken, deleteKeyResult);

module.exports = router;
