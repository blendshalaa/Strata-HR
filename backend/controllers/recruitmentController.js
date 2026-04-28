const pool = require('../config/database');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const openai = require('../config/openai');
const { sendEmail } = require('../utils/mailer');

// --- JOB POSTINGS ---

const getAllJobs = async (req, res, next) => {
    try {
        const { status } = req.query;
        let query = `
      SELECT j.*, d.name as department_name 
      FROM job_postings j
      LEFT JOIN departments d ON j.department_id = d.id
      WHERE j.org_id = $1
    `;
        const params = [req.user.org_id];

        if (status) {
            query += ` AND j.status = $2`;
            params.push(status);
        }

        query += ` ORDER BY j.created_at DESC`;
        const result = await pool.query(query, params);
        res.json({ jobs: result.rows });
    } catch (error) {
        next(error);
    }
};

const getJobById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT j.*, d.name as department_name 
       FROM job_postings j
       LEFT JOIN departments d ON j.department_id = d.id
       WHERE j.id = $1 AND j.org_id = $2`,
            [id, req.user.org_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job posting not found' });
        }
        res.json({ job: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const createJob = async (req, res, next) => {
    try {
        const { title, department_id, description, requirements, status } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }
        const insertResult = await pool.query(
            `INSERT INTO job_postings (title, department_id, description, requirements, status, org_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [title, department_id || null, description, requirements || '', status || 'open', req.user.org_id]
        );
        const jobId = insertResult.rows[0].id;
        const result = await pool.query(
            `SELECT j.*, d.name as department_name 
       FROM job_postings j
       LEFT JOIN departments d ON j.department_id = d.id
       WHERE j.id = $1`,
            [jobId]
        );
        res.status(201).json({ job: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const updateJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, department_id, description, requirements, status } = req.body;
        const updates = [];
        const params = [];
        let paramCount = 1;

        if (title) { updates.push(`title = $${paramCount}`); params.push(title); paramCount++; }
        if (department_id !== undefined) { updates.push(`department_id = $${paramCount}`); params.push(department_id); paramCount++; }
        if (description) { updates.push(`description = $${paramCount}`); params.push(description); paramCount++; }
        if (requirements !== undefined) { updates.push(`requirements = $${paramCount}`); params.push(requirements); paramCount++; }
        if (status) {
            updates.push(`status = $${paramCount}`); params.push(status); paramCount++;
            if (status === 'closed') updates.push(`closed_at = CURRENT_TIMESTAMP`);
            else if (status === 'open') updates.push(`closed_at = NULL`);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        params.push(id, req.user.org_id);
        const result = await pool.query(
            `UPDATE job_postings SET ${updates.join(', ')} WHERE id = $${paramCount} AND org_id = $${paramCount + 1} RETURNING *`,
            params
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job posting not found' });
        }
        res.json({ message: 'Job updated successfully', job: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// --- APPLICATIONS ---

const getAllApplications = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT a.*, j.title as job_title, j.department_id
       FROM applications a
       JOIN job_postings j ON a.job_id = j.id
       WHERE a.org_id = $1
       ORDER BY a.applied_at DESC`,
            [req.user.org_id]
        );
        res.json({ applications: result.rows });
    } catch (error) {
        next(error);
    }
};

const getApplicationsForJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const result = await pool.query(
            `SELECT * FROM applications WHERE job_id = $1 AND org_id = $2 ORDER BY applied_at DESC`,
            [jobId, req.user.org_id]
        );
        res.json({ applications: result.rows });
    } catch (error) {
        next(error);
    }
};

const submitApplication = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { applicant_name, email } = req.body;
        let resume_url = req.body.resume_url;

        if (req.file) {
            resume_url = `/uploads/resumes/${req.file.filename}`;
        }

        if (!applicant_name || !email) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Applicant name and email are required' });
        }

        // Look up the job to get its org_id (public endpoint — no req.user)
        const jobCheck = await pool.query('SELECT * FROM job_postings WHERE id = $1', [jobId]);
        if (jobCheck.rows.length === 0) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Job posting not found' });
        }
        const jobOrgId = jobCheck.rows[0].org_id;

        const result = await pool.query(
            `INSERT INTO applications (job_id, applicant_name, email, resume_url, status, org_id)
       VALUES ($1, $2, $3, $4, 'applied', $5) RETURNING *`,
            [jobId, applicant_name, email, resume_url || null, jobOrgId]
        );

        // Email confirmation to applicant
        const jobTitle = jobCheck.rows[0].title;
        const applicantHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 500px;">
            <h2 style="color: #6366f1;">Application Received</h2>
            <p>Hi ${applicant_name},</p>
            <p>Thank you for applying for the <strong>${jobTitle}</strong> position. We've received your application and will review it shortly.</p>
            <p>We'll be in touch with next steps soon.</p>
            <p style="color: #94a3b8; font-size: 13px;">— HR Genie System</p>
          </div>
        `;
        sendEmail(email, `Application Received – ${jobTitle}`, applicantHtml).catch(console.error);

        // Notify HR about new application
        const hrEmail = process.env.HR_EMAIL_ADDRESS;
        if (hrEmail) {
            const hrHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 500px;">
              <h2>New Application Received</h2>
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Applicant:</strong> ${applicant_name} (${email})</p>
              <p>Log in to the HR Genie dashboard to review this application.</p>
            </div>
          `;
            sendEmail(hrEmail, `New Application: ${applicant_name} for ${jobTitle}`, hrHtml).catch(console.error);
        }

        res.status(201).json({ message: 'Application submitted successfully', application: result.rows[0] });
    } catch (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        next(error);
    }
};

const updateApplicationStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['applied', 'interviewing', 'hired', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const result = await pool.query(
            `UPDATE applications SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING *`,
            [status, id, req.user.org_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Email the applicant about their status change
        const app = result.rows[0];
        if (app.email) {
            const jobRes = await pool.query('SELECT title FROM job_postings WHERE id = $1', [app.job_id]);
            const jobTitle = jobRes.rows[0]?.title || 'the position';
            const statusMessages = {
                interviewing: { color: '#f59e0b', msg: `We're impressed with your profile and would like to invite you for an interview for the <strong>${jobTitle}</strong> position. Our team will reach out shortly with scheduling details.` },
                hired: { color: '#10b981', msg: `Congratulations! We're thrilled to offer you the <strong>${jobTitle}</strong> position. Our HR team will be in touch with onboarding details soon.` },
                rejected: { color: '#94a3b8', msg: `Thank you for your interest in the <strong>${jobTitle}</strong> position. After careful review, we've decided to move forward with other candidates. We encourage you to apply for future openings.` },
                applied: { color: '#6366f1', msg: `Your application for <strong>${jobTitle}</strong> has been received and is under review.` }
            };
            const sm = statusMessages[status] || statusMessages.applied;
            const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 500px;">
              <h2 style="color: ${sm.color};">Application Update</h2>
              <p>Hi ${app.applicant_name},</p>
              <p>${sm.msg}</p>
              <p style="color: #94a3b8; font-size: 13px;">— HR Genie System</p>
            </div>
          `;
            sendEmail(app.email, `Application Update – ${jobTitle}`, emailHtml).catch(console.error);
        }

        res.json({ message: 'Application status updated', application: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const analyzeResume = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No resume file provided' });
        }
        const jobCheck = await pool.query('SELECT title, description, requirements FROM job_postings WHERE id = $1 AND org_id = $2', [jobId, req.user.org_id]);
        if (jobCheck.rows.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Job posting not found' });
        }
        const job = jobCheck.rows[0];
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        const resumeText = data.text;
        fs.unlinkSync(req.file.path);

        const prompt = `
        You are an expert ATS (Applicant Tracking System) AI. 
        Analyze the following resume against the provided job description.
        
        Job Title: ${job.title}
        Job Description: ${job.description}
        Job Requirements: ${job.requirements}
        
        Candidate Resume:
        ${resumeText.substring(0, 10000)}
        
        Return a strict JSON object with:
        - "score": A number out of 100 representing the match percentage.
        - "matched_skills": Array of strings.
        - "missing_skills": Array of strings.
        - "summary": A brief 2-3 sentence summary of the candidate's fit.
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            response_format: { type: "json_object" },
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.2
        });

        const result = JSON.parse(response.choices[0].message.content);
        res.json(result);
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        next(error);
    }
};

module.exports = { getAllJobs, getJobById, createJob, updateJob, getAllApplications, getApplicationsForJob, submitApplication, updateApplicationStatus, analyzeResume };
