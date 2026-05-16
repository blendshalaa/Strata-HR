const express = require('express');
const router = express.Router();
const { getDirectory, getAllUsers, getUserById, updateUser, deleteUser, createUser, inviteUser, uploadAvatar, deleteAvatar } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, updateUserRules } = require('../middleware/validators');
const avatarUpload = require('../middleware/avatarUpload');

router.get('/directory', authenticateToken, getDirectory);

// Avatar upload / delete (all authenticated users for their own; HR/admin can pass ?userId=)
router.post('/me/avatar', authenticateToken, avatarUpload.single('avatar'), uploadAvatar);
router.delete('/me/avatar', authenticateToken, deleteAvatar);

router.get('/', authenticateToken, authorizeRoles('admin', 'hr'), getAllUsers);
router.get('/:id', authenticateToken, getUserById);
router.post('/', authenticateToken, authorizeRoles('admin', 'hr'), createUser);
router.post('/invite', authenticateToken, authorizeRoles('admin', 'hr'), inviteUser);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'hr'), updateUserRules, validate, updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'hr'), deleteUser);

module.exports = router;