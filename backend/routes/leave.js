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
const { auditMiddleware } = require('../middleware/auditLogger');

router.get('/my-requests', authenticateToken, getMyLeaveRequests);
router.get('/all-requests', authenticateToken, authorizeRoles('hr', 'admin'), getAllLeaveRequests);
router.post('/request', authenticateToken, leaveRequestRules, validate, auditMiddleware('create', 'leave_request'), createLeaveRequest);
router.patch('/:id/status', authenticateToken, authorizeRoles('hr', 'admin'), leaveStatusRules, validate, auditMiddleware('update', 'leave_request'), updateLeaveRequestStatus);
router.get('/balance', authenticateToken, getLeaveBalance);

module.exports = router;