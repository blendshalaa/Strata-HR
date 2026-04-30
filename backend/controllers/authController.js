const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');

const register = async (req, res, next) => {
  try {
    const { email, password, name, department, hire_date, org_name, invite_code } = req.body;
    const role = 'employee';

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    let orgId;
    let assignedRole = role;

    if (invite_code) {
      // Join existing org via invite code
      const orgResult = await pool.query('SELECT id FROM organizations WHERE invite_code = $1', [invite_code]);
      if (orgResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid invite code' });
      }
      orgId = orgResult.rows[0].id;
    } else if (org_name) {
      // Create a new organization — registering user becomes admin
      const slug = org_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newInviteCode = crypto.randomBytes(16).toString('hex');

      const existingOrg = await pool.query('SELECT id FROM organizations WHERE slug = $1', [slug]);
      if (existingOrg.rows.length > 0) {
        return res.status(409).json({ error: 'An organization with a similar name already exists' });
      }

      const orgResult = await pool.query(
        `INSERT INTO organizations (name, slug, invite_code) VALUES ($1, $2, $3) RETURNING id`,
        [org_name, slug, newInviteCode]
      );
      orgId = orgResult.rows[0].id;
      assignedRole = 'admin'; // Org creator is admin
    } else {
      return res.status(400).json({ error: 'Either org_name (to create new) or invite_code (to join existing) is required' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, department, role, hire_date, org_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, department, role, hire_date, sick_leave_balance, vacation_balance, org_id, created_at`,
      [email, password_hash, name, department, assignedRole, hire_date, orgId]
    );

    const user = result.rows[0];

    // Auto-generate onboarding tasks
    const standardTasks = [
      'Complete HR Profile and Personal Details',
      'Read the Employee Handbook',
      'Set up Direct Deposit for Payroll',
      'Provide Emergency Contact Information',
      'Schedule 1:1 with your Manager'
    ];
    const insertValues = [];
    const insertParams = [];
    standardTasks.forEach((taskName, idx) => {
      const p1 = idx * 3 + 1, p2 = idx * 3 + 2, p3 = idx * 3 + 3;
      insertValues.push(`($${p1}, $${p2}, $${p3})`);
      insertParams.push(user.id, taskName, orgId);
    });
    await pool.query(
      `INSERT INTO onboarding_tasks (user_id, task_name, org_id) VALUES ${insertValues.join(', ')}`,
      insertParams
    );

    // Fetch org name
    const orgInfo = await pool.query('SELECT name FROM organizations WHERE id = $1', [orgId]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, org_id: orgId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role,
        hire_date: user.hire_date,
        sick_leave_balance: user.sick_leave_balance,
        vacation_balance: user.vacation_balance,
        org_id: orgId,
        org_name: orgInfo.rows[0]?.name
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.name, u.department, u.role,
              u.hire_date, u.sick_leave_balance, u.vacation_balance, u.org_id,
              o.name as org_name
       FROM users u
       LEFT JOIN organizations o ON u.org_id = o.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, org_id: user.org_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role,
        hire_date: user.hire_date,
        sick_leave_balance: user.sick_leave_balance,
        vacation_balance: user.vacation_balance,
        org_id: user.org_id,
        org_name: user.org_name
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.department, u.role, u.hire_date,
              u.sick_leave_balance, u.vacation_balance, u.org_id, u.created_at,
              o.name as org_name
       FROM users u
       LEFT JOIN organizations o ON u.org_id = o.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };