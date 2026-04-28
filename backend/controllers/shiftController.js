const pool = require('../config/database');
const { createNotification } = require('./notificationController');

// Get shifts for a date range (HR sees all, employee sees own)
const getShifts = async (req, res, next) => {
    try {
        const { from, to, user_id } = req.query;
        const isAdmin = ['admin', 'hr'].includes(req.user.role);

        let query = `
            SELECT s.*, u.name as employee_name, u.department,
                   c.name as created_by_name
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN users c ON s.created_by = c.id
            WHERE s.org_id = $1
        `;
        const params = [req.user.org_id];

        if (!isAdmin) {
            params.push(req.user.id);
            query += ` AND s.user_id = $${params.length}`;
        } else if (user_id) {
            params.push(user_id);
            query += ` AND s.user_id = $${params.length}`;
        }

        if (from) {
            params.push(from);
            query += ` AND s.shift_date >= $${params.length}`;
        }
        if (to) {
            params.push(to);
            query += ` AND s.shift_date <= $${params.length}`;
        }

        query += ` ORDER BY s.shift_date ASC, s.start_time ASC`;
        const result = await pool.query(query, params);
        res.json({ shifts: result.rows });
    } catch (error) {
        next(error);
    }
};

// Create a shift (HR/Admin only)
const createShift = async (req, res, next) => {
    try {
        const { user_id, shift_date, start_time, end_time, shift_type, notes } = req.body;

        if (!user_id || !shift_date || !start_time || !end_time) {
            return res.status(400).json({ error: 'user_id, shift_date, start_time, and end_time are required' });
        }

        // Check employee exists and belongs to same org
        const empCheck = await pool.query('SELECT id, name FROM users WHERE id = $1 AND org_id = $2', [user_id, req.user.org_id]);
        if (empCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Check for overlapping shifts
        const overlap = await pool.query(
            `SELECT id FROM shifts 
             WHERE user_id = $1 AND shift_date = $2 AND org_id = $3
             AND (start_time, end_time) OVERLAPS ($4::time, $5::time)`,
            [user_id, shift_date, req.user.org_id, start_time, end_time]
        );
        if (overlap.rows.length > 0) {
            return res.status(400).json({ error: 'This shift overlaps with an existing shift for this employee' });
        }

        const result = await pool.query(
            `INSERT INTO shifts (user_id, shift_date, start_time, end_time, shift_type, notes, created_by, org_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [user_id, shift_date, start_time, end_time, shift_type || 'regular', notes || null, req.user.id, req.user.org_id]
        );

        // Notify the employee
        await createNotification(
            user_id,
            'shift',
            'New Shift Assigned',
            `You have been assigned a ${shift_type || 'regular'} shift on ${new Date(shift_date).toLocaleDateString()} (${start_time} – ${end_time}).`
        );

        // Return with employee name
        const shift = result.rows[0];
        shift.employee_name = empCheck.rows[0].name;
        res.status(201).json({ message: 'Shift created', shift });
    } catch (error) {
        next(error);
    }
};

// Bulk create shifts (assign same shift to multiple employees)
const bulkCreateShifts = async (req, res, next) => {
    try {
        const { user_ids, shift_date, start_time, end_time, shift_type, notes } = req.body;

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ error: 'user_ids array is required' });
        }
        if (!shift_date || !start_time || !end_time) {
            return res.status(400).json({ error: 'shift_date, start_time, and end_time are required' });
        }

        const created = [];
        const errors = [];

        for (const uid of user_ids) {
            try {
                // Check overlap
                const overlap = await pool.query(
                    `SELECT id FROM shifts 
                     WHERE user_id = $1 AND shift_date = $2 AND org_id = $3
                     AND (start_time, end_time) OVERLAPS ($4::time, $5::time)`,
                    [uid, shift_date, req.user.org_id, start_time, end_time]
                );
                if (overlap.rows.length > 0) {
                    const emp = await pool.query('SELECT name FROM users WHERE id = $1', [uid]);
                    errors.push(`${emp.rows[0]?.name || uid}: overlapping shift`);
                    continue;
                }

                const result = await pool.query(
                    `INSERT INTO shifts (user_id, shift_date, start_time, end_time, shift_type, notes, created_by, org_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                    [uid, shift_date, start_time, end_time, shift_type || 'regular', notes || null, req.user.id, req.user.org_id]
                );
                created.push(result.rows[0]);

                await createNotification(
                    uid, 'shift', 'New Shift Assigned',
                    `You have been assigned a ${shift_type || 'regular'} shift on ${new Date(shift_date).toLocaleDateString()} (${start_time} – ${end_time}).`
                );
            } catch (err) {
                errors.push(`User ${uid}: ${err.message}`);
            }
        }

        res.status(201).json({ message: `${created.length} shifts created`, shifts: created, errors });
    } catch (error) {
        next(error);
    }
};

// Update a shift
const updateShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { shift_date, start_time, end_time, shift_type, notes } = req.body;

        const existing = await pool.query('SELECT * FROM shifts WHERE id = $1 AND org_id = $2', [id, req.user.org_id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        const result = await pool.query(
            `UPDATE shifts SET 
                shift_date = COALESCE($1, shift_date),
                start_time = COALESCE($2, start_time),
                end_time = COALESCE($3, end_time),
                shift_type = COALESCE($4, shift_type),
                notes = COALESCE($5, notes)
             WHERE id = $6 RETURNING *`,
            [shift_date, start_time, end_time, shift_type, notes, id]
        );

        await createNotification(
            result.rows[0].user_id, 'shift', 'Shift Updated',
            `Your shift on ${new Date(result.rows[0].shift_date).toLocaleDateString()} has been updated.`
        );

        res.json({ message: 'Shift updated', shift: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// Delete a shift
const deleteShift = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await pool.query('SELECT * FROM shifts WHERE id = $1 AND org_id = $2', [id, req.user.org_id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        await createNotification(
            existing.rows[0].user_id, 'shift', 'Shift Removed',
            `Your shift on ${new Date(existing.rows[0].shift_date).toLocaleDateString()} (${existing.rows[0].start_time} – ${existing.rows[0].end_time}) has been removed.`
        );

        await pool.query('DELETE FROM shifts WHERE id = $1', [id]);
        res.json({ message: 'Shift deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getShifts, createShift, bulkCreateShifts, updateShift, deleteShift };
