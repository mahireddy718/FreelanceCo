const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const {
    getSettings,
    updateProfileInfo,
    updateSkills,
    changeEmail,
    changePassword,
    updateNotifications,
    updatePrivacySettings
} = require('../Controllers/SettingsController');

// All settings routes require authentication
router.use(ensureAuthenticated);

// Get all settings
router.get('/', getSettings);

// Update profile information
router.put('/profile', updateProfileInfo);

// Update skills and professional details
router.put('/skills', updateSkills);

// Change email (requires current password)
router.put('/email', changeEmail);

// Change password
router.put('/password', changePassword);

// Update notification settings
router.put('/notifications', updateNotifications);

// Update privacy settings
router.put('/privacy', updatePrivacySettings);

module.exports = router;
