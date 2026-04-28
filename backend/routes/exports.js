const express = require('express');
const router = express.Router();
const { exportPayroll, exportTimesheets, exportLeave } = require('../controllers/exportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/payroll', authenticateToken, authorizeRoles('admin', 'hr'), exportPayroll);
router.get('/timesheets', authenticateToken, authorizeRoles('admin', 'hr'), exportTimesheets);
router.get('/leave', authenticateToken, authorizeRoles('admin', 'hr'), exportLeave);

module.exports = router;
