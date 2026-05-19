const pool = require('../config/database');
const openai = require('../config/openai');

const getReviewsForUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.role !== 'manager' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const result = await pool.query(
            `SELECT pr.*, u.name as reviewer_name 
       FROM performance_reviews pr
       LEFT JOIN users u ON pr.reviewer_id = u.id
       WHERE pr.user_id = $1 AND pr.org_id = $2
       ORDER BY pr.review_date DESC`,
            [userId, req.user.org_id]
        );
        res.json({ reviews: result.rows });
    } catch (error) {
        next(error);
    }
};

const getReviewById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT pr.*, u.name as reviewer_name, emp.name as employee_name
       FROM performance_reviews pr
       LEFT JOIN users u ON pr.reviewer_id = u.id
       LEFT JOIN users emp ON pr.user_id = emp.id
       WHERE pr.id = $1 AND pr.org_id = $2`,
            [id, req.user.org_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        const review = result.rows[0];
        if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.role !== 'manager' && req.user.id !== review.user_id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        res.json({ review });
    } catch (error) {
        next(error);
    }
};

const createReview = async (req, res, next) => {
    try {
        const { user_id, evaluation_criteria, rating, comments, review_date } = req.body;
        const reviewer_id = req.user.id;
        if (!user_id || !rating || !review_date) {
            return res.status(400).json({ error: 'Missing required review fields' });
        }
        const insertResult = await pool.query(
            `INSERT INTO performance_reviews (user_id, reviewer_id, evaluation_criteria, rating, comments, review_date, org_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [user_id, reviewer_id, JSON.stringify(evaluation_criteria || {}), rating, comments, review_date, req.user.org_id]
        );
        const reviewId = insertResult.rows[0].id;
        const result = await pool.query(
            `SELECT pr.*, u.name as reviewer_name 
       FROM performance_reviews pr
       LEFT JOIN users u ON pr.reviewer_id = u.id
       WHERE pr.id = $1`,
            [reviewId]
        );
        res.status(201).json({ review: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { evaluation_criteria, rating, comments } = req.body;
        const result = await pool.query('SELECT * FROM performance_reviews WHERE id = $1 AND org_id = $2', [id, req.user.org_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.id !== result.rows[0].reviewer_id) {
            return res.status(403).json({ error: 'You can only update reviews you created' });
        }
        const updates = [];
        const params = [];
        let paramCount = 1;
        if (evaluation_criteria) { updates.push(`evaluation_criteria = $${paramCount}`); params.push(JSON.stringify(evaluation_criteria)); paramCount++; }
        if (rating) { updates.push(`rating = $${paramCount}`); params.push(rating); paramCount++; }
        if (comments !== undefined) { updates.push(`comments = $${paramCount}`); params.push(comments); paramCount++; }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        params.push(id, req.user.org_id);
        const updateResult = await pool.query(
            `UPDATE performance_reviews SET ${updates.join(', ')} WHERE id = $${paramCount} AND org_id = $${paramCount + 1} RETURNING id, user_id, reviewer_id, evaluation_criteria, rating, comments, review_date, org_id, created_at`,
            params
        );
        res.json({ message: 'Review updated', review: updateResult.rows[0] });
    } catch (error) {
        next(error);
    }
};

const generateDraft = async (req, res, next) => {
    try {
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const empQuery = await pool.query('SELECT name, department, role, created_at FROM users WHERE id = $1 AND org_id = $2', [user_id, req.user.org_id]);
        if (empQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        const emp = empQuery.rows[0];
        const leavesQuery = await pool.query("SELECT COUNT(*) as count, type FROM leave_requests WHERE user_id = $1 AND status = 'approved' GROUP BY type", [user_id]);
        const prompt = `
        You are an expert HR Manager AI. Draft a concise but highly professional performance review.
        
        Employee Name: ${emp.name}
        Department: ${emp.department}
        Role: ${emp.role}
        Tenure: Employed since ${new Date(emp.created_at).toLocaleDateString()}
        Leave History: ${JSON.stringify(leavesQuery.rows)}
        
        Task: Provide a draft performance review.
        Return a strict JSON object with:
        - "rating": Integer from 1 to 5
        - "comments": 2-3 paragraphs of well-written manager feedback
        `;
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            response_format: { type: "json_object" },
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.5
        });
        const result = JSON.parse(response.choices[0].message.content);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { getReviewsForUser, getReviewById, createReview, updateReview, generateDraft };
