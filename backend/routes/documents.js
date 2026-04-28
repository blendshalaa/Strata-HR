const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, getMyDocuments, getAllDocuments, deleteDocument } = require('../controllers/documentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const documentUpload = require('../middleware/documentUpload');

// Employee: get own documents
router.get('/me', authenticateToken, getMyDocuments);

// Admin/HR: get all org documents
router.get('/all', authenticateToken, authorizeRoles('admin', 'hr'), getAllDocuments);

// Get documents for a specific user (employee can only see own)
router.get('/user/:userId', authenticateToken, getDocuments);

// Upload a document (employees: own only, HR/admin: any user)
router.post('/', authenticateToken, documentUpload.single('file'), uploadDocument);

// Delete a document
router.delete('/:id', authenticateToken, deleteDocument);

module.exports = router;
