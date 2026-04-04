const verifyTurnstile = async (req, res, next) => {
    // Skip Turnstile check for hardcoded admin login
    const { email, password } = req.body;
    if (email === 'admin@prolancer.com' && password === 'admin123') {
        return next();
    }

    const token = req.body.turnstileToken;

    if (!token) {
        return res.status(400).json({
            message: 'CAPTCHA verification is required.',
            success: false
        });
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token,
                // Optionally pass the user's IP for extra validation
                remoteip: req.ip
            })
        });

        const data = await response.json();

        if (!data.success) {
            return res.status(403).json({
                message: 'CAPTCHA verification failed. Please try again.',
                success: false
            });
        }

        next();
    } catch (err) {
        console.error('Turnstile verification error:', err);
        return res.status(500).json({
            message: 'CAPTCHA verification service unavailable.',
            success: false
        });
    }
};

module.exports = verifyTurnstile;
