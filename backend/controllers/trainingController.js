const pool = require('../config/database');
const { createNotification } = require('./notificationController');

/**
 * Get all available trainings (library).
 */
const getTrainings = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM trainings ORDER BY created_at DESC');
        res.json({ trainings: result.rows });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new training course (Admin/HR).
 */
const createTraining = async (req, res, next) => {
    try {
        const { title, description, link_url, duration_minutes } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const result = await pool.query(
            `INSERT INTO trainings (title, description, link_url, duration_minutes) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [title, description, link_url, duration_minutes || null]
        );

        res.status(201).json({ message: 'Training created', training: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a training course (Admin/HR).
 */
const deleteTraining = async (req, res, next) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM trainings WHERE id = $1', [id]);
        res.json({ message: 'Training deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get assigned trainings for the current employee.
 */
const getMyAssignedTrainings = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT ut.*, t.title, t.description, t.link_url, t.duration_minutes 
             FROM user_trainings ut
             JOIN trainings t ON ut.training_id = t.id
             WHERE ut.user_id = $1
             ORDER BY ut.status ASC, ut.created_at DESC`,
            [req.user.id]
        );
        res.json({ assigned_trainings: result.rows });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign a training to an employee (Admin/HR).
 */
const assignTraining = async (req, res, next) => {
    try {
        const { user_id, training_id } = req.body;
        
        if (!user_id || !training_id) {
            return res.status(400).json({ error: 'User ID and Training ID are required' });
        }

        const result = await pool.query(
            `INSERT INTO user_trainings (user_id, training_id, assigned_by) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (user_id, training_id) DO NOTHING 
             RETURNING *`,
            [user_id, training_id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Training is already assigned to this user' });
        }

        // Notify user
        const trainingQuery = await pool.query('SELECT title FROM trainings WHERE id = $1', [training_id]);
        await createNotification(
            user_id,
            'info',
            'New Training Assigned',
            `You have been assigned a new training course: ${trainingQuery.rows[0].title}`,
            '/training'
        );

        res.status(201).json({ message: 'Training assigned', assignment: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark an assigned training as completed.
 */
const completeTraining = async (req, res, next) => {
    try {
        const { assignment_id } = req.params;

        const checkQuery = await pool.query('SELECT * FROM user_trainings WHERE id = $1', [assignment_id]);
        if (checkQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        if (req.user.role === 'employee' && checkQuery.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only complete your own assignments' });
        }

        const result = await pool.query(
            `UPDATE user_trainings 
             SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
             WHERE id = $1 RETURNING *`,
            [assignment_id]
        );

        res.json({ message: 'Training marked as completed', assignment: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTrainings,
    createTraining,
    deleteTraining,
    getMyAssignedTrainings,
    assignTraining,
    completeTraining
};
