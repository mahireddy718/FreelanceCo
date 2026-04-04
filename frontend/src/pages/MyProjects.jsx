import { useState, useEffect } from 'react';
import AnimatedCounter from '@/components/ui/animatedCounter';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineBriefcase,
    HiOutlineEye,
    HiOutlineEyeOff,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineClock,
    HiOutlineChat,
    HiOutlinePlus,
    HiOutlineX,
    HiOutlineCheck,
    HiOutlineBan,
    HiChevronDown,
    HiChevronUp
} from 'react-icons/hi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function MyProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load saved filter from localStorage or default to 'all'
    const [filter, setFilter] = useState(() => {
        return localStorage.getItem('myProjectsFilter') || 'all';
    });

    // Load saved roleFilter from localStorage or default based on user role
    const [roleFilter, setRoleFilter] = useState(() => {
        const saved = localStorage.getItem('myProjectsRoleFilter');
        return saved || (user?.role === 'freelancer' ? 'freelancer' : 'client');
    });

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loadingApplications, setLoadingApplications] = useState(false);
    const [expandedApplication, setExpandedApplication] = useState(null);

    // Save filter to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('myProjectsFilter', filter);
    }, [filter]);

    // Save roleFilter to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('myProjectsRoleFilter', roleFilter);
    }, [roleFilter]);

    useEffect(() => {
        fetchProjects();
    }, [filter, roleFilter]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            let url = `${API_BASE_URL}/api/projects/my/projects`;

            const params = new URLSearchParams();
            if (filter !== 'all') {
                // For completed tab, fetch both completed and closed projects
                if (filter === 'completed') {
                    // Fetch all projects and filter on frontend
                    // Or we can make multiple requests, but simpler to filter client-side
                } else {
                    params.append('status', filter);
                }
            }
            if (roleFilter !== 'all') {
                params.append('role', roleFilter);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: token }
            });

            let fetchedProjects = response.data.projects || [];

            // Filter for completed tab - include both completed and closed
            if (filter === 'completed') {
                fetchedProjects = fetchedProjects.filter(p =>
                    p.status === 'completed' || p.status === 'closed'
                );
            }

            // Sort projects: latest proposals first, closed at bottom
            fetchedProjects.sort((a, b) => {
                // First, separate by status - closed/completed/cancelled go to bottom
                const aIsClosed = ['completed', 'cancelled', 'closed'].includes(a.status);
                const bIsClosed = ['completed', 'cancelled', 'closed'].includes(b.status);

                if (aIsClosed !== bIsClosed) {
                    return aIsClosed ? 1 : -1;
                }

                // For non-closed projects, sort by latest proposal/activity
                // If project has proposals, sort by most recent update
                if (a.proposalCount > 0 || b.proposalCount > 0) {
                    const aTime = new Date(a.updatedAt || a.createdAt).getTime();
                    const bTime = new Date(b.updatedAt || b.createdAt).getTime();
                    return bTime - aTime; // Most recent first
                }

                // Otherwise sort by creation date (newest first)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setProjects(fetchedProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async (projectId) => {
        setLoadingApplications(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/applications/project/${projectId}`,
                { headers: { Authorization: token } }
            );
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setApplications([]);
        } finally {
            setLoadingApplications(false);
        }
    };

    const handleViewApplications = (project) => {
        setSelectedProject(project);
        fetchApplications(project._id);
    };

    const handleApplicationAction = async (applicationId, status) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.patch(
                `${API_BASE_URL}/api/applications/${applicationId}/status`,
                { status },
                { headers: { Authorization: token } }
            );

            // Refresh applications
            fetchApplications(selectedProject._id);

            // Refresh projects to update status
            fetchProjects();
        } catch (error) {
            console.error('Error updating application:', error);
        }
    };

    const handleDelete = async (projectId) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`${API_BASE_URL}/api/projects/${projectId}`, {
                headers: { Authorization: token }
            });

            setProjects(projects.filter(p => p._id !== projectId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            case 'in-progress': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            case 'completed': return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
            case 'cancelled': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            default: return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const stats = {
        total: projects.length,
        open: projects.filter(p => p.status === 'open').length,
        inProgress: projects.filter(p => p.status === 'in-progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        totalProposals: projects.reduce((acc, p) => acc + p.proposalCount, 0),
        totalViews: projects.reduce((acc, p) => acc + p.viewCount, 0)
    };

    // Helper to check if project has recent proposals (within 24 hours)
    const hasRecentProposal = (project) => {
        // Only show notification for projects owned by the current user
        if (project.clientId?._id !== user?.userId) return false;

        // Don't show notification for closed/completed/cancelled projects
        if (['completed', 'cancelled', 'closed'].includes(project.status)) return false;

        if (!project.updatedAt) return false;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(project.updatedAt) > twentyFourHoursAgo && project.proposalCount > 0;
    };

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 glass-surface rounded-2xl p-5 md:p-6 shadow-lg shadow-emerald-900/10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-left text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-2">My Projects</h1>
                            <p className="text-left text-sm text-slate-600 dark:text-slate-300 font-normal">
                                {user?.role === 'freelancer'
                                    ? 'View and manage your assigned projects'
                                    : 'Manage and track your projects'}
                            </p>
                        </div>
                        {/* Only show New Project button for clients and both roles */}
                        {(user?.role === 'client' || user?.role === 'both') && (
                            <Link
                                to="/post-project"
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-emerald-700 dark:bg-emerald-500 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-400 transition font-medium shadow-lg shadow-emerald-700/20"
                            >
                                <HiOutlinePlus size={16} />
                                New Project
                            </Link>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="glass-surface border border-emerald-100/70 dark:border-emerald-900/50 rounded-lg p-4">
                            <p className="text-2xl font-light text-gray-700 dark:text-gray-200">
                                <AnimatedCounter value={stats.total} duration={1800}/>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Total Projects</p>
                        </div>
                        <div className="glass-surface border border-emerald-100/70 dark:border-emerald-900/50 rounded-lg p-4">
                            <p className="text-2xl font-light text-green-600 dark:text-green-500">
                                <AnimatedCounter value={stats.open} duration={1800}/>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Open</p>
                        </div>
                        <div className="glass-surface border border-emerald-100/70 dark:border-emerald-900/50 rounded-lg p-4">
                            <p className="text-2xl font-light text-gray-700 dark:text-gray-200">
                                <AnimatedCounter value={stats.totalProposals} duration={1800}/>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Total Proposals</p>
                        </div>
                        <div className="glass-surface border border-emerald-100/70 dark:border-emerald-900/50 rounded-lg p-4">
                            <p className="text-2xl font-light text-gray-700 dark:text-gray-200">
                                <AnimatedCounter value={stats.totalViews} duration={1800} />
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-light">Total Views</p>
                        </div>
                    </div>

                    {/* Tabs Row - Role Filter on Left, Status Filter on Right */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                        {/* Role Filter Tabs - Clean Preview/Code Style */}
                        <div className="inline-flex gap-1 p-1 glass-surface rounded-lg">
                            {[
                                { key: 'client', label: 'My Posted Projects', roles: ['client', 'both'] },
                                { key: 'freelancer', label: 'Assigned to Me', roles: ['freelancer', 'both'] }
                            ]
                                .filter(tab => tab.roles.includes(user?.role))
                                .map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setRoleFilter(tab.key)}
                                        className={`px-6 py-2 text-sm rounded-md transition whitespace-nowrap font-light ${roleFilter === tab.key
                                            ? 'bg-white/90 dark:bg-emerald-950/70 text-slate-900 dark:text-slate-100 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))
                            }
                        </div>

                        {/* Status Filter Tabs - Smaller, on Right */}
                        <div className="inline-flex gap-1 px-2 py-1 glass-surface rounded-full">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'open', label: 'Open' },
                                { key: 'in-progress', label: 'In Progress' },
                                { key: 'completed', label: 'Completed' },
                                { key: 'cancelled', label: 'Cancelled' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`px-3 py-1 text-xs rounded-full transition whitespace-nowrap font-light ${filter === tab.key
                                        ? 'bg-white/90 dark:bg-emerald-950/70 text-slate-900 dark:text-slate-100 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Projects List */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block w-8 h-8 border-2 border-green-600 dark:border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-light">Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 glass-surface rounded-lg"
                    >
                        <HiOutlineBriefcase className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-1">No projects found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-light mb-4">
                            {filter === 'all' ? 'Get started by creating your first project' : `No ${filter} projects`}
                        </p>
                        {filter === 'all' && (
                            <Link
                                to="/post-project"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-500 border border-green-600 dark:border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition font-light"
                            >
                                <HiOutlinePlus size={16} />
                                Create Project
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative border border-emerald-100/70 dark:border-emerald-900/50 rounded-xl p-6 glass-surface shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 transition-all group"
                            >
                                {/* Main Content - Thumbnail + Details */}
                                <div className="flex gap-4">
                                    {/* Thumbnail */}
                                    {project.thumbnail ? (
                                        <img
                                            src={project.thumbnail}
                                            alt={project.title}
                                            className="w-20 h-20 object-cover rounded-lg shrink-0"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                            <HiOutlineBriefcase className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                    )}

                                    {/* Content Section */}
                                    <Link>

                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        {/* Header Section */}
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={`/projects/${project._id}`}
                                                    className="text-xl font-normal text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-500 transition block mb-2 line-clamp-1 text-left"
                                                >
                                                    {project.title}
                                                </Link>

                                                {/* Badges Row */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2.5 py-0.5 bg-white dark:bg-gray-800 text-black dark:text-gray-200 text-xs rounded-full font-light">
                                                        {project.category}
                                                    </span>
                                                    {/* Skills - show first 3 */}
                                                    {project.skillsRequired?.slice(0, 3).map((skill, idx) => (
                                                        <span key={idx} className="px-2.5 py-0.5 bg-white dark:bg-gray-800 text-black dark:text-gray-200 text-xs rounded-full font-light">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {project.skillsRequired?.length > 3 && (
                                                        <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full font-light">
                                                            +{project.skillsRequired.length - 3}
                                                        </span>
                                                    )}
                                                    {project.visibility === 'private' && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full font-light">
                                                            <HiOutlineEyeOff size={12} />
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions - Always Visible */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {/* Status Badge */}
                                                <span className={`px-2.5 py-1 text-xs rounded-full font-light ${getStatusColor(project.status)}`}>
                                                    {project.status}
                                                </span>

                                                {/* Show applications button only for client's own projects that are NOT closed AND have pending applications */}
                                                {project.clientId?._id === user?.userId &&
                                                    project.pendingApplicationCount > 0 &&
                                                    !['completed', 'cancelled', 'closed'].includes(project.status) && (
                                                        <button
                                                            onClick={() => handleViewApplications(project)}
                                                            className="px-3 py-1.5 text-xs text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition font-light cursor-pointer"
                                                            title="View Pending Applications"
                                                        >
                                                            {project.pendingApplicationCount} Pending {project.pendingApplicationCount === 1 ? 'Application' : 'Applications'}
                                                        </button>
                                                    )}
                                                <Link
                                                    to={project.assignedFreelancerId?._id === user?.userId
                                                        ? `/project-workspace/${project._id}`
                                                        : `/projects/${project._id}`}
                                                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition cursor-pointer"
                                                    title={project.assignedFreelancerId?._id === user?.userId ? 'Open Workspace' : 'View Project'}
                                                >
                                                    {project.assignedFreelancerId?._id === user?.userId ? (
                                                        <HiOutlineBriefcase size={18} />
                                                    ) : (
                                                        <HiOutlineEye size={18} />
                                                    )}
                                                </Link>
                                                {/* Show edit button only for client's own projects that are not closed */}
                                                {project.clientId?._id === user?.userId && !['completed', 'cancelled', 'closed'].includes(project.status) && (
                                                    <Link
                                                        to={`/post-project/${project._id}`}
                                                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition cursor-pointer"
                                                        title="Edit Project"
                                                    >
                                                        <HiOutlinePencil size={18} />
                                                    </Link>
                                                )}
                                                {/* Show delete button only for client's own projects */}
                                                {project.clientId?._id === user?.userId && (
                                                    <button
                                                        onClick={() => setDeleteConfirm(project._id)}
                                                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <HiOutlineTrash size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description - Only visible on hover */}
                                        <div className="overflow-hidden transition-all duration-300 ease-in-out max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 text-ellipsis font-light text-left line-clamp-2 mb-4">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer - Metrics and Budget */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400 font-light">
                                        <div className="flex items-center gap-1.5">
                                            <HiOutlineChat size={14} className="text-gray-400 dark:text-gray-500" />
                                            <span>{project.proposalCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <HiOutlineEye size={14} className="text-gray-400 dark:text-gray-500" />
                                            <span>{project.viewCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <HiOutlineClock size={14} className="text-gray-400 dark:text-gray-500" />
                                            <span>{new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        {project.assignedFreelancerId?._id === user?.userId && project.clientId && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                Client: {project.clientId.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm font-normal text-gray-800 dark:text-gray-200">
                                        ₹{project.budget.min.toLocaleString()} - ₹{project.budget.max.toLocaleString()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-100 dark:border-gray-800"
                        >
                            <h3 className="text-lg font-light text-gray-700 dark:text-gray-200 mb-2">Delete Project?</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-6">
                                This action cannot be undone. All proposals and data will be permanently deleted.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-light"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 dark:bg-red-500 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition font-light"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Applications Modal */}
                {selectedProject && (
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-light text-gray-800 dark:text-gray-200">Applications</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light mt-0.5">{selectedProject.title}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition cursor-pointer"
                                >
                                    <HiOutlineX size={20} className="text-gray-400 dark:text-gray-500" />
                                </button>
                            </div>

                            {/* Applications List */}
                            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                                {loadingApplications ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block w-6 h-6 border-2 border-green-600 dark:border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-light">Loading applications...</p>
                                    </div>
                                ) : applications.length === 0 ? (
                                    <div className="text-center py-12">
                                        <HiOutlineChat className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-light">No applications yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {applications.map((app) => (
                                            <div
                                                key={app._id}
                                                className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 hover:border-gray-200 dark:hover:border-gray-700 transition"
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Freelancer Avatar */}
                                                    {app.freelancerId?.avatar ? (
                                                        <img
                                                            src={app.freelancerId.avatar}
                                                            alt={app.freelancerId.name}
                                                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-light border border-gray-200 dark:border-gray-700">
                                                            {app.freelancerId?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        {/* Freelancer Info */}
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <h4 className="text-base font-normal text-gray-800 dark:text-gray-200">
                                                                    {app.freelancerId?.name}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {app.freelancerId?.rating > 0 && (
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-light">
                                                                            ⭐ {app.freelancerId.rating.toFixed(1)}
                                                                        </span>
                                                                    )}
                                                                    {app.freelancerId?.experienceLevel && (
                                                                        <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded border border-gray-100 dark:border-gray-700 font-light">
                                                                            {app.freelancerId.experienceLevel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {/* AI Score Badge */}
                                                                {app.aiScore !== null && app.aiScore !== undefined ? (
                                                                    <div className="relative group/score">
                                                                        <span className={`px-2 py-0.5 text-xs rounded border font-medium cursor-help ${app.aiScore >= 70
                                                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                                                                : app.aiScore >= 40
                                                                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                                                                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                                                            }`}>
                                                                            🤖 {app.aiScore}
                                                                        </span>
                                                                        {/* Score Breakdown Tooltip */}
                                                                        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover/score:opacity-100 group-hover/score:visible transition-all z-50">
                                                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">AI Analysis</p>
                                                                            <div className="space-y-1.5">
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-gray-500 dark:text-gray-400">Relevance</span>
                                                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{app.aiAnalysis?.relevance || '-'}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-gray-500 dark:text-gray-400">Professionalism</span>
                                                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{app.aiAnalysis?.professionalism || '-'}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-gray-500 dark:text-gray-400">Clarity</span>
                                                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{app.aiAnalysis?.clarity || '-'}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-gray-500 dark:text-gray-400">Experience</span>
                                                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{app.aiAnalysis?.experience || '-'}</span>
                                                                                </div>
                                                                            </div>
                                                                            {app.aiAnalysis?.summary && (
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 italic">
                                                                                    "{app.aiAnalysis.summary}"
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 text-xs rounded border font-light bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700">
                                                                        🤖 Scoring...
                                                                    </span>
                                                                )}
                                                                {/* Status Badge */}
                                                                <span className={`px-2 py-0.5 text-xs rounded border font-light ${app.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                                                                    app.status === 'accepted' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                                                        'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                                                    }`}>
                                                                    {app.status}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Cover Letter with Expand/Collapse */}
                                                        <div className="mb-3">
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Cover Letter</p>
                                                                <button
                                                                    onClick={() => setExpandedApplication(expandedApplication === app._id ? null : app._id)}
                                                                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition cursor-pointer font-light"
                                                                    title={expandedApplication === app._id ? "Show less" : "View complete application"}
                                                                >
                                                                    {expandedApplication === app._id ? (
                                                                        <>
                                                                            <HiChevronUp size={14} />
                                                                            <span>Show less</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <HiChevronDown size={14} />
                                                                            <span>Read more</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <p className={`text-sm text-gray-600 dark:text-gray-400 font-light whitespace-pre-wrap ${expandedApplication === app._id ? '' : 'line-clamp-3'}`}>
                                                                {app.coverLetter}
                                                            </p>
                                                        </div>

                                                        {/* Proposed Budget & Duration */}
                                                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-light mb-3">
                                                            <span>
                                                                Budget: ₹{app.proposedBudget.min.toLocaleString()} - ₹{app.proposedBudget.max.toLocaleString()}
                                                            </span>
                                                            <span>•</span>
                                                            <span>Duration: {app.proposedDuration}</span>
                                                            <span>•</span>
                                                            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                                                        </div>

                                                        {/* Actions */}
                                                        {app.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleApplicationAction(app._id, 'accepted')}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition font-light cursor-pointer"
                                                                >
                                                                    <HiOutlineCheck size={14} />
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApplicationAction(app._id, 'rejected')}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-light cursor-pointer"
                                                                >
                                                                    <HiOutlineBan size={14} />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {app.status === 'accepted' && (
                                                            <div className="text-xs text-green-600 dark:text-green-500 font-light">
                                                                ✓ Accepted - You can now chat in the Messages section
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
