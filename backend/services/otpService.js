const redis = require('../config/redisClient');
const bcrypt = require('bcrypt');

/**
 * OTP Service - Centralized OTP management using Upstash Redis
 * Features:
 * - Fast in-memory storage for sub-millisecond access
 * - Auto-expiration via Redis TTL (no manual cleanup needed)
 * - Secure and scalable OTP storage
 */

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP in Redis with TTL (Time-To-Live)
 * @param {string} identifier - User identifier (email or username)
 * @param {string} otp - Generated OTP
 * @param {number} expirySeconds - TTL in seconds (default: 600 = 10 minutes)
 * @returns {Promise<void>}
 */
const storeOTP = async (identifier, otp, expirySeconds = 600) => {
    try {
        const key = `otp:password-reset:${identifier.toLowerCase()}`;
        const hashedOtp = bcrypt.hashSync(otp, 10);
        // Store OTP with TTL - Redis will auto-delete after expiry
        await redis.set(key, hashedOtp, { ex: expirySeconds });
        console.log(`✓ OTP stored in Redis for ${identifier} with ${expirySeconds}s TTL`);
    } catch (error) {
        console.error('Error storing OTP in Redis:', error);
        throw new Error('Failed to store OTP');
    }
};

/**
 * Get OTP from Redis
 * @param {string} identifier - User identifier (email or username)
 * @returns {Promise<string|null>} OTP if exists and not expired, null otherwise
 */
const getOTP = async (identifier) => {
    try {
        const key = `otp:password-reset:${identifier.toLowerCase()}`;
        const hashedOtp = await redis.get(key);
        return hashedOtp;
    } catch (error) {
        console.error('Error retrieving OTP from Redis:', error);
        throw new Error('Failed to retrieve OTP');
    }
};

/**
 * Verify OTP and delete it from Redis on success
 * @param {string} identifier - User identifier (email or username)
 * @param {string} otp - OTP to verify
 * @returns {Promise<boolean>} true if OTP matches, false otherwise
 */
const verifyOTP = async (identifier, otp) => {
    try {
        const hashedStoredOTP = await getOTP(identifier);

        // console.log(`[OTP Debug] Verifying OTP for ${identifier}`);
        // console.log(`[OTP Debug] Stored OTP: "${storedOTP}" (type: ${typeof storedOTP})`);
        // console.log(`[OTP Debug] Input OTP: "${otp}" (type: ${typeof otp})`);

        if (!hashedStoredOTP) {
            // console.log(`[OTP Debug] No OTP found in Redis`);
            return false;
        }

        // Ensure both are strings and trimmed for comparison
        const hashedStoredOTPStr = String(hashedStoredOTP).trim();
        const inputOTPStr = String(otp).trim();

        // console.log(`[OTP Debug] Comparing input OTP with stored hash`);

        // Compare plain text OTP with the stored hash
        if (bcrypt.compareSync(inputOTPStr, hashedStoredOTPStr)) {
            // OTP matches - delete it from Redis
            await deleteOTP(identifier);
            // console.log(`✓ OTP verified and deleted for ${identifier}`);
            return true;
        }

        // console.log(`[OTP Debug] OTP mismatch!`);
        return false;
    } catch (error) {
        // console.error('Error verifying OTP:', error);
        throw new Error('Failed to verify OTP');
    }
};

/**
 * Delete OTP from Redis
 * @param {string} identifier - User identifier (email or username)
 * @returns {Promise<void>}
 */
const deleteOTP = async (identifier) => {
    try {
        const key = `otp:password-reset:${identifier.toLowerCase()}`;
        await redis.del(key);
        // console.log(`✓ OTP deleted from Redis for ${identifier}`);
    } catch (error) {
        // console.error('Error deleting OTP from Redis:', error);
        throw new Error('Failed to delete OTP');
    }
};

module.exports = {
    generateOTP,
    storeOTP,
    getOTP,
    verifyOTP,
    deleteOTP
};
