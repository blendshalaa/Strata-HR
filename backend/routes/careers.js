const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const upload = require('../middleware/upload');
const { sendEmail } = require('../utils/mailer');

// PUBLIC: Get all open job postings for an org (no auth required)
router.get('/jobs', async (req, res, next) => {
    try {
        const { org } = req.query; // org slug
        let query = `SELECT j.id, j.title, j.description, j.requirements, j.created_at,
                    d.name as department_name
             FROM job_postings j
             LEFT JOIN departments d ON j.department_id = d.id
             WHERE j.status = 'open'`;
        const params = [];

        if (org) {
            query += ` AND j.org_id = (SELECT id FROM organizations WHERE slug = $1)`;
            params.push(org);
        }

        query += ` ORDER BY j.created_at DESC`;
        const result = await pool.query(query, params);
        res.json({ jobs: result.rows });
    } catch (error) {
        next(error);
    }
});

// PUBLIC: Submit an application (no auth required)
router.post('/jobs/:jobId/apply', upload.single('resume'), async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { applicant_name, email } = req.body;
        let resume_url = req.body.resume_url; // Fallback for manual link

        // If a file was uploaded, use the Cloudinary secure URL
        if (req.file) {
            resume_url = req.file.path;
        }

        if (!applicant_name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check job exists and is open
        const jobCheck = await pool.query(
            'SELECT id, title, org_id FROM job_postings WHERE id = $1 AND status = $2',
            [jobId, 'open']
        );
        if (jobCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Job posting not found or is no longer accepting applications' });
        }

        const jobOrgId = jobCheck.rows[0].org_id;

        // Check if already applied with same email
        const existingApp = await pool.query(
            'SELECT id FROM applications WHERE job_id = $1 AND email = $2',
            [jobId, email]
        );
        if (existingApp.rows.length > 0) {
            return res.status(409).json({ error: 'You have already applied for this position' });
        }

        const result = await pool.query(
            `INSERT INTO applications (job_id, applicant_name, email, resume_url, status, org_id)
             VALUES ($1, $2, $3, $4, 'applied', $5) RETURNING *`,
            [jobId, applicant_name, email, resume_url || null, jobOrgId]
        );

        // Send Email Alert to HR
        const hrEmail = process.env.HR_EMAIL_ADDRESS || 'hr@hrgenie.example.com';
        const jobTitle = jobCheck.rows[0].title;
        const emailHtml = `
            <h2>New Job Application Received</h2>
            <p><strong>Applicant:</strong> ${applicant_name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Position:</strong> ${jobTitle} (Job ID: ${jobId})</p>
            <hr>
            <p>Log in to the HR Genie dashboard to review their CV and manage their pipeline status.</p>
        `;

        // Fire and forget (don't await so we don't block the API response if SMTP is slow)
        sendEmail(hrEmail, `New Application: ${applicant_name} for ${jobTitle}`, emailHtml).catch(console.error);

        res.status(201).json({
            message: 'Application submitted successfully! We will review your application and get back to you.',
            application: result.rows[0]
        });
    } catch (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        next(error);
    }
});

module.exports = router;
