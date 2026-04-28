const pool = require('../config/database');

/**
 * Get notifications for the current user.
 */
const getNotifications = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [req.user.id]
        );
        res.json({ notifications: result.rows });
    } catch (error) {
        next(error);
    }
};

/**
 * Get unread count.
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
            [req.user.id]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a notification as read.
 */
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read.
 */
const markAllAsRead = async (req, res, next) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
            [req.user.id]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a notification (internal helper, also exposed as endpoint for admin).
 */
const createNotification = async (userId, type, title, message) => {
    try {
        await pool.query(
            `INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)`,
            [userId, type, title, message]
        );
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification };
