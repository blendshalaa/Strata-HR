const pool = require('../config/database');
const { createNotification } = require('./notificationController');
const { sendEmail } = require('../utils/mailer');
const { leaveSubmitted, leaveDecision } = require('../utils/emailTemplates');
const { logAudit, getClientIP } = require('../middleware/auditLogger');

const getMyLeaveRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT lr.*, u.name as approver_name
       FROM leave_requests lr
       LEFT JOIN users u ON lr.approved_by = u.id
       WHERE lr.user_id = $1 AND lr.org_id = $2
       ORDER BY lr.created_at DESC`,
      [userId, req.user.org_id]
    );
    res.json({ leave_requests: result.rows });
  } catch (error) {
    next(error);
  }
};

const getAllLeaveRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT lr.*, u.name as employee_name, u.department, approver.name as approver_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      WHERE lr.org_id = $1
    `;
    const params = [req.user.org_id];
    if (status) {
      query += ' AND lr.status = $2';
      params.push(status);
    }
    query += ' ORDER BY lr.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ leave_requests: result.rows });
  } catch (error) {
    next(error);
  }
};

const createLeaveRequest = async (req, res, next) => {
  try {
    const { type, start_date, end_date, reason } = req.body;
    const userId = req.user.id;

    if (!type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Type, start_date, and end_date are required' });
    }
    if (!['sick', 'vacation', 'personal'].includes(type)) {
      return res.status(400).json({ error: 'Invalid leave type' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const userBalance = await pool.query(
      'SELECT sick_leave_balance, vacation_balance FROM users WHERE id = $1',
      [userId]
    );
    const balance = userBalance.rows[0];

    if (type === 'sick' && balance.sick_leave_balance < days) {
      return res.status(400).json({ error: 'Insufficient sick leave balance', current_balance: balance.sick_leave_balance, requested_days: days });
    }
    if ((type === 'vacation' || type === 'personal') && balance.vacation_balance < days) {
      return res.status(400).json({ error: `Insufficient ${type} leave balance`, current_balance: balance.vacation_balance, requested_days: days });
    }

    const result = await pool.query(
      `INSERT INTO leave_requests (user_id, type, start_date, end_date, days, reason, status, org_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING id, user_id, type, start_date, end_date, days, reason, status, org_id, created_at`,
      [userId, type, start_date, end_date, days, reason, req.user.org_id]
    );

    // Fire-and-forget side-effects (analytics + notifications + email + audit)
    // Wrapped so a failure here never causes a 500 after the leave request is already saved.
    try {
      await pool.query(
        'INSERT INTO analytics_logs (user_id, action_type, metadata, org_id) VALUES ($1, $2, $3, $4)',
        [userId, 'leave_request', JSON.stringify({ type, days }), req.user.org_id]
      );
    } catch (e) { console.error('Analytics log failed (non-fatal):', e.message); }

    // Audit trail
    logAudit({
      actorId: userId, action: 'create', entityType: 'leave_request',
      entityId: result.rows[0].id, newValue: result.rows[0],
      ipAddress: getClientIP(req), orgId: req.user.org_id,
    });

    const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
    const employeeName = userRes.rows[0]?.name || 'An employee';

    try {
      const hrEmail = process.env.HR_EMAIL_ADDRESS || 'hr@hrgenie.example.com';
      const tmpl = leaveSubmitted({
          employeeName,
          type,
          days,
          startDate: start_date,
          endDate: end_date,
          reason,
          dashboardUrl: `${process.env.APP_URL || 'https://hrgenie.app'}/leave/approvals`,
      });
      sendEmail(hrEmail, tmpl.subject, tmpl.html).catch(console.error);
    } catch (e) { console.error('Leave email failed (non-fatal):', e.message); }

    // In-app notif to all HR/admin users in the org
    try {
        const hrUsers = await pool.query(
            `SELECT id FROM users WHERE org_id = $1 AND role IN ('hr', 'admin')`,
            [req.user.org_id]
        );
        await Promise.all(hrUsers.rows.map(u =>
            createNotification(u.id, 'leave',
                'New Leave Request',
                `${employeeName} requested ${days} day${days !== 1 ? 's' : ''} of ${type} leave.`
            )
        ));
    } catch (e) { console.error('Failed to notify HR users:', e.message); }


    res.status(201).json({ message: 'Leave request submitted successfully', leave_request: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const updateLeaveRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const approverId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const leaveRequest = await pool.query(
      'SELECT * FROM leave_requests WHERE id = $1 AND org_id = $2',
      [id, req.user.org_id]
    );
    if (leaveRequest.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const request = leaveRequest.rows[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request has already been processed' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE leave_requests SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [status, approverId, id]
      );

      if (status === 'approved') {
        const balanceField = request.type === 'sick' ? 'sick_leave_balance' : 'vacation_balance';
        await client.query(
          `UPDATE users SET ${balanceField} = ${balanceField} - $1 WHERE id = $2`,
          [request.days, request.user_id]
        );
      }

      await client.query('COMMIT');

      const updated = await pool.query('SELECT * FROM leave_requests WHERE id = $1', [id]);

      // Audit trail — record approval/rejection
      logAudit({
        actorId: approverId, action: status === 'approved' ? 'approve' : 'reject',
        entityType: 'leave_request', entityId: parseInt(id),
        oldValue: { status: 'pending' }, newValue: { status, approved_by: approverId },
        ipAddress: getClientIP(req), orgId: req.user.org_id,
      });


      await createNotification(
        request.user_id,
        'leave',
        `Leave request ${status}`,
        `Your ${request.type} leave request (${request.days} days) has been ${status}.`
      );

      // Email the employee about the decision
      const empRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [request.user_id]);
      const emp = empRes.rows[0];
      if (emp?.email) {
        const approverRes = await pool.query('SELECT name FROM users WHERE id = $1', [approverId]);
        const approverName = approverRes.rows[0]?.name || 'HR';
        const tmpl = leaveDecision({
            employeeName: emp.name,
            type: request.type,
            days: request.days,
            startDate: request.start_date,
            endDate: request.end_date,
            status,
            approverName,
        });
        sendEmail(emp.email, tmpl.subject, tmpl.html).catch(console.error);
      }

      res.json({ message: `Leave request ${status} successfully`, leave_request: updated.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

const getLeaveBalance = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT sick_leave_balance, vacation_balance FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ balance: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyLeaveRequests, getAllLeaveRequests, createLeaveRequest, updateLeaveRequestStatus, getLeaveBalance };