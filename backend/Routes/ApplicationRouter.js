const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const {
    submitApplication,
    getApplicationsByProject,
    getMyApplications,
    getApplicationById,
    updateApplicationStatus,
    getPendingApplicationsCount
} = require('../Controllers/ApplicationController');

// All routes require authentication
router.post('/', ensureAuthenticated, submitApplication);
router.get('/my', ensureAuthenticated, getMyApplications);
router.get('/pending/count', ensureAuthenticated, getPendingApplicationsCount); // Must come before /:id
router.get('/project/:projectId', ensureAuthenticated, getApplicationsByProject);
router.patch('/:id/status', ensureAuthenticated, updateApplicationStatus);
router.get('/:id', ensureAuthenticated, getApplicationById); // Parameterized route last

module.exports = router;
