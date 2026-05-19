const pool = require('../config/database');
const crypto = require('crypto');

const getOrg = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, name, slug, logo_url, plan, invite_code, created_at FROM organizations WHERE id = $1',
            [req.user.org_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        res.json({ organization: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const updateOrg = async (req, res, next) => {
    try {
        const { name, logo_url } = req.body;
        const updates = [];
        const params = [];
        let i = 1;

        if (name) { updates.push(`name = $${i}`); params.push(name); i++; }
        if (logo_url !== undefined) { updates.push(`logo_url = $${i}`); params.push(logo_url); i++; }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.user.org_id);
        const result = await pool.query(
            `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, slug, logo_url, plan, invite_code, created_at`,
            params
        );

        res.json({ organization: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const regenerateInviteCode = async (req, res, next) => {
    try {
        const newCode = crypto.randomBytes(16).toString('hex');
        const result = await pool.query(
            'UPDATE organizations SET invite_code = $1 WHERE id = $2 RETURNING invite_code',
            [newCode, req.user.org_id]
        );
        res.json({ invite_code: result.rows[0].invite_code });
    } catch (error) {
        next(error);
    }
};

const getOrgMembers = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, department, role, hire_date, created_at
       FROM users WHERE org_id = $1 ORDER BY name ASC`,
            [req.user.org_id]
        );
        res.json({ members: result.rows });
    } catch (error) {
        next(error);
    }
};

module.exports = { getOrg, updateOrg, regenerateInviteCode, getOrgMembers };
