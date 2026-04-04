import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useProjectNotifications } from "../../hooks/useProjectNotifications";
import socketService from "../../services/socketService";
import axios from "axios";
import { ThemeToggleButton, useThemeTransition } from "../ui/shadcn-io/theme-toggle-button/index";
import {
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlinePlusCircle,
  HiOutlineFolderOpen,
  HiOutlineChatAlt2,
  HiOutlineQuestionMarkCircle,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineBell,
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineMenu,
  HiOutlineX as HiX
} from "react-icons/hi";

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { startTransition } = useThemeTransition();
  const { notificationCount, recentProjects, newProjectIds, markAsSeen } = useProjectNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [applicationNotifications, setApplicationNotifications] = useState([]);
  const [appNotifCount, setAppNotifCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const isClient = user?.role === 'client' || user?.role === 'both';

  // Helper function to check if a path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem('authToken');
          const response = await axios.get(`${API_URL}/api/settings`, {
            headers: { Authorization: token }
          });
          setUserProfile(response.data.settings);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated]);

  // Fetch application notifications for clients
  useEffect(() => {
    const fetchApplicationNotifications = async () => {
      if (isAuthenticated && isClient) {
        try {
          const token = localStorage.getItem('authToken');
          const response = await axios.get(`${API_URL}/api/applications/pending/count`, {
            headers: { Authorization: token }
          });
          setAppNotifCount(response.data.pendingCount || 0);
          setApplicationNotifications(response.data.recentApplications || []);
        } catch (error) {
          console.error('Error fetching application notifications:', error);
        }
      }
    };

    fetchApplicationNotifications();

    // Poll every 30 seconds for clients
    if (isAuthenticated && isClient) {
      const interval = setInterval(fetchApplicationNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isClient]);

  // Fetch and listen for unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem('authToken');
          const response = await axios.get(`${API_URL}/api/chat/conversations`, {
            headers: { Authorization: token }
          });
          const conversations = response.data.conversations || [];
          const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
          setUnreadMessageCount(totalUnread);
        } catch (error) {
          console.error('Error fetching unread message count:', error);
        }
      }
    };

    fetchUnreadCount();

    // Listen for real-time updates
    if (isAuthenticated) {
      const token = localStorage.getItem('authToken');
      socketService.connect(token);

      // Listen for conversation updates (new messages)
      const handleConversationUpdate = ({ conversationId }) => {
        // Refetch unread count when a conversation is updated
        fetchUnreadCount();
      };

      // Listen for new messages (including system messages)
      const handleNewMessage = ({ message, conversationId }) => {
        // Only update count if not on messages page
        if (!location.pathname.startsWith('/messages')) {
          fetchUnreadCount();
        }
      };

      socketService.onConversationUpdated(handleConversationUpdate);
      socketService.onNewMessage(handleNewMessage);

      return () => {
        socketService.offConversationUpdated(handleConversationUpdate);
        socketService.offNewMessage(handleNewMessage);
      };
    }
  }, [isAuthenticated, location.pathname]);

  // Clear unread count when on Messages page
  useEffect(() => {
    if (isActive('/messages') && unreadMessageCount > 0) {
      setUnreadMessageCount(0);
    }
  }, [location.pathname, unreadMessageCount]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    if (isDropdownOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isNotificationOpen]);

  const handleNotificationClick = async () => {
    setIsNotificationOpen(!isNotificationOpen);

    // Refresh application notifications for clients when opening
    if (!isNotificationOpen && isClient) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${API_URL}/api/applications/pending/count`, {
          headers: { Authorization: token }
        });
        setAppNotifCount(response.data.pendingCount || 0);
        setApplicationNotifications(response.data.recentApplications || []);
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      }
    } else if (!isNotificationOpen && notificationCount > 0) {
      setTimeout(() => markAsSeen(), 500);
    }
  };

  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  return (
    <nav className="glass-surface sticky top-0 mt-4 w-full max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between border-b border-emerald-100/70 dark:border-emerald-700/40 z-40 rounded-full outline-1 outline-emerald-100/65 dark:outline-emerald-700/45 transition-colors duration-200 shadow-xl shadow-emerald-900/10">

      {/* LEFT: LOGO */}
      <Link to="/" className="flex items-center gap-2 cursor-pointer">
        <h1 className="text-xl font-medium tracking-wide flex items-center">
          <span className="text-emerald-700 dark:text-emerald-400">Freelance</span>
          <span className="text-slate-700 dark:text-slate-200">Co</span>
        </h1>
      </Link>

      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 transition"
      >
        {isMobileMenuOpen ? <HiX size={24} /> : <HiOutlineMenu size={24} />}
      </button>

      {/* CENTER MENU - Desktop */}
      <div className="hidden md:flex items-center gap-8 text-slate-600 dark:text-slate-300 text-sm font-normal">

        {/* HOME */}
        <Link
          to="/"
          className={`flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer ${isActive('/') ? 'text-emerald-700 dark:text-emerald-400' : ''
            }`}
        >
          <HiOutlineHome size={16} />
          <span>Home</span>
        </Link>

        {/* EXPLORE PROJECTS - Only show for freelancers and both roles */}
        {(isAuthenticated && user?.role === 'freelancer' || user?.role === 'both') && (
          <Link
            to="/projects"
            className={`flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer ${isActive('/projects') ? 'text-emerald-700 dark:text-emerald-400' : ''
              }`}
          >
            <HiOutlineSearch size={16} />
            <span>Explore</span>
          </Link>
        )}

        {/* FIND FREELANCERS - Only show for clients and both roles */}
        {isAuthenticated && (user?.role === 'client' || user?.role === 'both') && (
          <Link
            to="/freelancers"
            className={`flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer ${isActive('/freelancers') ? 'text-emerald-700 dark:text-emerald-400' : ''
              }`}
          >
            <HiOutlineUser size={16} />
            <span>Freelancers</span>
          </Link>
        )}

        {/* POST PROJECT - Only show for clients and both roles */}
        {isAuthenticated && (user?.role === 'client' || user?.role === 'both') && (
          <Link
            to="/post-project"
            className={`flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer ${isActive('/post-project') ? 'text-emerald-700 dark:text-emerald-400' : ''
              }`}
          >
            <HiOutlinePlusCircle size={16} />
            <span>Project</span>
          </Link>
        )}

        {/* MY PROJECTS - Show for all authenticated users */}
        {isAuthenticated && (
          <Link
            to="/my-projects"
            className={`flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer ${isActive('/my-projects') || isActive('/project-workspace') ? 'text-emerald-700 dark:text-emerald-400' : ''
              }`}
          >
            <HiOutlineFolderOpen size={16} />
            <span>My Projects</span>
          </Link>
        )}

        {/* MESSAGES - Only show when authenticated */}
        {isAuthenticated && (
          <Link
            to="/messages"
            className={`relative flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer ${isActive('/messages') ? 'text-emerald-700 dark:text-emerald-400' : ''
              }`}
            onClick={() => {
              // Clear unread count when clicking Messages
              if (unreadMessageCount > 0) {
                setUnreadMessageCount(0);
              }
            }}
          >
            <HiOutlineChatAlt2 size={16} />
            <span>Messages</span>
            {unreadMessageCount > 0 && !isActive('/messages') && (
              <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
          </Link>
        )}

        {/* SUPPORT */}
        <Link
          to="/support"
          className={`flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer ${isActive('/support') ? 'text-emerald-700 dark:text-emerald-400' : ''
            }`}
        >
          <HiOutlineQuestionMarkCircle size={16} />
          <span>Support</span>
        </Link>

      </div>


      {/* RIGHT SIDE - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-4">
        {/* Theme Toggle Button - Always visible */}
        <ThemeToggleButton
          title="Toggle Theme"
          theme={theme}
          variant="polygon"
          // url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3JwcXdzcHd5MW92NWprZXVpcTBtNXM5cG9obWh0N3I4NzFpaDE3byZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/WgsVx6C4N8tjy/giphy.gif"
          start="center"
          className="mt-1"
          onClick={() => {
            startTransition(() => {
              toggleTheme();
            });
          }}
        />

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleNotificationClick}
                className="mt-2 relative text-gray-600 hover:text-green-600 transition dark:text-white cursor-pointer"
                title="Notifications"
              >
                <HiOutlineBell size={18} />
                {(isClient ? appNotifCount : notificationCount) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                    {(isClient ? appNotifCount : notificationCount) > 9 ? '9+' : (isClient ? appNotifCount : notificationCount)}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border dark:border-gray-700 dark:bg-black border-gray-100 rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b dark:border-gray-700 border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-white">
                      {isClient ? (
                        <>
                          Project Applications {appNotifCount > 0 && `(${appNotifCount} pending)`}
                        </>
                      ) : (
                        <>
                          Recent Projects {notificationCount > 0 && `(${notificationCount} new)`}
                        </>
                      )}
                    </h3>
                  </div>

                  {isClient ? (
                    /* Application Notifications for Clients */
                    applicationNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <HiOutlineBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-light">No pending applications</p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {applicationNotifications.map((app) => (
                          <Link
                            key={app._id}
                            to="/my-projects"
                            onClick={() => setIsNotificationOpen(false)}
                            className="block px-4 py-3 dark:hover:bg-gray-700 hover:bg-gray-100 transition border-b border-gray-50 last:border-0"
                          >
                            <div className="flex gap-3">
                              {app.freelancerId?.avatar ? (
                                <img
                                  src={app.freelancerId.avatar}
                                  alt={app.freelancerId.name}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-light border border-gray-200 shrink-0">
                                  {app.freelancerId?.name?.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-light dark:text-gray-200 text-gray-800 mb-0.5">
                                  <span className="font-normal">{app.freelancerId?.name}</span> applied to
                                </p>
                                <p className="text-xs dark:text-gray-200 text-gray-600 font-light truncate mb-1">
                                  {app.projectId?.title}
                                </p>
                                <p className="text-xs dark:text-gray-200 text-gray-400 font-light">
                                  {getTimeSince(app.createdAt)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )
                  ) : (
                    /* Project Notifications for Freelancers */
                    recentProjects.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <HiOutlineBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-light">No projects available</p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {recentProjects.map((project) => {
                          const isNew = newProjectIds.includes(project._id);
                          return (
                            <Link
                              key={project._id}
                              to={`/projects/${project._id}`}
                              onClick={() => setIsNotificationOpen(false)}
                              className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-800 transition border-b border-gray-50 last:border-0 ${isNew ? 'bg-green-50/30' : ''
                                }`}
                            >
                              <div className="flex gap-3">
                                <div className="relative">
                                  {project.thumbnail ? (
                                    <img
                                      src={project.thumbnail}
                                      alt={project.title}
                                      className="w-12 h-12 object-cover rounded border border-gray-200 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-linear-to-br from-green-50 to-gray-50 rounded flex items-center justify-center shrink-0">
                                      <HiOutlineBriefcase size={20} className="text-gray-400" />
                                    </div>
                                  )}
                                  {isNew && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm text-left font-light dark:text-gray-200 line-clamp-1 mb-1 ${isNew ? 'text-gray-900 font-normal' : 'text-gray-700'
                                    }`}>
                                    {project.title}
                                  </h4>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs dark:text-green-600 text-green-600 font-light">
                                      ₹{project.budget.min.toLocaleString()}+
                                    </span>
                                    <div className="flex items-center gap-1 text-xs dark:text-gray-400 text-gray-400">
                                      <HiOutlineClock size={12} />
                                      {getTimeSince(project.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition cursor-pointer"
              >
                {userProfile?.profile?.avatar ? (
                  <img
                    src={userProfile.profile.avatar}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-200 dark:border-gray-700 hover:text-green-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-light dark:text-white dark:hover:text-green-500">{user?.name?.split(' ')[0]}</span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute dark:bg-black  right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-sm py-2 z-50">
                  <Link
                    to={user?.username ? `/user/${user.username}` : '/settings'}
                    onClick={() => {
                      console.log('User object:', user);
                      console.log('Username:', user?.username);
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-white hover:dark:text-green-500 light:hover:bg-gray-50 hover:text-green-600 transition"
                  >
                    <HiOutlineUser size={16} />
                    <span>{user?.username ? 'My Profile' : 'Set Username'}</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-white hover:dark:text-green-500 light:hover:bg-gray-50 hover:text-green-600 transition"
                  >
                    <HiOutlineBriefcase size={16} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-white hover:dark:text-green-500 light:hover:bg-gray-50 hover:text-green-600 transition"
                  >
                    <HiOutlineCog size={16} />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-white hover:dark:text-green-500 light:hover:bg-gray-50 hover:text-green-600 transition"
                  >
                    <HiOutlineLogout size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-600 dark:text-white dark:hover:text-green-500 transition cursor-pointer"
          >
            <HiOutlineLogin size={16} />
            <span>Login</span>
          </Link>
        )}
      </div>

      {/* MOBILE MENU PANEL */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50">
          <div className="px-4 py-4 space-y-3">
            {/* Navigation Links */}
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition ${isActive('/') ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <HiOutlineHome size={18} />
              <span className="text-sm font-light">Home</span>
            </Link>

            {(isAuthenticated && user?.role === 'freelancer' || user?.role === 'both') && (
              <Link
                to="/projects"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition ${isActive('/projects') ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <HiOutlineSearch size={18} />
                <span className="text-sm font-light">Explore</span>
              </Link>
            )}

            {isAuthenticated && (user?.role === 'client' || user?.role === 'both') && (
              <Link
                to="/freelancers"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition ${isActive('/freelancers') ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <HiOutlineUser size={18} />
                <span className="text-sm font-light">Freelancers</span>
              </Link>
            )}

            {isAuthenticated && (user?.role === 'client' || user?.role === 'both') && (
              <Link
                to="/post-project"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition ${isActive('/post-project') ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <HiOutlinePlusCircle size={18} />
                <span className="text-sm font-light">Project</span>
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/my-projects"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition ${isActive('/my-projects') || isActive('/project-workspace') ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <HiOutlineFolderOpen size={18} />
                <span className="text-sm font-light">My Projects</span>
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/messages"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition relative ${isActive('/messages') ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <HiOutlineChatAlt2 size={18} />
                <span className="text-sm font-light">Messages</span>
                {unreadMessageCount > 0 && !isActive('/messages') && (
                  <span className="ml-auto min-w-5 h-5 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1.5">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              to="/support"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition ${isActive('/support') ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <HiOutlineQuestionMarkCircle size={18} />
              <span className="text-sm font-light">Support</span>
            </Link>

            {/* Border separator */}
            <div className="border-t border-gray-100 my-3"></div>

            {/* Theme Toggle - Always visible */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm font-light text-gray-600 dark:text-gray-300">Theme</span>
              <ThemeToggleButton
                theme={theme}
                variant="circle"
                start="center"
                onClick={() => {
                  startTransition(() => {
                    toggleTheme();
                  });
                }}
              />
            </div>

            {/* User Section */}
            {isAuthenticated ? (
              <>
                <div className="border-t border-gray-100 my-3"></div>
                <Link
                  to={user?.username ? `/user/${user.username}` : '/settings'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                  {userProfile?.profile?.avatar ? (
                    <img
                      src={userProfile.profile.avatar}
                      alt="Profile"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-200">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">View Profile</p>
                  </div>
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition text-gray-600 hover:bg-gray-50"
                >
                  <HiOutlineBriefcase size={18} />
                  <span className="text-sm font-light">Dashboard</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition text-gray-600 hover:bg-gray-50"
                >
                  <HiOutlineCog size={18} />
                  <span className="text-sm font-light">Settings</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg transition text-gray-600 hover:bg-gray-50"
                >
                  <HiOutlineLogout size={18} />
                  <span className="text-sm font-light">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className=" flex items-center gap-2 px-4 py-2.5 rounded-lg transition text-gray-600 hover:bg-gray-50"
              >
                <HiOutlineLogin size={18} />
                <span className="text-sm font-light">Login</span>
              </Link>
            )}
          </div>
        </div>
      )}

    </nav>
  );
}
