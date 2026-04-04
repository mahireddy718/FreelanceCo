const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const {
    createOrder,
    verifyPayment,
    handleWebhook,
    getPaymentHistory,
    getPaymentByProject,
    releaseEscrowPayment
} = require('../Controllers/PaymentController');

// Protected routes (require authentication)
router.post('/create-order', ensureAuthenticated, createOrder);
router.post('/verify', ensureAuthenticated, verifyPayment);
router.post('/release-escrow/:paymentId', ensureAuthenticated, releaseEscrowPayment);
router.get('/history', ensureAuthenticated, getPaymentHistory);
router.get('/project/:projectId', ensureAuthenticated, getPaymentByProject);

// Webhook route (no authentication - verified by signature)
router.post('/webhook', handleWebhook);

module.exports = router;
