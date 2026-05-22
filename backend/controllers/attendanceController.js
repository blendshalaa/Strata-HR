const pool = require('../config/database');
const { createNotification } = require('./notificationController');
const { sendEmail } = require('../utils/mailer');
const { logAudit, getClientIP } = require('../middleware/auditLogger');

const clockIn = async (req, res, next) => {
    try {
        const existing = await pool.query(
            'SELECT id FROM timesheets WHERE user_id = $1 AND clock_out IS NULL',
            [req.user.id]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'You already have an active clock-in session' });
        }

        const result = await pool.query(
            `INSERT INTO timesheets (user_id, clock_in, org_id) VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING id, user_id, clock_in, clock_out, regular_hours, overtime_hours, notes, status, org_id, created_at`,
            [req.user.id, req.user.org_id]
        );
        res.status(201).json({ message: 'Clocked in successfully', timesheet: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const clockOut = async (req, res, next) => {
    try {
        const active = await pool.query(
            'SELECT * FROM timesheets WHERE user_id = $1 AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1',
            [req.user.id]
        );

        if (active.rows.length === 0) {
            return res.status(400).json({ error: 'No active clock-in session found' });
        }

        const timesheet = active.rows[0];
        const clockInTime = new Date(timesheet.clock_in);
        const clockOutTime = new Date();
        const diffMs = clockOutTime - clockInTime;
        const totalHours = diffMs / (1000 * 60 * 60);
        const regularHours = Math.min(totalHours, 8);
        const overtimeHours = Math.max(0, totalHours - 8);

        const result = await pool.query(
            `UPDATE timesheets SET clock_out = CURRENT_TIMESTAMP, regular_hours = $1, overtime_hours = $2 
             WHERE id = $3 RETURNING id, user_id, clock_in, clock_out, regular_hours, overtime_hours, notes, status, org_id, created_at`,
            [regularHours.toFixed(2), overtimeHours.toFixed(2), timesheet.id]
        );

        res.json({ message: 'Clocked out successfully', timesheet: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// P0: Manual time entry — employee submits a missed clock in/out
const manualEntry = async (req, res, next) => {
    try {
        const { clock_in, clock_out, notes } = req.body;

        if (!clock_in || !clock_out) {
            return res.status(400).json({ error: 'Both clock_in and clock_out are required' });
        }

        const clockInTime = new Date(clock_in);
        const clockOutTime = new Date(clock_out);

        if (clockOutTime <= clockInTime) {
            return res.status(400).json({ error: 'Clock out must be after clock in' });
        }

        const diffMs = clockOutTime - clockInTime;
        const totalHours = diffMs / (1000 * 60 * 60);

        if (totalHours > 24) {
            return res.status(400).json({ error: 'A single entry cannot exceed 24 hours' });
        }

        const regularHours = Math.min(totalHours, 8);
        const overtimeHours = Math.max(0, totalHours - 8);

        const result = await pool.query(
            `INSERT INTO timesheets (user_id, clock_in, clock_out, regular_hours, overtime_hours, notes, org_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING id, user_id, clock_in, clock_out, regular_hours, overtime_hours, notes, status, org_id, created_at`,
            [req.user.id, clockInTime, clockOutTime, regularHours.toFixed(2), overtimeHours.toFixed(2), notes || null, req.user.org_id]
        );

        res.status(201).json({ message: 'Manual entry submitted for approval', timesheet: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// P0: HR edit — correct clock in/out times on any timesheet
const editTimesheet = async (req, res, next) => {
    try {
        const isAdmin = ['admin', 'hr'].includes(req.user.role);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only HR/Admin can edit timesheets' });
        }

        const { id } = req.params;
        const { clock_in, clock_out, notes } = req.body;

        const existing = await pool.query('SELECT * FROM timesheets WHERE id = $1 AND org_id = $2', [id, req.user.org_id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Timesheet not found' });
        }

        const newClockIn = clock_in ? new Date(clock_in) : new Date(existing.rows[0].clock_in);
        const newClockOut = clock_out ? new Date(clock_out) : (existing.rows[0].clock_out ? new Date(existing.rows[0].clock_out) : null);

        let regularHours = existing.rows[0].regular_hours;
        let overtimeHours = existing.rows[0].overtime_hours;

        if (newClockOut) {
            const diffMs = newClockOut - newClockIn;
            const totalHours = diffMs / (1000 * 60 * 60);
            regularHours = Math.min(totalHours, 8).toFixed(2);
            overtimeHours = Math.max(0, totalHours - 8).toFixed(2);
        }

        const result = await pool.query(
            `UPDATE timesheets SET clock_in = $1, clock_out = $2, regular_hours = $3, overtime_hours = $4, notes = COALESCE($5, notes)
             WHERE id = $6 RETURNING id, user_id, clock_in, clock_out, regular_hours, overtime_hours, notes, status, org_id, created_at`,
            [newClockIn, newClockOut, regularHours, overtimeHours, notes || null, id]
        );

        // Notify the employee
        await createNotification(
            result.rows[0].user_id,
            'timesheet',
            'Timesheet Edited',
            `Your timesheet for ${newClockIn.toLocaleDateString()} was corrected by HR.`
        );

        // Audit trail — HR timesheet edit
        logAudit({
            actorId: req.user.id, action: 'update', entityType: 'timesheet',
            entityId: parseInt(id), oldValue: { clock_in: existing.rows[0].clock_in, clock_out: existing.rows[0].clock_out },
            newValue: { clock_in: newClockIn, clock_out: newClockOut, regular_hours: regularHours, overtime_hours: overtimeHours },
            ipAddress: getClientIP(req), orgId: req.user.org_id,
        });

        res.json({ message: 'Timesheet updated', timesheet: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

// P0: Date range filtering added
const getMyTimesheets = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        let query = `SELECT * FROM timesheets WHERE user_id = $1 AND org_id = $2`;
        const params = [req.user.id, req.user.org_id];

        if (from) {
            params.push(from);
            query += ` AND clock_in >= $${params.length}`;
        }
        if (to) {
            params.push(to);
            query += ` AND clock_in <= $${params.length}::date + INTERVAL '1 day'`;
        }

        query += ` ORDER BY clock_in DESC`;
        const result = await pool.query(query, params);
        res.json({ timesheets: result.rows });
    } catch (error) {
        next(error);
    }
};

// P0: Date range filtering added
const getApprovals = async (req, res, next) => {
    try {
        const { from, to, status: filterStatus } = req.query;
        let query = `SELECT t.*, u.name as employee_name, u.department 
             FROM timesheets t 
             JOIN users u ON t.user_id = u.id 
             WHERE t.clock_out IS NOT NULL AND t.org_id = $1`;
        const params = [req.user.org_id];

        if (from) {
            params.push(from);
            query += ` AND t.clock_in >= $${params.length}`;
        }
        if (to) {
            params.push(to);
            query += ` AND t.clock_in <= $${params.length}::date + INTERVAL '1 day'`;
        }
        if (filterStatus) {
            params.push(filterStatus);
            query += ` AND t.status = $${params.length}`;
        }

        query += ` ORDER BY t.created_at DESC`;
        const result = await pool.query(query, params);
        res.json({ timesheets: result.rows });
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
        }

        const result = await pool.query(
            'UPDATE timesheets SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING id, user_id, clock_in, clock_out, regular_hours, overtime_hours, notes, status, org_id, created_at',
            [status, id, req.user.org_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Timesheet not found' });
        }

        await createNotification(
            result.rows[0].user_id,
            'timesheet',
            `Timesheet ${status}`,
            `Your timesheet for ${new Date(result.rows[0].clock_in).toLocaleDateString()} has been ${status}.`
        );

        // Audit trail — timesheet status change
        logAudit({
            actorId: req.user.id, action: status === 'approved' ? 'approve' : 'reject',
            entityType: 'timesheet', entityId: parseInt(id),
            oldValue: { status: 'pending' }, newValue: { status },
            ipAddress: getClientIP(req), orgId: req.user.org_id,
        });

        // Email the employee about the timesheet status
        const empRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [result.rows[0].user_id]);
        const emp = empRes.rows[0];
        if (emp && emp.email) {
            const timesheet = result.rows[0];
            const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
            const tsDate = new Date(timesheet.clock_in).toLocaleDateString();

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 500px;">
                <h2 style="color: ${statusColor};">Timesheet ${statusLabel}</h2>
                <p>Hi ${emp.name},</p>
                <p>Your timesheet for <strong>${tsDate}</strong> has been <strong style="color: ${statusColor};">${status}</strong> by HR.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Clock In</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(timesheet.clock_in).toLocaleTimeString()}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Clock Out</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(timesheet.clock_out).toLocaleTimeString()}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Regular Hours</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${timesheet.regular_hours}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Overtime Hours</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${timesheet.overtime_hours}</td></tr>
                </table>
                <p style="color: #94a3b8; font-size: 13px;">— HR Genie</p>
              </div>
            `;
            sendEmail(emp.email, `Timesheet ${statusLabel} – ${tsDate}`, emailHtml).catch(console.error);
        }

        res.json({ message: 'Status updated', timesheet: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = { clockIn, clockOut, manualEntry, editTimesheet, getMyTimesheets, getApprovals, updateStatus };
