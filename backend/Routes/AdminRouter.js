const router = require('express').Router();
const { getStats, getAllUsers, deleteUser, banUser, unbanUser, getUserGrowth, getFreelancers, getFreelancerStats, verifyFreelancer, unverifyFreelancer, getFreelancerDetails } = require('../Controllers/AdminController');
const ensureAdmin = require('../Middlewares/AdminAuth');

// Get admin statistics
router.get('/stats', ensureAdmin, getStats);

// User growth data for chart
router.get('/user-growth', ensureAdmin, getUserGrowth);

// User management routes
router.get('/users', ensureAdmin, getAllUsers);
router.delete('/users/:id', ensureAdmin, deleteUser);
router.post('/users/:id/ban', ensureAdmin, banUser);
router.post('/users/:id/unban', ensureAdmin, unbanUser);

// Freelancer management routes
router.get('/freelancers', ensureAdmin, getFreelancers);
router.get('/freelancers/stats', ensureAdmin, getFreelancerStats);
router.get('/freelancers/:id', ensureAdmin, getFreelancerDetails);
router.post('/freelancers/:id/verify', ensureAdmin, verifyFreelancer);
router.post('/freelancers/:id/unverify', ensureAdmin, unverifyFreelancer);

module.exports = router;
