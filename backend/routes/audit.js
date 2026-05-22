const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditStats } = require('../controllers/auditController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All audit routes require authentication + HR/admin role
router.get('/', authenticateToken, authorizeRoles('admin', 'hr'), getAuditLogs);
router.get('/stats', authenticateToken, authorizeRoles('admin', 'hr'), getAuditStats);

module.exports = router;
