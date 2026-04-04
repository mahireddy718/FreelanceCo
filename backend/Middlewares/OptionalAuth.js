const jwt = require('jsonwebtoken');
const UserModel = require('../Models/User');

// Optional authentication - doesn't fail if no token, just adds user to req if valid
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            // No auth header, continue without user
            return next();
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await UserModel.findById(decoded._id).select('-password');

            if (user) {
                req.user = user;
            }
        } catch (err) {
            // Invalid token, continue without user
            console.log('Invalid token in optional auth');
        }

        next();
    } catch (err) {
        next();
    }
};

module.exports = optionalAuth;
