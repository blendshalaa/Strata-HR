const express = require('express');
const router = express.Router();
const { getShifts, createShift, bulkCreateShifts, updateShift, deleteShift } = require('../controllers/shiftController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');

router.get('/', authenticateToken, getShifts);
router.post('/', authenticateToken, authorizeRoles('hr', 'admin'), auditMiddleware('create', 'shift'), createShift);
router.post('/bulk', authenticateToken, authorizeRoles('hr', 'admin'), auditMiddleware('create', 'shift'), bulkCreateShifts);
router.put('/:id', authenticateToken, authorizeRoles('hr', 'admin'), auditMiddleware('update', 'shift'), updateShift);
router.delete('/:id', authenticateToken, authorizeRoles('hr', 'admin'), auditMiddleware('delete', 'shift'), deleteShift);

module.exports = router;
