const express = require('express');
const router = express.Router();
const {
    getAllEvents,
    createEvent,
    deleteEvent
} = require('../controllers/eventController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, getAllEvents);
router.post('/', authenticateToken, authorizeRoles('admin', 'hr'), createEvent);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'hr'), deleteEvent);

module.exports = router;
