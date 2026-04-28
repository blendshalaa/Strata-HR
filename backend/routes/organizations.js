const express = require('express');
const router = express.Router();
const { getOrg, updateOrg, regenerateInviteCode, getOrgMembers } = require('../controllers/orgController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, getOrg);
router.put('/', authenticateToken, authorizeRoles('admin'), updateOrg);
router.post('/invite-code', authenticateToken, authorizeRoles('admin'), regenerateInviteCode);
router.get('/members', authenticateToken, getOrgMembers);

module.exports = router;
