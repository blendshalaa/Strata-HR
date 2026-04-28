const express = require('express');
const router = express.Router();
const { getDashboardStats, getUserActivity, predictFlightRisk, getReports } = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, getDashboardStats);
router.get('/activity', authenticateToken, getUserActivity);
router.get('/flight-risk', authenticateToken, authorizeRoles('admin', 'hr'), predictFlightRisk);
router.get('/reports', authenticateToken, authorizeRoles('admin', 'hr'), getReports);

module.exports = router;