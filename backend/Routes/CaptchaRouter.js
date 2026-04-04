const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for CAPTCHA sessions (for production, use Redis or database)
const captchaSessions = new Map();

// Clean up expired CAPTCHAs older than 10 minutes
setInterval(() => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [id, session] of captchaSessions.entries()) {
        if (session.timestamp < tenMinutesAgo) {
            captchaSessions.delete(id);
        }
    }
}, 60000); // Run every minute

// Generate CAPTCHA
router.get('/generate', (req, res) => {
    try {
        const captcha = svgCaptcha.create({ //createMathExpr
            size: 4, // 6 characters
            noise: 6, // Number of noise lines
            color: true, // Use color
            ignoreChars: '0o1il',
            background: '#f9fafb', // Light gray background
            width: 200,
            height: 50,
        });

        const captchaId = uuidv4();

        // Store CAPTCHA text with ID and timestamp
        captchaSessions.set(captchaId, {
            text: captcha.text,
            timestamp: Date.now()
        });

        res.json({
            success: true,
            captchaId,
            captchaSvg: captcha.data
        });
    } catch (error) {
        console.error('Error generating CAPTCHA:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate CAPTCHA'
        });
    }
});

// Verify CAPTCHA
router.post('/verify', (req, res) => {
    try {
        const { captchaId, answer } = req.body;

        if (!captchaId || !answer) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA ID and answer are required'
            });
        }

        const session = captchaSessions.get(captchaId);

        if (!session) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA expired or invalid'
            });
        }

        // Check if CAPTCHA is expired (10 minutes)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        if (session.timestamp < tenMinutesAgo) {
            captchaSessions.delete(captchaId);
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA expired'
            });
        }

        // Verify answer (case-sensitive)
        const isCorrect = session.text === answer.trim();

        if (isCorrect) {
            // Remove CAPTCHA after successful verification
            captchaSessions.delete(captchaId);
            return res.json({
                success: true,
                message: 'CAPTCHA verified successfully'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Incorrect CAPTCHA'
            });
        }
    } catch (error) {
        console.error('Error verifying CAPTCHA:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify CAPTCHA'
        });
    }
});

module.exports = router;
