const express = require('express');
const router = express.Router();
const {
  getMyLeaveRequests,
  getAllLeaveRequests,
  createLeaveRequest,
  updateLeaveRequestStatus,
  getLeaveBalance
} = require('../controllers/leaveController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, leaveRequestRules, leaveStatusRules } = require('../middleware/validators');

router.get('/my-requests', authenticateToken, getMyLeaveRequests);
router.get('/all-requests', authenticateToken, authorizeRoles('hr', 'admin'), getAllLeaveRequests);
router.post('/request', authenticateToken, leaveRequestRules, validate, createLeaveRequest);
router.patch('/:id/status', authenticateToken, authorizeRoles('hr', 'admin'), leaveStatusRules, validate, updateLeaveRequestStatus);
router.get('/balance', authenticateToken, getLeaveBalance);

module.exports = router;