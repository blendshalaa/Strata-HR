const pool = require('../config/database');
const { sendEmail } = require('../utils/mailer');
const { payrollPaid } = require('../utils/emailTemplates');
const { createNotification } = require('./notificationController');
const { logAudit, getClientIP } = require('../middleware/auditLogger');

const getAllPayrolls = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT p.*, u.name as employee_name, u.email 
       FROM payroll p
       JOIN users u ON p.user_id = u.id
       WHERE p.org_id = $1
       ORDER BY p.pay_period_end DESC`,
            [req.user.org_id]
        );
        res.json({ payrolls: result.rows });
    } catch (error) {
        next(error);
    }
};

const getPayrollById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT p.*, u.name as employee_name, u.email 
       FROM payroll p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.org_id = $2`,
            [id, req.user.org_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payroll record not found' });
        }
        if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.id !== result.rows[0].user_id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        res.json({ payroll: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const getPayrollByUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const result = await pool.query(
            `SELECT * FROM payroll WHERE user_id = $1 AND org_id = $2 ORDER BY pay_period_end DESC`,
            [userId, req.user.org_id]
        );
        res.json({ payrolls: result.rows });
    } catch (error) {
        next(error);
    }
};

const createPayroll = async (req, res, next) => {
    try {
        const { user_id, base_salary, bonus, tax_deduction, pay_period_start, pay_period_end } = req.body;
        if (!user_id || !base_salary || !pay_period_start || !pay_period_end) {
            return res.status(400).json({ error: 'Missing required payroll fields' });
        }

        const insertResult = await pool.query(
            `INSERT INTO payroll (user_id, base_salary, bonus, tax_deduction, pay_period_start, pay_period_end, org_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [user_id, base_salary, bonus || 0, tax_deduction || 0, pay_period_start, pay_period_end, req.user.org_id]
        );

        const payrollId = insertResult.rows[0].id;
        const result = await pool.query(
            `SELECT p.*, u.name as employee_name, u.email 
       FROM payroll p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
            [payrollId]
        );
        res.status(201).json({ payroll: result.rows[0] });

        // Audit trail — payroll creation
        logAudit({
            actorId: req.user.id, action: 'create', entityType: 'payroll',
            entityId: payrollId, newValue: result.rows[0],
            ipAddress: getClientIP(req), orgId: req.user.org_id,
        });
    } catch (error) {
        next(error);
    }
};

const updatePayrollStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['pending', 'paid'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const result = await pool.query(
            `UPDATE payroll SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING id, user_id, rating, comments, reviewed_by, org_id, created_at`,
            [status, id, req.user.org_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payroll record not found' });
        }

        const payroll = result.rows[0];

        // In-app notification + email to employee when marked as paid
        if (status === 'paid') {
            const userRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [payroll.user_id]);
            const employee = userRes.rows[0];

            // In-app
            await createNotification(
                payroll.user_id, 'payroll',
                'Payroll Processed',
                `Your payroll has been marked as paid. Net pay: $${parseFloat(payroll.net_salary).toLocaleString()}.`
            );

            // Email
            if (employee?.email) {
                const tmpl = payrollPaid({
                    employeeName: employee.name,
                    periodStart: payroll.pay_period_start,
                    periodEnd: payroll.pay_period_end,
                    baseSalary: payroll.base_salary,
                    bonus: payroll.bonus,
                    taxDeduction: payroll.tax_deduction,
                    netSalary: payroll.net_salary,
                });
                sendEmail(employee.email, tmpl.subject, tmpl.html).catch(console.error);
            }
        }

        // Audit trail — payroll status change
        logAudit({
            actorId: req.user.id, action: status === 'paid' ? 'approve' : 'update',
            entityType: 'payroll', entityId: parseInt(id),
            oldValue: { status: 'pending' }, newValue: { status },
            ipAddress: getClientIP(req), orgId: req.user.org_id,
        });

        res.json({ message: 'Payroll status updated', payroll: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const generateFromTimesheets = async (req, res, next) => {
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const timesheetsQuery = await client.query(`
                SELECT user_id, 
                       SUM(regular_hours) as tot_reg, 
                       SUM(overtime_hours) as tot_ot,
                       MIN(clock_in) as period_start,
                       MAX(clock_out) as period_end
                FROM timesheets 
                WHERE status = 'approved' AND org_id = $1
                GROUP BY user_id
            `, [req.user.org_id]);

            if (timesheetsQuery.rows.length === 0) {
                return res.status(400).json({ error: 'No approved timesheets ready for processing.' });
            }

            const newPayrolls = [];

            for (let row of timesheetsQuery.rows) {
                const base = parseFloat(row.tot_reg || 0) * 25;
                const bonus = parseFloat(row.tot_ot || 0) * 37.5;
                const tax = (base + bonus) * 0.2;

                const insertRes = await client.query(`
                    INSERT INTO payroll (user_id, base_salary, bonus, tax_deduction, pay_period_start, pay_period_end, org_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
                `, [row.user_id, base, bonus, tax, row.period_start, row.period_end || row.period_start, req.user.org_id]);

                await client.query(`
                    UPDATE timesheets SET status = 'processed' 
                    WHERE user_id = $1 AND status = 'approved' AND org_id = $2
                `, [row.user_id, req.user.org_id]);

                const payrollId = insertRes.rows[0].id;
                const fullPayrollRes = await client.query(`
                    SELECT p.*, u.name as employee_name, u.email 
                    FROM payroll p JOIN users u ON p.user_id = u.id WHERE p.id = $1
                `, [payrollId]);

                newPayrolls.push(fullPayrollRes.rows[0]);

                await client.query(`
                    INSERT INTO notifications (user_id, type, title, message, org_id) 
                    VALUES ($1, 'payroll', 'Payroll Generated', 'Your latest payroll has been generated from your approved timesheets.', $2)
                `, [row.user_id, req.user.org_id]);
            }

            await client.query('COMMIT');
            res.json({ message: 'Payroll generated successfully', payrolls: newPayrolls });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllPayrolls, getPayrollById, getPayrollByUser, createPayroll, updatePayrollStatus, generateFromTimesheets };
