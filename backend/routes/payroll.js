const express = require('express');
const router = express.Router();
const {
    getAllPayrolls,
    getPayrollById,
    getPayrollByUser,
    createPayroll,
    updatePayrollStatus,
    generateFromTimesheets
} = require('../controllers/payrollController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, createPayrollRules } = require('../middleware/validators');
const { auditMiddleware } = require('../middleware/auditLogger');

router.get('/', authenticateToken, authorizeRoles('admin', 'hr'), getAllPayrolls);
router.post('/generate', authenticateToken, authorizeRoles('admin', 'hr'), auditMiddleware('create', 'payroll'), generateFromTimesheets);
router.get('/user/:userId', authenticateToken, getPayrollByUser);
router.get('/:id', authenticateToken, getPayrollById);
router.post('/calculate', authenticateToken, authorizeRoles('admin', 'hr'), createPayrollRules, validate, auditMiddleware('create', 'payroll'), createPayroll);
router.put('/:id/pay', authenticateToken, authorizeRoles('admin', 'hr'), auditMiddleware('update', 'payroll'), updatePayrollStatus);

module.exports = router;
