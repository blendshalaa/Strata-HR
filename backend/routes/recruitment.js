const express = require('express');
const router = express.Router();
const {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    getAllApplications,
    getApplicationsForJob,
    submitApplication,
    updateApplicationStatus,
    analyzeResume
} = require('../controllers/recruitmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validate, createJobRules, applicationStatusRules, submitApplicationRules } = require('../middleware/validators');

// All recruitment routes are HR/Admin only (internal system)

// Job Routes
router.get('/jobs', authenticateToken, authorizeRoles('admin', 'hr'), getAllJobs);
router.get('/jobs/:id', authenticateToken, authorizeRoles('admin', 'hr'), getJobById);
router.post('/jobs', authenticateToken, authorizeRoles('admin', 'hr'), createJobRules, validate, createJob);
router.put('/jobs/:id', authenticateToken, authorizeRoles('admin', 'hr'), updateJob);

// Application Routes (HR/Admin manually adds and manages applicants)
router.get('/applications', authenticateToken, authorizeRoles('admin', 'hr'), getAllApplications);
router.get('/jobs/:jobId/applications', authenticateToken, authorizeRoles('admin', 'hr'), getApplicationsForJob);
router.post('/jobs/:jobId/applications', authenticateToken, authorizeRoles('admin', 'hr'), submitApplicationRules, validate, submitApplication);
router.post('/jobs/:jobId/analyze-resume', authenticateToken, authorizeRoles('admin', 'hr'), aiLimiter, upload.single('resume'), analyzeResume);
router.put('/applications/:id/status', authenticateToken, authorizeRoles('admin', 'hr'), applicationStatusRules, validate, updateApplicationStatus);

module.exports = router;
