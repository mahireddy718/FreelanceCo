const jwt = require('jsonwebtoken');
const UserModel = require('../Models/User');

const ensureAuthenticated = async (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth) {
        return res.status(403).json({
            message: 'Unauthorized, JWT token is required',
            success: false
        });
    }

    try {
        const decoded = jwt.verify(auth, process.env.JWT_SECRET);

        // Skip ban check for admin
        if (decoded.isAdmin) {
            req.user = decoded;
            return next();
        }

        // Check if user is banned
        const user = await UserModel.findById(decoded._id).select('isBanned');
        if (!user) {
            return res.status(403).json({
                message: 'User not found',
                success: false
            });
        }

        if (user.isBanned) {
            return res.status(403).json({
                message: 'Your account has been banned. Please contact support.',
                success: false,
                banned: true
            });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            message: 'Unauthorized, JWT token wrong or expired',
            success: false
        });
    }
};

module.exports = ensureAuthenticated;
