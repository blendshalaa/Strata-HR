const pool = require('../config/database');
const { createNotification } = require('./notificationController');
const { sendEmail } = require('../utils/mailer');

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
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
      [userId, type, start_date, end_date, days, reason, req.user.org_id]
    );

    await pool.query(
      'INSERT INTO analytics_logs (user_id, action_type, metadata, org_id) VALUES ($1, $2, $3, $4)',
      [userId, 'leave_request', JSON.stringify({ type, days }), req.user.org_id]
    );

    const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const employeeName = userRes.rows[0]?.name || 'An employee';

    const hrEmail = process.env.HR_EMAIL_ADDRESS || 'hr@hrgenie.example.com';
    const emailHtml = `
        <h2>New Leave Request Requires Approval</h2>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)} Leave</p>
        <p><strong>Duration:</strong> ${days} Day(s) (${new Date(start_date).toLocaleDateString()} - ${new Date(end_date).toLocaleDateString()})</p>
        <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
        <hr>
        <p>Please log in to the HR Genie dashboard to approve or reject this request.</p>
    `;
    sendEmail(hrEmail, `Pending Leave Request: ${employeeName}`, emailHtml).catch(console.error);

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
        const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 500px;">
            <h2 style="color: ${statusColor};">Leave Request ${statusLabel}</h2>
            <p>Hi ${emp.name},</p>
            <p>Your <strong>${request.type}</strong> leave request has been <strong style="color: ${statusColor};">${status}</strong> by ${approverName}.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Type</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${request.type.charAt(0).toUpperCase() + request.type.slice(1)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Duration</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${request.days} day(s)</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Period</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(request.start_date).toLocaleDateString()} – ${new Date(request.end_date).toLocaleDateString()}</td></tr>
            </table>
            <p style="color: #94a3b8; font-size: 13px;">— HR Genie System</p>
          </div>
        `;
        sendEmail(emp.email, `Leave Request ${statusLabel} – ${request.days} day(s) ${request.type}`, emailHtml).catch(console.error);
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