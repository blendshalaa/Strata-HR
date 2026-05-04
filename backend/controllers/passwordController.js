const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');

/**
 * Request password reset — generates a token and stores it.
 * In production this would email the link; here we store the token for the frontend flow.
 */
const requestReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        // Always return success to prevent email enumeration
        if (user.rows.length === 0) {
            return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
            [token, expires, user.rows[0].id]
        );

        // In production: send email with reset link containing token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 500px;">
            <h2>Password Reset Request</h2>
            <p>Hi,</p>
            <p>You requested a password reset for your HR Genie account. Click the button below to set a new password:</p>
            <p style="margin: 25px 0;">
              <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </p>
            <p style="color: #64748b; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">— HR Genie</p>
          </div>
        `;
        sendEmail(email, 'Password Reset — HR Genie', emailHtml).catch(console.error);

        res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password using a valid token.
 */
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const user = await pool.query(
            `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP`,
            [token]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        await pool.query(
            `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
            [password_hash, user.rows[0].id]
        );

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Change password (authenticated user changing their own password).
 */
const changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) return res.status(400).json({ error: 'Current and new passwords are required' });
        if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

        const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(current_password, user.rows[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

        const password_hash = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { requestReset, resetPassword, changePassword };
