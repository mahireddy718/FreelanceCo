const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} = require('../Controllers/NotificationController');

// Get unread count - must be before /:id to avoid treating 'unread-count' as an id
router.get('/unread-count', ensureAuthenticated, getUnreadCount);

// Mark all as read - must be before /:id
router.patch('/read-all', ensureAuthenticated, markAllAsRead);

// Get notifications
router.get('/', ensureAuthenticated, getNotifications);

// Mark notification as read
router.patch('/:id/read', ensureAuthenticated, markAsRead);

// Delete notification
router.delete('/:id', ensureAuthenticated, deleteNotification);

module.exports = router;
