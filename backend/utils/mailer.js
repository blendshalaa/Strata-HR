const nodemailer = require('nodemailer');
require('dotenv').config();

// Standard SMTP Transporter configured from .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send an email using the configured SMTP transporter
 * 
 * @param {string} to - The recipient's email address
 * @param {string} subject - The subject line
 * @param {string} html - The HTML body content
 */
const sendEmail = async (to, subject, html) => {
    try {
        // Skip actual sending if SMTP is not configured (e.g., in local dev before setup)
        if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
            console.log(`[MAILER MOCK] Email skipped (SMTP not configured). To: ${to} | Subject: ${subject}`);
            return true;
        }

        const info = await transporter.sendMail({
            from: `"HR Genie System" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        
        console.log(`[MAILER] Message sent successfully: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[MAILER ERROR] Failed to send email:', error);
        return false;
    }
};

module.exports = {
    sendEmail
};
