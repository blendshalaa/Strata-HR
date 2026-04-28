const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');

const getDirectory = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, department, role, hire_date
       FROM users WHERE org_id = $1
       ORDER BY name ASC`,
      [req.user.org_id]
    );
    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { department, role } = req.query;

    let query = `
      SELECT id, email, name, department, role, hire_date, 
             sick_leave_balance, vacation_balance, created_at
      FROM users
      WHERE org_id = $1
    `;
    const params = [req.user.org_id];
    let paramCount = 2;

    if (req.user.role === 'hr') {
      query += ` AND role != 'admin'`;
    }

    if (department) {
      query += ` AND department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, email, name, department, role, hire_date,
              sick_leave_balance, vacation_balance, created_at
       FROM users WHERE id = $1 AND org_id = $2`,
      [id, req.user.org_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, department, role, sick_leave_balance, vacation_balance } = req.body;

    if (req.user.id !== parseInt(id) && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    if (req.user.role === 'hr') {
      const targetUser = await pool.query('SELECT role FROM users WHERE id = $1 AND org_id = $2', [id, req.user.org_id]);
      if (targetUser.rows.length > 0 && targetUser.rows[0].role === 'admin') {
        return res.status(403).json({ error: 'HR cannot edit Admin accounts' });
      }
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name) { updates.push(`name = $${paramCount}`); params.push(name); paramCount++; }
    if (department && ['admin', 'hr'].includes(req.user.role)) { updates.push(`department = $${paramCount}`); params.push(department); paramCount++; }
    if (role && req.user.role === 'admin') { updates.push(`role = $${paramCount}`); params.push(role); paramCount++; }
    if (sick_leave_balance !== undefined && ['admin', 'hr'].includes(req.user.role)) { updates.push(`sick_leave_balance = $${paramCount}`); params.push(sick_leave_balance); paramCount++; }
    if (vacation_balance !== undefined && ['admin', 'hr'].includes(req.user.role)) { updates.push(`vacation_balance = $${paramCount}`); params.push(vacation_balance); paramCount++; }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);
    params.push(req.user.org_id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} AND org_id = $${paramCount + 1} RETURNING *`;
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    if (req.user.role === 'hr') {
      const targetUser = await pool.query('SELECT role FROM users WHERE id = $1 AND org_id = $2', [id, req.user.org_id]);
      if (targetUser.rows.length > 0 && targetUser.rows[0].role === 'admin') {
        return res.status(403).json({ error: 'HR cannot delete Admin accounts' });
      }
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND org_id = $2 RETURNING id, name, email',
      [id, req.user.org_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete user with associated records. Remove their records first.' });
    }
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, department, role, hire_date } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const currentOrgId = req.user.org_id;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, department, role, hire_date, org_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role`,
      [name, email, password_hash, department, role, hire_date, currentOrgId]
    );

    const orgRes = await pool.query('SELECT name FROM organizations WHERE id = $1', [currentOrgId]);
    const orgName = orgRes.rows[0]?.name || 'the organization';

    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2>Welcome to ${orgName}!</h2>
        <p>Hi ${name},</p>
        <p>An account has been created for you on HR Genie.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Login email:</strong> ${email}</p>
          <p style="margin: 0;"><strong>Temporary password:</strong> ${password}</p>
        </div>
        <p>Please <a href="${loginUrl}" style="color: #4f46e5; text-decoration: none; font-weight: bold;">click here to log in</a> and change your password immediately.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">— HR Genie</p>
      </div>
    `;
    sendEmail(email, `Your HR Genie Account for ${orgName}`, emailHtml).catch(console.error);

    res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const inviteUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const currentOrgId = req.user.org_id;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const orgRes = await pool.query('SELECT name, invite_code FROM organizations WHERE id = $1', [currentOrgId]);
    const org = orgRes.rows[0];

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const registerUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?invite=${org.invite_code}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2>You're invited to join ${org.name}!</h2>
        <p>Hi there,</p>
        <p>You've been invited by HR to join <strong>${org.name}</strong> on HR Genie.</p>
        <p>Click the link below to create your account. Your organization's invite code will be automatically applied.</p>
        <p style="margin: 25px 0;">
          <a href="${registerUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
        </p>
        <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${registerUrl}</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">— HR Genie</p>
      </div>
    `;

    // We await this so we can confirm the invite was actually sent
    const success = await sendEmail(email, `Invitation to join ${org.name} on HR Genie`, emailHtml);
    if (!success) {
      return res.status(500).json({ error: 'Failed to send invite email' });
    }

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDirectory, getAllUsers, getUserById, updateUser, deleteUser, createUser, inviteUser };