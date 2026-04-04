const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const {
    createProject,
    getAllProjects,
    getProjectById,
    getMyProjects,
    updateProject,
    deleteProject,
    getProjectWorkspace,
    updateWorkStatus,
    submitWork,
    acceptProject,
    requestReview,
    addMilestone,
    updateMilestone,
    addDeliverable,
    deleteDeliverable,
    addWorkNote,
    updateProgress
} = require('../Controllers/ProjectController');

// Public routes
router.get('/', getAllProjects);
router.get('/:id', getProjectById);

// Protected routes
router.post('/', ensureAuthenticated, createProject);
router.get('/my/projects', ensureAuthenticated, getMyProjects);
router.put('/:id', ensureAuthenticated, updateProject);
router.delete('/:id', ensureAuthenticated, deleteProject);

// Workspace routes (protected)
router.get('/:id/workspace', ensureAuthenticated, getProjectWorkspace);
router.patch('/:id/work-status', ensureAuthenticated, updateWorkStatus);
router.post('/:id/submit-work', ensureAuthenticated, submitWork);
router.post('/:id/accept-project', ensureAuthenticated, acceptProject);
router.post('/:id/request-review', ensureAuthenticated, requestReview);
router.post('/:id/milestones', ensureAuthenticated, addMilestone);
router.patch('/:id/milestones/:milestoneId', ensureAuthenticated, updateMilestone);
router.post('/:id/deliverables', ensureAuthenticated, addDeliverable);
router.delete('/:id/deliverables/:deliverableId', ensureAuthenticated, deleteDeliverable);
router.post('/:id/work-notes', ensureAuthenticated, addWorkNote);
router.patch('/:id/progress', ensureAuthenticated, updateProgress);

module.exports = router;
