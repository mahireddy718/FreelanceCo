import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AnimatedCounter from '../components/ui/animatedCounter';
import axios from 'axios';
import {
    HiOutlineBriefcase,
    HiOutlineCurrencyDollar,
    HiOutlineEye,
    HiOutlineDocumentText,
    HiOutlineUser,
    HiOutlinePlusCircle,
    HiOutlineCog,
    HiOutlineInbox,
    HiOutlineCheckCircle
} from 'react-icons/hi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeProjects: 0,
        completedProjects: 0,
        totalEarnings: 0,
        totalSpent: 0,
        profileViews: 0
    });
    const [recentProjects, setRecentProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('authToken');

            // Fetch user profile with stats
            const profileResponse = await axios.get(
                `${API_BASE_URL}/api/users/me`,
                { headers: { Authorization: token } }
            );

            const userData = profileResponse.data.user;

            // Fetch projects
            const projectsResponse = await axios.get(
                `${API_BASE_URL}/api/projects/my/projects`,
                { headers: { Authorization: token } }
            );

            const projects = projectsResponse.data.projects || [];
            const activeProjects = projects.filter(p =>
                ['open', 'in-progress', 'completed'].includes(p.status)
            ).length;

            setStats({
                activeProjects,
                completedProjects: userData.completedProjects || 0,
                totalEarnings: userData.totalEarnings || 0,
                totalSpent: userData.totalSpent || 0,
                profileViews: userData.profileViews || 0
            });

            setRecentProjects(projects.slice(0, 5));
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
            case 'in-progress': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
            case 'completed': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
            case 'closed': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-transparent flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-green-600 dark:border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-transparent">
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 glass-surface rounded-2xl p-6 shadow-lg shadow-emerald-900/10"
                >
                    <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                        Welcome back, <span className="text-emerald-700 dark:text-emerald-400">{user?.name}</span>
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-normal">
                        Here's what's happening with your account today
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="glass-surface rounded-lg border border-emerald-100/70 dark:border-emerald-900/50 p-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-md shadow-emerald-900/5"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <HiOutlineBriefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xs text-gray-500 dark:text-gray-400 font-light">Active Projects</h3>
                                <p className="text-2xl font-light text-gray-700 dark:text-gray-200">
                                    <AnimatedCounter value={stats.activeProjects} duration={1200} />
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-light">
                            {stats.activeProjects === 0 ? 'No active projects' : 'Currently working on'}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="glass-surface rounded-lg border border-emerald-100/70 dark:border-emerald-900/50 p-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-md shadow-emerald-900/5"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <HiOutlineCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xs text-gray-500 dark:text-gray-400 font-light">Completed</h3>
                                <p className="text-2xl font-light text-gray-700 dark:text-gray-200">
                                    <AnimatedCounter value={stats.completedProjects} duration={1400} />
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-light">Projects finished</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="glass-surface rounded-lg border border-emerald-100/70 dark:border-emerald-900/50 p-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-md shadow-emerald-900/5"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <HiOutlineCurrencyDollar className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xs text-gray-500 dark:text-gray-400 font-light">
                                    {user?.role === 'freelancer' || user?.role === 'both' ? 'Total Earnings' : 'Total Spent'}
                                </h3>
                                <p className="text-2xl font-light text-gray-700 dark:text-gray-200">
                                    <AnimatedCounter
                                        value={user?.role === 'freelancer' || user?.role === 'both' ? stats.totalEarnings : stats.totalSpent}
                                        prefix="₹"
                                        duration={1800}
                                    />
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-light">
                            {stats.totalEarnings === 0 && stats.totalSpent === 0 ? 'Start earning today' : 'All time'}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="glass-surface rounded-lg border border-emerald-100/70 dark:border-emerald-900/50 p-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-md shadow-emerald-900/5"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                <HiOutlineEye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <h3 className="text-xs text-gray-500 dark:text-gray-400 font-light">Profile Views</h3>
                                <p className="text-2xl font-light text-gray-700 dark:text-gray-200">
                                    <AnimatedCounter value={stats.profileViews} duration={1600} />
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-light">Build your profile</p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="glass-surface rounded-lg border border-emerald-100/70 dark:border-emerald-900/50 p-8 mb-8 shadow-md shadow-emerald-900/5"
                >
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => navigate('/projects')}
                            className="p-5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/25 transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <HiOutlineDocumentText className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-500" />
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-500">Browse Projects</h3>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-light">Find your next gig</p>
                        </button>

                        <button
                            onClick={() => navigate(`/profile/${user?.username}`)}
                            className="p-5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/25 transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <HiOutlineUser className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-500" />
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-500">Edit Profile</h3>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-light">Update your details</p>
                        </button>

                        <button
                            onClick={() => navigate('/post-project')}
                            className="p-5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/25 transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <HiOutlinePlusCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-500" />
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-500">Post a Job</h3>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-light">Hire talented freelancers</p>
                        </button>

                        <button
                            onClick={() => navigate('/settings')}
                            className="p-5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/25 transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <HiOutlineCog className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-500" />
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-500">Settings</h3>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-light">Manage your account</p>
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="glass-surface rounded-lg border border-emerald-100/70 dark:border-emerald-900/50 p-8 shadow-md shadow-emerald-900/5"
                >
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-6">Recent Projects</h2>
                    {recentProjects.length > 0 ? (
                        <div className="space-y-4">
                            {recentProjects.map((project) => (
                                <div
                                    key={project._id}
                                    onClick={() => navigate(`/project-workspace/${project._id}`)}
                                    className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800 hover:bg-green-50/30 dark:hover:bg-green-900/20 transition cursor-pointer"
                                >
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{project.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
                                            Updated: {formatDate(project.updatedAt)}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-light ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <HiOutlineInbox className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-light mb-1">No recent projects</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-light">Your projects will appear here</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}