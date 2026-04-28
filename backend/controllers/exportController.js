const pool = require('../config/database');

const exportPayroll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT p.id, u.name as employee_name, u.email, p.base_salary, p.bonus, 
              p.tax_deduction, p.net_salary, p.pay_period_start, p.pay_period_end, p.status, p.created_at
       FROM payroll p JOIN users u ON p.user_id = u.id
       WHERE p.org_id = $1
       ORDER BY p.pay_period_end DESC`,
            [req.user.org_id]
        );

        const headers = ['ID', 'Employee', 'Email', 'Base Salary', 'Bonus', 'Tax Deduction', 'Net Salary', 'Period Start', 'Period End', 'Status', 'Created'];
        const rows = result.rows.map(r => [
            r.id, r.employee_name, r.email, r.base_salary, r.bonus,
            r.tax_deduction, r.net_salary, r.pay_period_start, r.pay_period_end, r.status, r.created_at
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v ?? ''}"`).join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=payroll_export.csv');
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

const exportTimesheets = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT t.id, u.name as employee_name, u.department, t.clock_in, t.clock_out, 
              t.regular_hours, t.overtime_hours, t.status
       FROM timesheets t JOIN users u ON t.user_id = u.id
       WHERE t.org_id = $1
       ORDER BY t.clock_in DESC`,
            [req.user.org_id]
        );

        const headers = ['ID', 'Employee', 'Department', 'Clock In', 'Clock Out', 'Regular Hours', 'Overtime Hours', 'Status'];
        const rows = result.rows.map(r => [
            r.id, r.employee_name, r.department, r.clock_in, r.clock_out,
            r.regular_hours, r.overtime_hours, r.status
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v ?? ''}"`).join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=timesheets_export.csv');
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

const exportLeave = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT lr.id, u.name as employee_name, lr.type, lr.start_date, lr.end_date, 
              lr.reason, lr.status, lr.created_at
       FROM leave_requests lr JOIN users u ON lr.user_id = u.id
       WHERE lr.org_id = $1
       ORDER BY lr.created_at DESC`,
            [req.user.org_id]
        );

        const headers = ['ID', 'Employee', 'Type', 'Start Date', 'End Date', 'Reason', 'Status', 'Created'];
        const rows = result.rows.map(r => [
            r.id, r.employee_name, r.type, r.start_date, r.end_date,
            r.reason, r.status, r.created_at
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leave_export.csv');
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

module.exports = { exportPayroll, exportTimesheets, exportLeave };
