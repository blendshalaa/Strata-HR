const express = require('express');
const router = express.Router();
const { clockIn, clockOut, manualEntry, editTimesheet, getMyTimesheets, getApprovals, updateStatus } = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, timesheetStatusRules } = require('../middleware/validators');

router.post('/clock-in', authenticateToken, clockIn);
router.post('/clock-out', authenticateToken, clockOut);
router.post('/manual', authenticateToken, manualEntry);
router.get('/me', authenticateToken, getMyTimesheets);
router.get('/approvals', authenticateToken, authorizeRoles('hr', 'admin'), getApprovals);
router.put('/:id/status', authenticateToken, authorizeRoles('hr', 'admin'), timesheetStatusRules, validate, updateStatus);
router.put('/:id/edit', authenticateToken, authorizeRoles('hr', 'admin'), editTimesheet);

module.exports = router;
