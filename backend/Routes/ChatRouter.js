const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const {
    createConversation,
    getConversations,
    getConversationById,
    sendMessage,
    markAsRead,
    deleteMessage
} = require('../Controllers/ChatController');

// All routes require authentication
router.post('/conversations', ensureAuthenticated, createConversation);
router.get('/conversations', ensureAuthenticated, getConversations);
router.get('/conversations/:id', ensureAuthenticated, getConversationById);
router.post('/messages', ensureAuthenticated, sendMessage);
router.patch('/messages/read', ensureAuthenticated, markAsRead);
router.delete('/messages/:messageId', ensureAuthenticated, deleteMessage);

module.exports = router;
