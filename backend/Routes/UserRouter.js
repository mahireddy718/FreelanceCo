const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const optionalAuth = require('../Middlewares/OptionalAuth');
const {
    getProfile,
    getUserById,
    getUserByUsername,
    updateProfile,
    addPortfolioItem,
    removePortfolioItem,
    searchFreelancers,
    searchUsersForChat,
    getActiveProjectsCount,
    deleteAccount
} = require('../Controllers/UserController');

// Get current user profile (protected)
router.get('/me', ensureAuthenticated, getProfile);

// Update profile (protected)
router.put('/profile', ensureAuthenticated, updateProfile);

// Portfolio management (protected)
router.post('/portfolio', ensureAuthenticated, addPortfolioItem);
router.delete('/portfolio/:itemId', ensureAuthenticated, removePortfolioItem);

// Account management (protected)
router.get('/active-projects-count', ensureAuthenticated, getActiveProjectsCount);
router.delete('/delete-account', ensureAuthenticated, deleteAccount);
router.get('/search/chat', ensureAuthenticated, searchUsersForChat);

// Public routes
router.get('/search', searchFreelancers);
router.get('/username/:username', optionalAuth, getUserByUsername);
router.get('/:id', getUserById);

module.exports = router;
