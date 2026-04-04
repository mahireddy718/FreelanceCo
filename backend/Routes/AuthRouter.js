const router = require('express').Router();
const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');
const { signup, login, firebaseAuth, updateRole } = require('../Controllers/AuthController');
const { forgotPassword, verifyOTP, resetPassword } = require('../Controllers/PasswordResetController');
const ensureAuthenticated = require('../Middlewares/Auth');
const verifyTurnstile = require('../Middlewares/verifyTurnstile');

router.post('/login', loginValidation, verifyTurnstile, login);

router.post('/signup', signupValidation, signup);

router.post('/firebase-auth', firebaseAuth);

router.post('/update-role', ensureAuthenticated, updateRole);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;