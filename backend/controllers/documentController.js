const pool = require('../config/database');
const cloudinary = require('cloudinary').v2;

const CATEGORIES = ['contract', 'id_document', 'tax_form', 'certificate', 'policy', 'other'];

/**
 * Upload a document for an employee.
 * HR/admin can upload for any employee; employees can upload for themselves.
 */
const uploadDocument = async (req, res, next) => {
    try {
        const { user_id, name, category } = req.body;
        const targetUserId = user_id || req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!name) {
            return res.status(400).json({ error: 'Document name is required' });
        }

        // Employees can only upload to themselves
        if (req.user.role === 'employee' && parseInt(targetUserId) !== req.user.id) {
            return res.status(403).json({ error: 'You can only upload documents to your own profile' });
        }

        // Verify target user belongs to same org
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND org_id = $2', [targetUserId, req.user.org_id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Target user not found in your organization' });
        }

        const fileUrl = req.file.path; // Cloudinary URL
        const docCategory = CATEGORIES.includes(category) ? category : 'other';

        const result = await pool.query(
            `INSERT INTO employee_documents (user_id, org_id, name, category, file_url, file_size, mime_type, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, user_id, org_id, name, category, file_url, file_size, mime_type, uploaded_by, created_at`,
            [targetUserId, req.user.org_id, name, docCategory, fileUrl, req.file.size, req.file.mimetype, req.user.id]
        );

        res.status(201).json({ message: 'Document uploaded successfully', document: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * Get documents for a specific user.
 * Employees see their own; HR/admin see any user in the org.
 */
const getDocuments = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const targetUserId = userId || req.user.id;

        if (req.user.role === 'employee' && parseInt(targetUserId) !== req.user.id) {
            return res.status(403).json({ error: 'You can only view your own documents' });
        }

        const result = await pool.query(
            `SELECT d.*, u.name as uploader_name
             FROM employee_documents d
             LEFT JOIN users u ON d.uploaded_by = u.id
             WHERE d.user_id = $1 AND d.org_id = $2
             ORDER BY d.created_at DESC`,
            [targetUserId, req.user.org_id]
        );

        res.json({ documents: result.rows });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my own documents.
 */
const getMyDocuments = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT d.*, u.name as uploader_name
             FROM employee_documents d
             LEFT JOIN users u ON d.uploaded_by = u.id
             WHERE d.user_id = $1 AND d.org_id = $2
             ORDER BY d.created_at DESC`,
            [req.user.id, req.user.org_id]
        );
        res.json({ documents: result.rows });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all documents in the org (admin/HR only).
 */
const getAllDocuments = async (req, res, next) => {
    try {
        const { category, user_id } = req.query;
        let query = `
            SELECT d.*, u.name as employee_name, u.department, uploader.name as uploader_name
            FROM employee_documents d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN users uploader ON d.uploaded_by = uploader.id
            WHERE d.org_id = $1
        `;
        const params = [req.user.org_id];
        let i = 2;

        if (category) { query += ` AND d.category = $${i}`; params.push(category); i++; }
        if (user_id) { query += ` AND d.user_id = $${i}`; params.push(user_id); i++; }

        query += ' ORDER BY d.created_at DESC';
        const result = await pool.query(query, params);
        res.json({ documents: result.rows });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a document.
 */
const deleteDocument = async (req, res, next) => {
    try {
        const { id } = req.params;

        const doc = await pool.query(
            'SELECT * FROM employee_documents WHERE id = $1 AND org_id = $2',
            [id, req.user.org_id]
        );

        if (doc.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Employees can only delete their own documents
        if (req.user.role === 'employee' && doc.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own documents' });
        }

        // Delete file from Cloudinary (fire and forget)
        const fileUrl = doc.rows[0].file_url;
        const publicId = doc.rows[0].cloudinary_public_id;
        if (publicId) {
            // Use stored public_id if available (most reliable)
            cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
            cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => {});
        } else if (fileUrl && fileUrl.includes('res.cloudinary.com')) {
            try {
                // Fallback: extract public_id from URL
                // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123456/<folder>/<name>.<ext>
                const uploadIndex = fileUrl.indexOf('/upload/');
                if (uploadIndex !== -1) {
                    const afterUpload = fileUrl.substring(uploadIndex + 8); // skip '/upload/'
                    // Strip version segment if present (v1234567890/...)
                    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
                    // Strip extension
                    const publicIdFull = withoutVersion.replace(/\.[^/.]+$/, '');
                    cloudinary.uploader.destroy(publicIdFull, { resource_type: 'image' }).catch(() => {});
                    cloudinary.uploader.destroy(publicIdFull, { resource_type: 'raw' }).catch(() => {});
                }
            } catch (e) {
                console.error('Failed to delete from Cloudinary:', e);
            }
        }

        await pool.query('DELETE FROM employee_documents WHERE id = $1', [id]);
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadDocument, getDocuments, getMyDocuments, getAllDocuments, deleteDocument };
