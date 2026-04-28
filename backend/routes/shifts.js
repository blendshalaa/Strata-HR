const express = require('express');
const router = express.Router();
const { getShifts, createShift, bulkCreateShifts, updateShift, deleteShift } = require('../controllers/shiftController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, getShifts);
router.post('/', authenticateToken, authorizeRoles('hr', 'admin'), createShift);
router.post('/bulk', authenticateToken, authorizeRoles('hr', 'admin'), bulkCreateShifts);
router.put('/:id', authenticateToken, authorizeRoles('hr', 'admin'), updateShift);
router.delete('/:id', authenticateToken, authorizeRoles('hr', 'admin'), deleteShift);

module.exports = router;
