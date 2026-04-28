const pool = require('../config/database');

const getAllEvents = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT * FROM calendar_events WHERE org_id = $1 ORDER BY event_date ASC`,
            [req.user.org_id]
        );
        res.json({ events: result.rows });
    } catch (error) {
        next(error);
    }
};

const createEvent = async (req, res, next) => {
    try {
        const { title, description, event_date, attendees } = req.body;
        const created_by = req.user.id;
        if (!title || !event_date) {
            return res.status(400).json({ error: 'Title and event_date are required' });
        }
        const result = await pool.query(
            `INSERT INTO calendar_events (title, description, event_date, attendees, created_by, org_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, description || '', event_date, JSON.stringify(attendees || []), created_by, req.user.org_id]
        );
        res.status(201).json({ event: result.rows[0] });
    } catch (error) {
        next(error);
    }
};

const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `DELETE FROM calendar_events WHERE id = $1 AND org_id = $2 RETURNING *`,
            [id, req.user.org_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllEvents, createEvent, deleteEvent };
