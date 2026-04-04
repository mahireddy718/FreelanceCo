import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { HiOutlineBell, HiOutlineX, HiOutlineCheck } from 'react-icons/hi';
import axios from 'axios';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch notifications on mount
        fetchNotifications();

        // Listen for new notifications via socket
        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };

        socketService.on('new-notification', handleNewNotification);

        // Poll every 60 seconds for new notifications (backup)
        const interval = setInterval(fetchNotifications, 60000);

        return () => {
            socketService.off('new-notification', handleNewNotification);
            clearInterval(interval);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/notifications?limit=10`,
                { headers: { Authorization: token } }
            );

            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.patch(
                `${API_BASE_URL}/api/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: token } }
            );

            // Update local state
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification._id);
        }

        setShowNotifications(false);

        // Navigate based on notification type
        if (notification.conversationId) {
            navigate(`/messages?conversationId=${notification.conversationId}`);
            return;
        }

        if (notification.projectId) {
            navigate(`/project/${notification.projectId}/workspace`);
        }
    };

    const getTimeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'contract_accepted':
            case 'application_accepted':
            case 'payment_received':
            case 'project_accepted':
                return '🎉';
            case 'contract_rejected':
                return '📄';
            case 'project_completed':
                return '✅';
            case 'review_requested':
                return '🔄';
            case 'application_received':
                return '📨';
            case 'message_received':
                return '💬';
            default:
                return '🔔';
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition cursor-pointer"
                title="Notifications"
            >
                <HiOutlineBell size={20} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-light">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-normal text-gray-800 dark:text-gray-100">
                                Notifications
                            </h3>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition cursor-pointer"
                            >
                                <HiOutlineX size={16} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <HiOutlineBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                                        No notifications yet
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map((notif) => (
                                        <button
                                            key={notif._id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition border-b border-gray-50 dark:border-gray-800 text-left ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icon */}
                                                <span className="text-2xl shrink-0">
                                                    {getNotificationIcon(notif.type)}
                                                </span>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                                            {notif.title}
                                                        </p>
                                                        {!notif.read && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 font-light mt-1 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-light mt-1">
                                                        {getTimeSince(notif.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop to close dropdown */}
            {showNotifications && (
                <div
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-0 z-40"
                />
            )}
        </div>
    );
}
