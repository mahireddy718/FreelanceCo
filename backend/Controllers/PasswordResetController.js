const UserModel = require('../Models/User');
const { sendOTPEmail } = require('../services/emailService');
const { generateOTP, storeOTP } = require('../services/otpService');
const bcrypt = require('bcrypt');

// Request OTP - accepts username or email
const forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body; // Can be email or username

        if (!identifier) {
            return res.status(400).json({
                message: 'Please provide email or username',
                success: false
            });
        }

        // Find user by email or username
        const user = await UserModel.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: 'No account found with this email or username',
                success: false
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Store OTP in Redis with 10-minute TTL (auto-expires)
        await storeOTP(user.email, otp, 600); // 600 seconds = 10 minutes

        // Send OTP email
        try {
            await sendOTPEmail(user.email, user.name, otp);

            res.status(200).json({
                message: 'OTP sent to your email successfully',
                success: true,
                email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for privacy
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            return res.status(500).json({
                message: 'Failed to send OTP email. Please try again.',
                success: false
            });
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({
                message: 'Email/username and OTP are required',
                success: false
            });
        }

        // Find user
        const user = await UserModel.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Get OTP from Redis
        const { getOTP } = require('../services/otpService');
        const storedOTP = await getOTP(user.email);

        console.log(`[PasswordReset] Verifying OTP for user: ${user.email}`);
        console.log(`[PasswordReset] Received OTP from request: "${otp}"`);
        console.log(`[PasswordReset] Retrieved OTP from Redis: "${storedOTP}"`);

        // Check if OTP exists (Redis auto-deletes expired OTPs)
        if (!storedOTP) {
            return res.status(400).json({
                message: 'No OTP request found. Please request a new OTP.',
                success: false
            });
        }

        // Verify OTP using bcrypt comparison (since OTP is stored as a hash)
        const storedOTPHash = String(storedOTP).trim();
        const inputOTPStr = String(otp).trim();

        if (!bcrypt.compareSync(inputOTPStr, storedOTPHash)) {
            // console.log(`[PasswordReset] OTP mismatch: Input OTP does not match stored hash`);
            return res.status(400).json({
                message: 'Invalid OTP. Please try again.',
                success: false
            });
        }

        // console.log(`[PasswordReset] OTP verified successfully for ${user.email}`);

        // OTP is valid
        res.status(200).json({
            message: 'OTP verified successfully',
            success: true,
            email: user.email
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Reset password with verified OTP
const resetPassword = async (req, res) => {
    try {
        const { identifier, otp, newPassword } = req.body;

        if (!identifier || !otp || !newPassword) {
            return res.status(400).json({
                message: 'All fields are required',
                success: false
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long',
                success: false
            });
        }

        // Find user
        const user = await UserModel.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Verify OTP using Redis service (auto-deletes on success)
        const { verifyOTP } = require('../services/otpService');
        const isValid = await verifyOTP(user.email, otp);

        if (!isValid) {
            return res.status(400).json({
                message: 'Invalid or expired OTP',
                success: false
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password (OTP already deleted by verifyOTP)
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: 'Password reset successfully',
            success: true
        });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

module.exports = {
    forgotPassword,
    verifyOTP,
    resetPassword
};
