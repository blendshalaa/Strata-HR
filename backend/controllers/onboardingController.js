const pool = require('../config/database');

const getTasks = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT * FROM onboarding_tasks WHERE user_id = $1 AND org_id = $2 ORDER BY id ASC',
            [userId, req.user.org_id]
        );
        res.json({ tasks: result.rows });
    } catch (error) {
        next(error);
    }
};

const toggleTask = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;

        const testResult = await pool.query('SELECT * FROM onboarding_tasks WHERE id = $1 AND user_id = $2 AND org_id = $3', [taskId, userId, req.user.org_id]);
        if (testResult.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found or forbidden' });
        }

        const task = testResult.rows[0];
        const updatedStatus = !task.is_completed;
        const completedAt = updatedStatus ? new Date() : null;

        const updateResult = await pool.query(
            'UPDATE onboarding_tasks SET is_completed = $1, completed_at = $2 WHERE id = $3 RETURNING id, user_id, is_completed, task_name, completed_at',
            [updatedStatus, completedAt, taskId]
        );

        res.json({ task: updateResult.rows[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = { getTasks, toggleTask };
