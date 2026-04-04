import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    HiOutlineSearch,
    HiOutlineFilter,
    HiOutlineLocationMarker,
    HiOutlineClock,
    HiOutlineBriefcase,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineStar,
    HiX
} from 'react-icons/hi';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SEOHelmet from '../components/SEOHelmet';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function BrowseProjects() {
    const { isAuthenticated, user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [trendingProjects, setTrendingProjects] = useState([]);
    const [bestMatchProjects, setBestMatchProjects] = useState([]);
    const [userSkills, setUserSkills] = useState([]);
    const [hasSkills, setHasSkills] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [minBudget, setMinBudget] = useState('');
    const [maxBudget, setMaxBudget] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState(() => {
        // Load saved tab from localStorage, default to 'bestMatch'
        return localStorage.getItem('browseProjectsActiveTab') || 'bestMatch';
    }); // 'trending', 'bestMatch', 'all'
    const [centerCardIndex, setCenterCardIndex] = useState(0); // Track center card for carousel animation
    const carouselRef = useRef(null);
    const filterDropdownRef = useRef(null);

    const categories = [
        'All Categories',
        'Programming & Tech',
        'Graphics & Design',
        'Digital Marketing',
        'Writing & Translation',
        'Video & Animation',
        'AI Services',
        'Music & Audio',
        'Business',
        'Consulting'
    ];

    useEffect(() => {
        fetchProjects();
        if (isAuthenticated) {
            fetchUserSettings();
            fetchTrendingProjects();
        }
    }, [selectedCategory, minBudget, maxBudget, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && userSkills.length > 0) {
            fetchBestMatches();
        }
    }, [userSkills, isAuthenticated]);

    // Save active tab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('browseProjectsActiveTab', activeTab);
    }, [activeTab]);

    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };

        if (showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE_URL}/api/projects?status=open`;

            if (selectedCategory && selectedCategory !== 'All Categories') {
                url += `&category=${encodeURIComponent(selectedCategory)}`;
            }
            if (minBudget) {
                url += `&minBudget=${minBudget}`;
            }
            if (maxBudget) {
                url += `&maxBudget=${maxBudget}`;
            }
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }

            const response = await axios.get(url);
            setProjects(response.data.projects || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserSettings = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/settings`, {
                headers: { Authorization: token }
            });

            const primarySkills = response.data.settings?.skills?.primarySkills || [];
            const secondarySkills = response.data.settings?.skills?.secondarySkills || [];
            const allSkills = [...primarySkills, ...secondarySkills];

            setUserSkills(allSkills);
            setHasSkills(allSkills.length > 0);
        } catch (error) {
            console.error('Error fetching user settings:', error);
            setUserSkills([]);
            setHasSkills(false);
        }
    };

    const fetchTrendingProjects = async () => {
        try {
            const url = `${API_BASE_URL}/api/projects?status=open&limit=6`;
            const response = await axios.get(url);
            setTrendingProjects(response.data.projects || []);
        } catch (error) {
            console.error('Error fetching trending projects:', error);
        }
    };

    const fetchBestMatches = async () => {
        try {
            // Fetch all open projects
            const url = `${API_BASE_URL}/api/projects?status=open`;
            const response = await axios.get(url);
            const allProjects = response.data.projects || [];

            // Filter projects that match user skills
            const matchedProjects = allProjects.filter(project => {
                const projectSkills = project.skillsRequired || [];
                // Check if any project skill matches any user skill (case-insensitive)
                return projectSkills.some(projectSkill =>
                    userSkills.some(userSkill =>
                        projectSkill.toLowerCase().includes(userSkill.toLowerCase()) ||
                        userSkill.toLowerCase().includes(projectSkill.toLowerCase())
                    )
                );
            });

            // Sort by number of matching skills and take top 3
            const sortedMatches = matchedProjects.sort((a, b) => {
                const aMatches = a.skillsRequired.filter(skill =>
                    userSkills.some(userSkill =>
                        skill.toLowerCase().includes(userSkill.toLowerCase()) ||
                        userSkill.toLowerCase().includes(skill.toLowerCase())
                    )
                ).length;

                const bMatches = b.skillsRequired.filter(skill =>
                    userSkills.some(userSkill =>
                        skill.toLowerCase().includes(userSkill.toLowerCase()) ||
                        userSkill.toLowerCase().includes(skill.toLowerCase())
                    )
                ).length;

                return bMatches - aMatches;
            });

            setBestMatchProjects(sortedMatches.slice(0, 3));
        } catch (error) {
            console.error('Error fetching best matches:', error);
            setBestMatchProjects([]);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProjects();
    };

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const cardWidth = 320 + 24; // 320px card + 24px gap
            const currentIndex = centerCardIndex;
            const newIndex = direction === 'left'
                ? Math.max(0, currentIndex - 1)
                : Math.min(trendingProjects.length - 1, currentIndex + 1);

            // Add 1 card width to account for the left spacer
            const scrollPosition = (newIndex * cardWidth);
            carouselRef.current.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
            setCenterCardIndex(newIndex);
        }
    };

    // Set initial scroll position to center first card
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel || trendingProjects.length === 0) return;

        // Scroll to show first card centered (accounting for left spacer)
        const cardWidth = 320 + 24; // 320px card + 24px gap
        carousel.scrollLeft = cardWidth; // Skip the spacer
    }, [trendingProjects]);

    // Track centered card on scroll
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const handleScroll = () => {
            const cardWidth = 320 + 24; // 320px card + 24px gap
            const scrollLeft = carousel.scrollLeft;
            const centerIndex = Math.round(scrollLeft / cardWidth);
            setCenterCardIndex(centerIndex);
        };

        carousel.addEventListener('scroll', handleScroll);
        return () => carousel.removeEventListener('scroll', handleScroll);
    }, [trendingProjects]);

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
        <div className="min-h-screen bg-transparent transition-colors duration-200">
            <SEOHelmet
                title="Browse Projects - Find Freelance Work | FreelanceCo"
                description="Discover and apply for freelance projects on FreelanceCo. Browse thousands of opportunities across programming, design, writing, video editing, and more."
                keywords="freelance projects, find work, freelance jobs, remote jobs, programming projects, design projects, freelance opportunities"
            />
            <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 glass-surface rounded-2xl p-5 md:p-6 shadow-lg shadow-emerald-900/10"
                >
                    {/* Header with Title and Search Controls */}
                    <div className="flex items-center justify-between gap-6 mb-6">
                        {/* Left: Title */}
                        <div>
                            <h1 className="text-3xl text-left font-semibold text-slate-800 dark:text-slate-100">Explore Projects</h1>
                            <p className="text-slate-600 dark:text-slate-300 text-left text-xs">Find the perfect project for you</p>
                        </div>

                        {/* Right: Search Bar */}
                        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 justify-end relative">
                            {/* Active Filter Tags - LEFT SIDE in RTL order */}
                            <div className="flex items-center gap-1.5 flex-row-reverse">
                                {selectedCategory && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-md font-light">
                                        {selectedCategory}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('')}
                                            className="hover:text-green-900 dark:hover:text-green-200 transition cursor-pointer"
                                            title="Remove category filter"
                                        >
                                            <HiX size={12} />
                                        </button>
                                    </span>
                                )}
                                {minBudget && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-md font-light">
                                        Min: ₹{parseInt(minBudget).toLocaleString()}
                                        <button
                                            type="button"
                                            onClick={() => setMinBudget('')}
                                            className="hover:text-blue-900 dark:hover:text-blue-200 transition cursor-pointer"
                                            title="Remove min budget filter"
                                        >
                                            <HiX size={12} />
                                        </button>
                                    </span>
                                )}
                                {maxBudget && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-md font-light">
                                        Max: ₹{parseInt(maxBudget).toLocaleString()}
                                        <button
                                            type="button"
                                            onClick={() => setMaxBudget('')}
                                            className="hover:text-purple-900 dark:hover:text-purple-200 transition cursor-pointer"
                                            title="Remove max budget filter"
                                        >
                                            <HiX size={12} />
                                        </button>
                                    </span>
                                )}
                            </div>

                            {/* Search Input with Embedded Controls */}
                            <div ref={filterDropdownRef} className="relative w-72 shrink-0">
                                {/* Filter Button - Inside Left */}
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition cursor-pointer z-10 ${showFilters ? 'text-green-600 dark:text-green-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                                        }`}
                                    title="Toggle Filters"
                                >
                                    <HiOutlineFilter size={18} />
                                </button>

                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search projects..."
                                    className="w-full pl-11 pr-11 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                />

                                {/* Search Button - Inside Right */}
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-500 transition cursor-pointer z-10"
                                    title="Search"
                                >
                                    <HiOutlineSearch size={18} />
                                </button>

                                {/* Filter Dropdown */}
                                {showFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full mt-2 left-0 w-full glass-surface rounded-lg shadow-lg p-4 z-50"
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-light">Category</label>
                                                <select
                                                    value={selectedCategory}
                                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                                    className="h-10 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                >
                                                    {categories.map((cat) => (
                                                        <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                                                            {cat}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-light">Min Budget (₹)</label>
                                                <input
                                                    type="number"
                                                    value={minBudget}
                                                    onChange={(e) => setMinBudget(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-light">Max Budget (₹)</label>
                                                <input
                                                    type="number"
                                                    value={maxBudget}
                                                    onChange={(e) => setMaxBudget(e.target.value)}
                                                    placeholder="Any"
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </form>
                    </div>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="flex gap-2 p-1 rounded-lg w-fit glass-surface">
                        {isAuthenticated && (
                            <button
                                onClick={() => setActiveTab('bestMatch')}
                                className={`px-6 py-1 text-sm font-normal rounded-md transition-all cursor-pointer ${activeTab === 'bestMatch'
                                    ? 'bg-white/90 dark:bg-emerald-950/70 text-slate-800 dark:text-slate-100 shadow-lg border border-emerald-200 dark:border-emerald-700/60'
                                    : 'bg-transparent text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300'
                                    }`}
                            >
                                Best Match
                            </button>
                        )}
                        {isAuthenticated && (
                            <button
                                onClick={() => setActiveTab('trending')}
                                className={`px-6 py-1 text-sm font-normal rounded-md transition-all cursor-pointer ${activeTab === 'trending'
                                    ? 'bg-white/90 dark:bg-emerald-950/70 text-slate-800 dark:text-slate-100 shadow-lg border border-emerald-200 dark:border-emerald-700/60'
                                    : 'bg-transparent text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300'
                                    }`}
                            >
                                Trending
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-1 text-sm font-normal rounded-md transition-all cursor-pointer ${activeTab === 'all'
                                ? 'bg-white/90 dark:bg-emerald-950/70 text-slate-800 dark:text-slate-100 shadow-lg border border-emerald-200 dark:border-emerald-700/60'
                                : 'bg-transparent text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300'
                                }`}
                        >
                            All Projects
                        </button>
                    </div>
                </motion.div>

                {/* Tab Content */}
                <div>
                    {/* Trending Tab */}
                    {activeTab === 'trending' && isAuthenticated && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {trendingProjects.length === 0 ? (
                                <div className="text-center py-16 glass-surface rounded-lg">
                                    <HiOutlineBriefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-light">No trending projects available</p>
                                </div>
                            ) : (
                                <div className="relative px-12">
                                    {/* Left Navigation Button */}
                                    <button
                                        onClick={() => scrollCarousel('left')}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 glass-surface rounded-full hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 transition cursor-pointer shadow-md flex items-center justify-center"
                                    >
                                        <HiOutlineChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
                                    </button>

                                    {/* Right Navigation Button */}
                                    <button
                                        onClick={() => scrollCarousel('right')}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 glass-surface rounded-full hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 transition cursor-pointer shadow-md flex items-center justify-center"
                                    >
                                        <HiOutlineChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                                    </button>

                                    {/* Carousel */}
                                    <div
                                        ref={carouselRef}
                                        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 snap-x snap-mandatory"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {/* Left Spacer - to allow first card to be centered */}
                                        <div className="shrink-0 w-80 opacity-0 pointer-events-none"></div>

                                        {trendingProjects.map((project, index) => {
                                            const isCentered = index === centerCardIndex;
                                            return (
                                                <div
                                                    key={project._id}
                                                    className="shrink-0 w-80 transition-all duration-500 ease-out snap-center"
                                                    style={{
                                                        transform: isCentered ? 'scale(1)' : 'scale(0.85)',
                                                        opacity: isCentered ? 1 : 0.6,
                                                    }}
                                                >
                                                    <TrendingProjectCard
                                                        project={project}
                                                        index={index}
                                                        getTimeSince={getTimeSince}
                                                        isCentered={isCentered}
                                                    />
                                                </div>
                                            );
                                        })}

                                        {/* Right Spacer - to allow last card to be centered */}
                                        <div className="shrink-0 w-80 opacity-0 pointer-events-none"></div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Best Match Tab */}
                    {activeTab === 'bestMatch' && isAuthenticated && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {!hasSkills ? (
                                <div className="glass-surface rounded-lg p-8 text-center">
                                    <HiOutlineStar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-base text-gray-700 dark:text-gray-300 font-light mb-4">
                                        Please specify your skills to see personalized project matches
                                    </p>
                                    <Link
                                        to="/settings"
                                        className="inline-flex items-center gap-2 px-4 py-1 text-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-light cursor-pointer text-gray-700 dark:text-gray-300"
                                    >
                                        <HiOutlineStar size={16} />
                                        Go to Settings
                                    </Link>
                                </div>
                            ) : bestMatchProjects.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {bestMatchProjects.map((project, index) => (
                                        <ProjectCard key={project._id} project={project} index={index} getTimeSince={getTimeSince} highlight />
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-surface rounded-lg p-8 text-center">
                                    <HiOutlineBriefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-base text-gray-600 dark:text-gray-300 font-light mb-2">
                                        No matching projects found
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 font-light">
                                        Try updating your skills in settings to see more relevant projects
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* All Projects Tab */}
                    {activeTab === 'all' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {loading ? (
                                <div className="text-center py-16">
                                    <div className="inline-block w-10 h-10 border-2 border-green-600 dark:border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-light">Loading projects...</p>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="text-center py-16 glass-surface rounded-lg">
                                    <HiOutlineBriefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 dark:text-gray-300 font-light mb-1">No projects found</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-light">Try adjusting your filters</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {projects.map((project, index) => (
                                        <motion.div
                                            key={project._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                        >
                                            <Link
                                                to={`/projects/${project._id}`}
                                                className="flex border border-emerald-100/70 dark:border-emerald-900/50 rounded-lg overflow-hidden hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-900/10 transition-all glass-surface group"
                                            >
                                                {/* Thumbnail */}
                                                {project.thumbnail ? (
                                                    <img
                                                        src={project.thumbnail}
                                                        alt={project.title}
                                                        className="w-48 h-36 object-cover bg-gray-100 dark:bg-gray-800 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="text-center w-48 h-36 bg-linear-to-br from-emerald-50 to-lime-50 dark:from-emerald-900/30 dark:to-slate-900 flex items-center justify-center shrink-0">
                                                        <HiOutlineBriefcase size={32} className="text-gray-300 dark:text-gray-600" />
                                                    </div>
                                                )}

                                                {/* Content */}
                                                <div className="flex-1 p-4 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <h3 className="text-left text-base font-normal text-gray-800 dark:text-gray-200 mb-1.5 line-clamp-1 group-hover:text-green-600 dark:group-hover:text-green-500 transition">
                                                                    {project.title}
                                                                </h3>
                                                                <span className="text-left inline-block px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-md font-light">
                                                                    {project.category}
                                                                </span>
                                                            </div>
                                                            <div className="text-left ml-4">
                                                                <div className="text-left text-base font-normal text-gray-800 dark:text-gray-200">
                                                                    ₹{project.budget.min.toLocaleString()}+
                                                                </div>
                                                                <div className="text-right text-xs text-gray-400 dark:text-gray-500 font-light">{project.budget.type}</div>
                                                            </div>
                                                        </div>
                                                        <p className="text-left text-sm text-gray-600 dark:text-gray-400 line-clamp-2 font-light mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            {project.description}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {project.skillsRequired.slice(0, 4).map((skill, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded border border-gray-100 dark:border-gray-700 font-light"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                            {project.skillsRequired.length > 4 && (
                                                                <span className="px-2 py-0.5 text-gray-400 dark:text-gray-500 text-xs font-light">
                                                                    +{project.skillsRequired.length - 4}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 font-light ml-4">
                                                            <div className="flex items-center gap-1">
                                                                <HiOutlineClock size={14} />
                                                                {getTimeSince(project.createdAt)}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <HiOutlineLocationMarker size={14} />
                                                                {project.proposalCount} proposals
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Trending Project Card Component for Carousel
function TrendingProjectCard({ project, index, getTimeSince }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="h-full"
        >
            <Link
                to={`/projects/${project._id}`}
                className="block border border-emerald-100/80 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-emerald-900/10 transition-all glass-surface group h-full"
            >
                {/* Large Thumbnail - Top */}
                <div className="w-full h-60 bg-gray-100 dark:bg-gray-800">
                    {project.thumbnail ? (
                        <img
                            src={project.thumbnail}
                            alt={project.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-linear-to-br from-emerald-100 to-lime-50 dark:from-emerald-900/30 dark:to-slate-900 flex items-center justify-center">
                            <HiOutlineBriefcase size={56} className="text-gray-300 dark:text-gray-600" />
                        </div>
                    )}
                </div>

                {/* Content - Bottom */}
                <div className="p-5">
                    {/* Title */}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 group-hover:text-green-600 dark:group-hover:text-green-500 transition line-clamp-2 min-h-14">
                        {project.title}
                    </h3>

                    {/* Category Badge */}
                    <span className="inline-block px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-light mb-3">
                        {project.category}
                    </span>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4 line-clamp-2 min-h-10">
                        {project.description}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-4 min-h-6">
                        {project.skillsRequired.slice(0, 3).map((skill, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-md font-light"
                            >
                                {skill}
                            </span>
                        ))}
                        {project.skillsRequired.length > 3 && (
                            <span className="px-2 py-1 text-gray-400 dark:text-gray-500 text-xs font-light">
                                +{project.skillsRequired.length - 3}
                            </span>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                ₹{project.budget.min.toLocaleString()}+
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 font-light">{project.budget.type}</div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 font-light">
                            <div className="flex items-center gap-1">
                                <HiOutlineClock size={12} />
                                {getTimeSince(project.createdAt)}
                            </div>
                            <div>
                                {project.proposalCount} proposals
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// Reusable Project Card Component
function ProjectCard({ project, index, getTimeSince, highlight = false }) {
    // Horizontal sleek card for Best Match (highlight === true)
    if (highlight) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
            >
                <Link
                    to={`/projects/${project._id}`}
                    className="flex border border-emerald-100/80 dark:border-emerald-900/50 dark:hover:border-emerald-600 hover:border-emerald-400 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-emerald-900/10 transition-all glass-surface group h-full"
                >
                    {/* Thumbnail - Left Side */}
                    <div className="w-32 h-40 shrink-0 bg-gray-100 dark:bg-gray-800">
                        {project.thumbnail ? (
                            <img
                                src={project.thumbnail}
                                alt={project.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-linear-to-br from-emerald-100 to-lime-50 dark:from-emerald-900/30 dark:to-slate-900 flex items-center justify-center">
                                <HiOutlineBriefcase size={28} className="text-gray-300 dark:text-gray-600" />
                            </div>
                        )}
                    </div>

                    {/* Content - Right Side */}
                    <div className="flex-1 p-4 flex flex-col justify-between text-left">
                        {/* Header */}
                        <div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1 group-hover:text-green-600 dark:group-hover:text-green-500 transition line-clamp-1">
                                {project.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-light mb-3 line-clamp-2">
                                {project.description}
                            </p>
                        </div>

                        {/* Stats & Info */}
                        <div className="space-y-2">
                            {/* Skills & Metrics */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Budget Badge */}
                                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                                    <HiOutlineBriefcase size={12} className="text-green-600 dark:text-green-500" />
                                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                        ₹{project.budget.min.toLocaleString()}+
                                    </span>
                                </div>

                                {/* Proposal Count Badge */}
                                <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">
                                    <HiOutlineClock size={12} className="text-orange-600 dark:text-orange-500" />
                                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                        {project.proposalCount}
                                    </span>
                                </div>

                                {/* Time Badge */}
                                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                    <span>{getTimeSince(project.createdAt)}</span>
                                </div>
                            </div>

                            {/* Skills Tags */}
                            <div className="flex flex-wrap gap-1">
                                {project.skillsRequired.slice(0, 3).map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full font-light"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {project.skillsRequired.length > 3 && (
                                    <span className="px-2 py-0.5 text-gray-400 dark:text-gray-500 text-xs font-light">
                                        +{project.skillsRequired.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
            </motion.div>
        );
    }

    // Vertical card for other sections (Trending, All Projects)
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
        >
            <Link
                to={`/projects/${project._id}`}
                className="block border rounded-lg overflow-hidden hover:shadow-md transition-all h-full border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
            >
                {/* Thumbnail */}
                {project.thumbnail ? (
                    <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full object-cover bg-gray-100 dark:bg-gray-800 h-40"
                    />
                ) : (
                    <div className="w-full h-40 bg-linear-to-br from-emerald-50 to-lime-50 dark:from-emerald-900/30 dark:to-slate-900 flex items-center justify-center">
                        <HiOutlineBriefcase size={36} className="text-gray-300 dark:text-gray-600" />
                    </div>
                )}

                <div className="p-4">
                    <div className="mb-3">
                        <h3 className="text-base min-h-12 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-500 font-light mb-1.5 line-clamp-2 transition">
                            {project.title}
                        </h3>
                        <span className="inline-block px-2 py-0.5 text-xs rounded-md font-light bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            {project.category}
                        </span>
                    </div>

                    <p className="text-sm mb-3 min-h-10 text-gray-600 dark:text-gray-400 line-clamp-2 font-light">
                        {project.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 min-h-6 mb-3">
                        {project.skillsRequired.slice(0, 3).map((skill, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded border border-gray-100 dark:border-gray-700 font-light"
                            >
                                {skill}
                            </span>
                        ))}
                        {project.skillsRequired.length > 3 && (
                            <span className="px-2 py-0.5 text-gray-400 dark:text-gray-500 text-xs font-light">
                                +{project.skillsRequired.length - 3}
                            </span>
                        )}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-base font-light text-gray-700 dark:text-gray-300">
                                ₹{project.budget.min.toLocaleString()}+
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 font-light">{project.budget.type}</div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 font-light">
                            <div className="flex items-center gap-1">
                                <HiOutlineClock size={12} />
                                {getTimeSince(project.createdAt)}
                            </div>
                            <div>
                                {project.proposalCount} proposals
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
