const express = require('express');
const router = express.Router();
const { 
    getTrainings, 
    createTraining, 
    deleteTraining, 
    getMyAssignedTrainings, 
    assignTraining, 
    completeTraining 
} = require('../controllers/trainingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');

// Course library (everyone can view, only HR/admin can manage)
router.get('/', authenticateToken, getTrainings);
router.post('/', authenticateToken, authorizeRoles('admin', 'hr'), auditMiddleware('create', 'training'), createTraining);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'hr'), auditMiddleware('delete', 'training'), deleteTraining);

// Employee assignments
router.get('/my-assignments', authenticateToken, getMyAssignedTrainings);
router.post('/assign', authenticateToken, authorizeRoles('admin', 'hr'), auditMiddleware('create', 'user_training'), assignTraining);
router.post('/assignments/:assignment_id/complete', authenticateToken, auditMiddleware('update', 'user_training'), completeTraining);

module.exports = router;
