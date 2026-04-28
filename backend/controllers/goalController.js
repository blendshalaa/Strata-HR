const pool = require('../config/database');

/**
 * Get goals for a specific user (or all org goals for admin/HR).
 */
const getGoals = async (req, res, next) => {
    try {
        const { userId } = req.query;
        const orgId = req.user.org_id;
        const isAdmin = ['admin', 'hr', 'manager'].includes(req.user.role);

        let query, params;

        if (userId && isAdmin) {
            query = `SELECT g.*, u.name as owner_name, c.name as creator_name,
                       (SELECT COUNT(*) FROM key_results kr WHERE kr.goal_id = g.id) as kr_count
                     FROM goals g
                     LEFT JOIN users u ON g.user_id = u.id
                     LEFT JOIN users c ON g.created_by = c.id
                     WHERE g.user_id = $1 AND g.org_id = $2 ORDER BY g.created_at DESC`;
            params = [userId, orgId];
        } else if (isAdmin && !userId) {
            query = `SELECT g.*, u.name as owner_name, c.name as creator_name,
                       (SELECT COUNT(*) FROM key_results kr WHERE kr.goal_id = g.id) as kr_count
                     FROM goals g
                     LEFT JOIN users u ON g.user_id = u.id
                     LEFT JOIN users c ON g.created_by = c.id
                     WHERE g.org_id = $1 ORDER BY g.created_at DESC`;
            params = [orgId];
        } else {
            query = `SELECT g.*, u.name as owner_name, c.name as creator_name,
                       (SELECT COUNT(*) FROM key_results kr WHERE kr.goal_id = g.id) as kr_count
                     FROM goals g
                     LEFT JOIN users u ON g.user_id = u.id
                     LEFT JOIN users c ON g.created_by = c.id
                     WHERE g.user_id = $1 AND g.org_id = $2 ORDER BY g.created_at DESC`;
            params = [req.user.id, orgId];
        }

        const result = await pool.query(query, params);
        res.json({ goals: result.rows });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single goal with its key results.
 */
const getGoalById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const goalResult = await pool.query(
            `SELECT g.*, u.name as owner_name, c.name as creator_name
             FROM goals g
             LEFT JOIN users u ON g.user_id = u.id
             LEFT JOIN users c ON g.created_by = c.id
             WHERE g.id = $1 AND g.org_id = $2`,
            [id, req.user.org_id]
        );

        if (goalResult.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const goal = goalResult.rows[0];

        // Check access
        if (req.user.role === 'employee' && goal.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only view your own goals' });
        }

        const krResult = await pool.query(
            'SELECT * FROM key_results WHERE goal_id = $1 ORDER BY id ASC',
            [id]
        );

        res.json({ goal: { ...goal, key_results: krResult.rows } });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new goal. Managers/HR can create goals for others.
 */
const createGoal = async (req, res, next) => {
    try {
        const { user_id, title, description, category, target_date, key_results } = req.body;
        const targetUserId = user_id || req.user.id;

        if (!title) return res.status(400).json({ error: 'Goal title is required' });

        // Employees can only create goals for themselves
        if (req.user.role === 'employee' && parseInt(targetUserId) !== req.user.id) {
            return res.status(403).json({ error: 'You can only create goals for yourself' });
        }

        const result = await pool.query(
            `INSERT INTO goals (user_id, org_id, title, description, category, target_date, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [targetUserId, req.user.org_id, title, description || '', category || 'individual', target_date || null, req.user.id]
        );

        const goal = result.rows[0];

        // Create key results if provided
        if (key_results && Array.isArray(key_results) && key_results.length > 0) {
            for (const kr of key_results) {
                if (kr.title) {
                    await pool.query(
                        'INSERT INTO key_results (goal_id, title, target_value, unit) VALUES ($1, $2, $3, $4)',
                        [goal.id, kr.title, kr.target_value || 100, kr.unit || '%']
                    );
                }
            }
        }

        // Fetch back with key results
        const krResult = await pool.query('SELECT * FROM key_results WHERE goal_id = $1', [goal.id]);
        res.status(201).json({ message: 'Goal created', goal: { ...goal, key_results: krResult.rows } });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a goal's fields.
 */
const updateGoal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, category, target_date, status, progress } = req.body;

        // Check ownership / access
        const existing = await pool.query('SELECT * FROM goals WHERE id = $1 AND org_id = $2', [id, req.user.org_id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });

        if (req.user.role === 'employee' && existing.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only update your own goals' });
        }

        const result = await pool.query(
            `UPDATE goals SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                target_date = COALESCE($4, target_date),
                status = COALESCE($5, status),
                progress = COALESCE($6, progress),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 AND org_id = $8 RETURNING *`,
            [title, description, category, target_date, status, progress, id, req.user.org_id]
        );

        res.json({ message: 'Goal updated', goal: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a goal.
 */
const deleteGoal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await pool.query('SELECT * FROM goals WHERE id = $1 AND org_id = $2', [id, req.user.org_id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });

        if (req.user.role === 'employee' && existing.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own goals' });
        }

        await pool.query('DELETE FROM goals WHERE id = $1', [id]);
        res.json({ message: 'Goal deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a key result's progress.
 */
const updateKeyResult = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { current_value, title, target_value, unit } = req.body;

        // Verify KR exists and belongs to user's org
        const krCheck = await pool.query(
            `SELECT kr.*, g.user_id, g.org_id FROM key_results kr
             JOIN goals g ON kr.goal_id = g.id
             WHERE kr.id = $1`,
            [id]
        );

        if (krCheck.rows.length === 0) return res.status(404).json({ error: 'Key result not found' });
        const kr = krCheck.rows[0];

        if (kr.org_id !== req.user.org_id) return res.status(404).json({ error: 'Key result not found' });
        if (req.user.role === 'employee' && kr.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const result = await pool.query(
            `UPDATE key_results SET
                title = COALESCE($1, title),
                current_value = COALESCE($2, current_value),
                target_value = COALESCE($3, target_value),
                unit = COALESCE($4, unit),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $5 RETURNING *`,
            [title, current_value, target_value, unit, id]
        );

        // Auto-update goal progress based on key results average
        const allKRs = await pool.query(
            'SELECT current_value, target_value FROM key_results WHERE goal_id = $1',
            [kr.goal_id]
        );
        const avg = allKRs.rows.reduce((sum, r) => {
            const pct = r.target_value > 0 ? Math.min((r.current_value / r.target_value) * 100, 100) : 0;
            return sum + pct;
        }, 0) / (allKRs.rows.length || 1);

        await pool.query('UPDATE goals SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [Math.round(avg), kr.goal_id]);

        res.json({ message: 'Key result updated', key_result: result.rows[0], goal_progress: Math.round(avg) });
    } catch (error) {
        next(error);
    }
};

/**
 * Add a key result to an existing goal.
 */
const addKeyResult = async (req, res, next) => {
    try {
        const { goalId } = req.params;
        const { title, target_value, unit } = req.body;

        if (!title) return res.status(400).json({ error: 'Key result title is required' });

        const goalCheck = await pool.query('SELECT * FROM goals WHERE id = $1 AND org_id = $2', [goalId, req.user.org_id]);
        if (goalCheck.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });

        if (req.user.role === 'employee' && goalCheck.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const result = await pool.query(
            'INSERT INTO key_results (goal_id, title, target_value, unit) VALUES ($1, $2, $3, $4) RETURNING *',
            [goalId, title, target_value || 100, unit || '%']
        );

        res.status(201).json({ key_result: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a key result.
 */
const deleteKeyResult = async (req, res, next) => {
    try {
        const { id } = req.params;

        const krCheck = await pool.query(
            `SELECT kr.*, g.user_id, g.org_id, g.id as goal_id FROM key_results kr
             JOIN goals g ON kr.goal_id = g.id WHERE kr.id = $1`,
            [id]
        );
        if (krCheck.rows.length === 0) return res.status(404).json({ error: 'Key result not found' });
        const kr = krCheck.rows[0];

        if (kr.org_id !== req.user.org_id) return res.status(404).json({ error: 'Key result not found' });
        if (req.user.role === 'employee' && kr.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await pool.query('DELETE FROM key_results WHERE id = $1', [id]);

        // Recalculate goal progress
        const remaining = await pool.query('SELECT current_value, target_value FROM key_results WHERE goal_id = $1', [kr.goal_id]);
        const avg = remaining.rows.length > 0
            ? remaining.rows.reduce((s, r) => s + Math.min((r.current_value / r.target_value) * 100, 100), 0) / remaining.rows.length
            : 0;
        await pool.query('UPDATE goals SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [Math.round(avg), kr.goal_id]);

        res.json({ message: 'Key result deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getGoals, getGoalById, createGoal, updateGoal, deleteGoal, updateKeyResult, addKeyResult, deleteKeyResult };
