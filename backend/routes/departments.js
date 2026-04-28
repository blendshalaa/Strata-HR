const express = require('express');
const router = express.Router();
const {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
} = require('../controllers/departmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, createDepartmentRules } = require('../middleware/validators');

router.get('/', authenticateToken, getAllDepartments);
router.get('/:id', authenticateToken, getDepartmentById);
router.post('/', authenticateToken, authorizeRoles('admin', 'hr'), createDepartmentRules, validate, createDepartment);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'hr'), updateDepartment);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'hr'), deleteDepartment);

module.exports = router;
