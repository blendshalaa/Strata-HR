const pool = require('../config/database');
const { sendEmail } = require('../utils/mailer');

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
            `UPDATE payroll SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING *`,
            [status, id, req.user.org_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payroll record not found' });
        }

        const payroll = result.rows[0];

        // Send email notification to employee if payroll was marked as paid
        if (status === 'paid') {
            const userRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [payroll.user_id]);
            const employee = userRes.rows[0];
            if (employee && employee.email) {
                const emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 500px;">
                    <h2 style="color: #10b981;">Payroll Processed</h2>
                    <p>Hi ${employee.name},</p>
                    <p>Your payroll for the period <strong>${new Date(payroll.pay_period_start).toLocaleDateString()} to ${new Date(payroll.pay_period_end).toLocaleDateString()}</strong> has been processed and marked as <strong>paid</strong>.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                      <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Base Salary</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">$${parseFloat(payroll.base_salary).toLocaleString()}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Bonus</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">$${parseFloat(payroll.bonus).toLocaleString()}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Tax Deduction</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">$${parseFloat(payroll.tax_deduction).toLocaleString()}</td></tr>
                      <tr><td style="padding: 8px; font-weight: bold; color: #0f172a;">Net Pay</td><td style="padding: 8px; font-weight: bold; color: #10b981;">$${parseFloat(payroll.net_salary).toLocaleString()}</td></tr>
                    </table>
                    <p>You can view and download your full payslip from the HR Genie dashboard.</p>
                    <p style="color: #94a3b8; font-size: 13px;">— HR Genie</p>
                  </div>
                `;
                sendEmail(employee.email, 'Your Payroll Has Been Processed', emailHtml).catch(console.error);
            }
        }

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
