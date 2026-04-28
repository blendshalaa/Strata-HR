const express = require('express');
const router = express.Router();
const { getDirectory, getAllUsers, getUserById, updateUser, deleteUser, createUser, inviteUser } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, updateUserRules } = require('../middleware/validators');

router.get('/directory', authenticateToken, getDirectory);

router.get('/', authenticateToken, authorizeRoles('admin', 'hr'), getAllUsers);
router.get('/:id', authenticateToken, getUserById);
router.post('/', authenticateToken, authorizeRoles('admin', 'hr'), createUser);
router.post('/invite', authenticateToken, authorizeRoles('admin', 'hr'), inviteUser);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'hr'), updateUserRules, validate, updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'hr'), deleteUser);

module.exports = router;