const express = require('express');
const { improveDescription, scoreApplicationAPI, supportAssistantAPI } = require('../Controllers/AIController');
const ensureAuthenticated = require('../Middlewares/Auth');

const router = express.Router();

// POST /api/ai/improve-description
router.post('/improve-description', ensureAuthenticated, improveDescription);

// POST /api/ai/score-application
router.post('/score-application', ensureAuthenticated, scoreApplicationAPI);

// POST /api/ai/support-assistant
router.post('/support-assistant', supportAssistantAPI);

module.exports = router;
