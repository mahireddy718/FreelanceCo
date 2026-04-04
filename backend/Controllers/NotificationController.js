const UserModel = require('../Models/User');

// Get user's notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 20, skip = 0 } = req.query;

        const user = await UserModel.findById(userId)
            .select('notifications')
            .lean();

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Sort notifications by date (newest first) and paginate
        const notifications = (user.notifications || [])
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(parseInt(skip), parseInt(skip) + parseInt(limit));

        const unreadCount = (user.notifications || []).filter(n => !n.read).length;

        res.status(200).json({
            success: true,
            notifications,
            unreadCount,
            total: user.notifications?.length || 0
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        const notification = user.notifications.id(id);

        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found',
                success: false
            });
        }

        notification.read = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await UserModel.findByIdAndUpdate(
            userId,
            { $set: { 'notifications.$[].read': true } }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        user.notifications.pull(id);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await UserModel.findById(userId)
            .select('notifications')
            .lean();

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        const unreadCount = (user.notifications || []).filter(n => !n.read).length;

        res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
};
