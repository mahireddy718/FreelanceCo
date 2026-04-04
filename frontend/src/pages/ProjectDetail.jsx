import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import ApplicationModal from '../components/ApplicationModal';
import {
    HiOutlineArrowLeft,
    HiOutlineClock,
    HiOutlineLocationMarker,
    HiOutlineStar,
    HiOutlineEye,
    HiOutlineEyeOff,
    HiOutlineBriefcase,
    HiOutlineChevronRight
} from 'react-icons/hi';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [applicationSuccess, setApplicationSuccess] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [isAssigned, setIsAssigned] = useState(false);

    useEffect(() => {
        fetchProject();
        if (isAuthenticated) {
            checkApplicationStatus();
        }
    }, [id, isAuthenticated]);

    const fetchProject = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/projects/${id}`);
            setProject(response.data.project);

            // Check if current user is assigned
            const currentUser = authService.getCurrentUser();
            if (currentUser && response.data.project.assignedFreelancerId) {
                setIsAssigned(
                    currentUser.userId === response.data.project.assignedFreelancerId._id ||
                    currentUser.userId === response.data.project.assignedFreelancerId
                );
            }

            setLoading(false);
        } catch (err) {
            setError('Project not found');
            setLoading(false);
        }
    };

    const checkApplicationStatus = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/applications/my`,
                { headers: { Authorization: token } }
            );

            // Check if user has already applied to this project
            const applied = response.data.applications?.some(
                app => (app.projectId._id === id || app.projectId === id)
            );
            setHasApplied(applied);
        } catch (err) {
            console.error('Error checking application status:', err);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-green-600 dark:border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-light">Loading project...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <HiOutlineBriefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4">{error || 'Project not found'}</p>
                    <button
                        onClick={() => navigate('/projects')}
                        className="px-4 py-2 text-sm text-green-600 dark:text-green-500 border border-green-600 dark:border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition font-light"
                    >
                        Browse Projects
                    </button>
                </div>
            </div>
        );
    }

    // Check if current user is the project owner
    const currentUser = authService.getCurrentUser();
    const isOwner = currentUser && project.clientId &&
        (currentUser.userId === project.clientId._id || currentUser.userId === project.clientId);

    const allImages = [project.thumbnail, ...project.images].filter(Boolean);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <div className="max-w-5xl mx-auto px-8 py-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors font-light group"
                >
                    <HiOutlineArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back</span>
                </button>

                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 font-light"
                >
                    <Link to="/projects" className="hover:text-green-600 dark:hover:text-green-500 transition">
                        Projects
                    </Link>
                    <HiOutlineChevronRight size={14} />
                    <span className="text-gray-700 dark:text-gray-300">{project.title}</span>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h1 className="text-3xl font-light text-gray-700 dark:text-gray-200 mb-2">
                                        {project.title}
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-md font-light">
                                            {project.category}
                                        </span>
                                        {project.visibility === 'private' && (
                                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded-md font-light">
                                                <HiOutlineEyeOff size={14} />
                                                Private
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-light">
                                <div className="flex items-center gap-1">
                                    <HiOutlineClock size={14} />
                                    Posted {getTimeSince(project.createdAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <HiOutlineEye size={14} />
                                    {project.viewCount} views
                                </div>
                                <div>
                                    {project.proposalCount} proposal{project.proposalCount !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </motion.div>

                        {/* Images */}
                        {allImages.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <img
                                    src={allImages[selectedImage]}
                                    alt={project.title}
                                    className="w-full h-80 object-cover rounded-lg border border-gray-200 dark:border-gray-800 mb-3"
                                />
                                {allImages.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto">
                                        {allImages.map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImage(index)}
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${selectedImage === index
                                                    ? 'border-green-600 dark:border-green-500'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`${project.title} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Description */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="border border-gray-100 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-900"
                        >
                            <h2 className="text-lg font-light text-gray-700 dark:text-gray-200 mb-3">Project Description</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-light whitespace-pre-wrap leading-relaxed">
                                {project.description}
                            </p>
                        </motion.div>

                        {/* Project Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="border border-gray-100 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-900"
                        >
                            <h2 className="text-lg font-light text-gray-700 dark:text-gray-200 mb-4">Project Details</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-light">Budget</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-light">
                                        ₹{project.budget.min.toLocaleString()} - ₹{project.budget.max.toLocaleString()} ({project.budget.type})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-light">Duration</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-light">{project.duration}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-light">Status</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-light capitalize">{project.status}</span>
                                </div>
                                {project.deadline && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-light">Deadline</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300 font-light">
                                            {new Date(project.deadline).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Skills Required */}
                        {project.skillsRequired.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="border border-gray-100 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-900"
                            >
                                <h2 className="text-lg font-light text-gray-700 dark:text-gray-200 mb-3">Skills Required</h2>
                                <div className="flex flex-wrap gap-2">
                                    {project.skillsRequired.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg border border-gray-100 dark:border-gray-700 font-light"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Apply CTA */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="border border-gray-100 dark:border-gray-800 rounded-lg p-6 sticky top-24 bg-white dark:bg-gray-900"
                        >
                            <div className="mb-4">
                                <p className="text-2xl font-light text-gray-700 dark:text-gray-200 mb-1">
                                    ₹{project.budget.min.toLocaleString()} - ₹{project.budget.max.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-light">{project.budget.type} price</p>
                            </div>

                            {applicationSuccess ? (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 font-light mb-3">
                                    ✓ Application submitted successfully! The client will review your application.
                                </div>
                            ) : isAssigned ? (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400 font-light mb-3">
                                    ✓ You are assigned to this project
                                </div>
                            ) : hasApplied ? (
                                <button
                                    disabled={true}
                                    className="w-full px-4 py-3 text-sm rounded-lg transition font-light mb-3 cursor-not-allowed bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                    title="You have already applied for this project"
                                >
                                    Already Applied
                                </button>
                            ) : (
                                <button
                                    disabled={isOwner || !isAuthenticated}
                                    onClick={(e) => {
                                        if (!isAuthenticated) {
                                            e.preventDefault();
                                            navigate('/login');
                                        } else if (isOwner) {
                                            e.preventDefault();
                                        } else {
                                            setShowApplicationModal(true);
                                        }
                                    }}
                                    className={`w-full px-4 py-3 text-sm rounded-lg transition font-light mb-3 cursor-pointer ${isOwner || !isAuthenticated
                                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-600'
                                        }`}
                                    title={
                                        !isAuthenticated
                                            ? 'Login to apply for this project'
                                            : isOwner
                                                ? 'You cannot apply to your own project'
                                                : 'Apply for this project'
                                    }
                                >
                                    {!isAuthenticated ? 'Login to Apply' : isOwner ? 'Your Project' : 'Apply for this Project'}
                                </button>
                            )}

                            {/* View Workspace Button (for clients with assigned freelancer) */}
                            {isOwner && project.assignedFreelancerId && (
                                <Link
                                    to={`/project-workspace/${project._id}`}
                                    className="w-full px-4 py-3 text-sm rounded-lg transition font-light mb-3 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2"
                                >
                                    <HiOutlineBriefcase size={16} />
                                    View Workspace & Track Progress
                                </Link>
                            )}

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-2">PROJECT TIMELINE</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-light">{project.duration}</p>
                            </div>
                        </motion.div>

                        {/* Client Info */}
                        {project.clientId && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
                            >
                                <Link
                                    to={`/user/${project.clientId.username}`}
                                    className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                                >
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-3">CLIENT</p>
                                    <div className="flex items-center gap-3 mb-4">
                                        {project.clientId.avatar ? (
                                            <img
                                                src={project.clientId.avatar}
                                                alt={project.clientId.name}
                                                referrerPolicy="no-referrer"
                                                className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-light border border-gray-200 dark:border-gray-700">
                                                {project.clientId.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-light text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 transition">
                                                {project.clientId.name}
                                            </p>
                                            {project.clientId.rating > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <HiOutlineStar className="text-yellow-500" size={12} />
                                                    {project.clientId.rating.toFixed(1)} ({project.clientId.totalReviews} reviews)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {project.clientId.location && (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-light">
                                            <HiOutlineLocationMarker size={14} />
                                            {project.clientId.location}
                                        </div>
                                    )}
                                    <p className="text-xs text-green-600 dark:text-green-500 font-light mt-3">Click to view profile →</p>
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Application Modal */}
            <ApplicationModal
                isOpen={showApplicationModal}
                onClose={() => setShowApplicationModal(false)}
                project={project}
                onSuccess={() => {
                    setShowApplicationModal(false);
                    setApplicationSuccess(true);
                }}
            />
        </div>
    );
}
