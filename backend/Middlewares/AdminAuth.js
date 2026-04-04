const jwt = require('jsonwebtoken');

const ensureAdmin = (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth) {
        return res.status(403).json({
            message: 'Unauthorized, JWT token is required',
            success: false
        });
    }

    try {
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user is admin
        if (!decoded.isAdmin) {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.',
                success: false
            });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            message: 'Unauthorized, JWT token is invalid or expired',
            success: false
        });
    }
};

module.exports = ensureAdmin;
