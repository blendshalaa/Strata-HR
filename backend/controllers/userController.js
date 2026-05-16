const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { sendEmail } = require('../utils/mailer');
const { newEmployeeRegistered } = require('../utils/emailTemplates');

const getDirectory = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, department, role, hire_date, profile_picture
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
             sick_leave_balance, vacation_balance, created_at, profile_picture
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
              sick_leave_balance, vacation_balance, created_at, profile_picture
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
    const { name, department, role, sick_leave_balance, vacation_balance, hire_date } = req.body;

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
    if (department !== undefined && ['admin', 'hr'].includes(req.user.role)) { updates.push(`department = $${paramCount}`); params.push(department || null); paramCount++; }
    if (role && req.user.role === 'admin') { updates.push(`role = $${paramCount}`); params.push(role); paramCount++; }
    if (hire_date !== undefined && ['admin', 'hr'].includes(req.user.role)) { updates.push(`hire_date = $${paramCount}`); params.push(hire_date || null); paramCount++; }
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

    // Generate a 24h set-password token so we NEVER send a plaintext password by email
    const setPasswordToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [setPasswordToken, tokenExpiry, result.rows[0].id]
    );

    const setPasswordUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${setPasswordToken}`;

    // Branded welcome email — no plaintext password
    const welcomeTmpl = {
      subject: `Welcome to ${orgName} — Set Your Password`,
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
<tr><td style="background:#18181b;padding:20px 32px;"><span style="color:#fff;font-size:18px;font-weight:700;">HR Genie</span></td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">Welcome to ${orgName}!</h2>
<p style="color:#52525b;font-size:14px;line-height:1.6;">Hi <strong>${name}</strong>,<br/>An HR Genie account has been created for you. Click the button below to set your password and access your account.</p>
<p style="margin:24px 0;"><a href="${setPasswordUrl}" style="background:#18181b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;display:inline-block;">Set Your Password</a></p>
<p style="font-size:12px;color:#a1a1aa;">This link expires in 24 hours. If you did not expect this email, please contact your HR team.</p>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #f4f4f5;background:#fafafa;"><p style="margin:0;font-size:12px;color:#a1a1aa;">Automated message from HR Genie. Do not reply.</p></td></tr>
</table></td></tr></table></body></html>`
    };
    sendEmail(email, welcomeTmpl.subject, welcomeTmpl.html).catch(console.error);

    // Notify HR users in org that a new employee registered
    try {
      const hrUsers = await pool.query(
        `SELECT email FROM users WHERE org_id = $1 AND role IN ('hr','admin') AND id != $2`,
        [currentOrgId, req.user.id]
      );
      const hrTmpl = newEmployeeRegistered({ newEmployeeName: name, newEmployeeEmail: email, orgName });
      hrUsers.rows.forEach(u => sendEmail(u.email, hrTmpl.subject, hrTmpl.html).catch(console.error));
    } catch (e) { console.error('HR notification failed:', e); }

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

    const inviteHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
<tr><td style="background:#18181b;padding:20px 32px;"><span style="color:#fff;font-size:18px;font-weight:700;">HR Genie</span></td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">You're invited to join ${org.name}</h2>
<p style="color:#52525b;font-size:14px;line-height:1.6;">Hi there,<br/>You've been invited by HR to join <strong>${org.name}</strong> on HR Genie. Click the button below — your invite code will be applied automatically.</p>
<p style="margin:24px 0;"><a href="${registerUrl}" style="background:#18181b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;display:inline-block;">Accept Invitation</a></p>
<p style="font-size:12px;color:#a1a1aa;">Or copy this link: ${registerUrl}</p>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #f4f4f5;background:#fafafa;"><p style="margin:0;font-size:12px;color:#a1a1aa;">Automated message from HR Genie. Do not reply.</p></td></tr>
</table></td></tr></table></body></html>`;

    const success = await sendEmail(email, `Invitation to join ${org.name} — HR Genie`, inviteHtml);
    if (!success) {
      return res.status(500).json({ error: 'Failed to send invite email' });
    }

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload or replace the authenticated user's profile picture.
 * Any authenticated user can update their own avatar.
 * HR/admin can also update other users' avatars via ?userId=<id>.
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Determine target user — defaults to self
    const targetId = req.query.userId && ['admin', 'hr'].includes(req.user.role)
      ? parseInt(req.query.userId)
      : req.user.id;

    // Verify target belongs to same org
    const userCheck = await pool.query(
      'SELECT id, profile_picture FROM users WHERE id = $1 AND org_id = $2',
      [targetId, req.user.org_id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old Cloudinary image if present
    const oldPic = userCheck.rows[0].profile_picture;
    if (oldPic && oldPic.includes('res.cloudinary.com')) {
      try {
        const uploadIndex = oldPic.indexOf('/upload/');
        if (uploadIndex !== -1) {
          const afterUpload = oldPic.substring(uploadIndex + 8);
          const withoutVersion = afterUpload.replace(/^v\d+\//, '');
          const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
          cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
        }
      } catch (e) { /* ignore */ }
    }

    const avatarUrl = req.file.path; // Cloudinary secure URL

    await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2 AND org_id = $3',
      [avatarUrl, targetId, req.user.org_id]
    );

    res.json({ message: 'Profile picture updated successfully', profile_picture: avatarUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove the authenticated user's profile picture.
 */
const deleteAvatar = async (req, res, next) => {
  try {
    const targetId = req.query.userId && ['admin', 'hr'].includes(req.user.role)
      ? parseInt(req.query.userId)
      : req.user.id;

    const userCheck = await pool.query(
      'SELECT id, profile_picture FROM users WHERE id = $1 AND org_id = $2',
      [targetId, req.user.org_id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldPic = userCheck.rows[0].profile_picture;
    if (oldPic && oldPic.includes('res.cloudinary.com')) {
      try {
        const uploadIndex = oldPic.indexOf('/upload/');
        if (uploadIndex !== -1) {
          const afterUpload = oldPic.substring(uploadIndex + 8);
          const withoutVersion = afterUpload.replace(/^v\d+\//, '');
          const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
          cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
        }
      } catch (e) { /* ignore */ }
    }

    await pool.query(
      'UPDATE users SET profile_picture = NULL WHERE id = $1 AND org_id = $2',
      [targetId, req.user.org_id]
    );

    res.json({ message: 'Profile picture removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDirectory, getAllUsers, getUserById, updateUser, deleteUser, createUser, inviteUser, uploadAvatar, deleteAvatar };