const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, getMyDocuments, getAllDocuments, deleteDocument, signDocument } = require('../controllers/documentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const documentUpload = require('../middleware/documentUpload');
const { auditMiddleware } = require('../middleware/auditLogger');

// Employee: get own documents
router.get('/me', authenticateToken, getMyDocuments);

// Admin/HR: get all org documents
router.get('/all', authenticateToken, authorizeRoles('admin', 'hr'), getAllDocuments);

// Get documents for a specific user (employee can only see own)
router.get('/user/:userId', authenticateToken, getDocuments);

// Upload a document (employees: own only, HR/admin: any user)
router.post('/', authenticateToken, documentUpload.single('file'), auditMiddleware('create', 'document'), uploadDocument);

// Delete a document
router.delete('/:id', authenticateToken, auditMiddleware('delete', 'document'), deleteDocument);

// Sign a document
router.post('/:id/sign', authenticateToken, auditMiddleware('update', 'document'), signDocument);

module.exports = router;
