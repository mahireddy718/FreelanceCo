import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    HiOutlineSearch,
    HiOutlineFilter,
    HiX
} from 'react-icons/hi';
import { FiMapPin, FiStar, FiBriefcase, FiUser } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SEOHelmet from '../components/SEOHelmet';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function FindFreelancers() {
    const [freelancers, setFreelancers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('');
    const [minRate, setMinRate] = useState('');
    const [maxRate, setMaxRate] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const { user } = useAuth();
    const filterDropdownRef = useRef(null);

    const popularSkills = [
        'All Skills',
        'JavaScript',
        'React',
        'Node.js',
        'Python',
        'Java',
        'UI/UX Design',
        'Graphic Design',
        'Content Writing',
        'SEO',
        'Video Editing'
    ];

    useEffect(() => {
        fetchFreelancers();
    }, [selectedSkill, minRate, maxRate]);

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

    const fetchFreelancers = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE_URL}/api/users/search?`;

            const params = [];
            if (selectedSkill && selectedSkill !== 'All Skills') {
                params.push(`skills=${encodeURIComponent(selectedSkill)}`);
            }
            if (minRate) {
                params.push(`minRate=${minRate}`);
            }
            if (maxRate) {
                params.push(`maxRate=${maxRate}`);
            }
            if (searchTerm) {
                params.push(`search=${encodeURIComponent(searchTerm)}`);
            }
            // Exclude current user if logged in
            if (user?.userId) {
                params.push(`excludeUserId=${user.userId}`);
            }

            url += params.join('&');

            const response = await axios.get(url);
            setFreelancers(response.data.freelancers || []);
        } catch (error) {
            console.error('Error fetching freelancers:', error);
            setFreelancers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchFreelancers();
    };

    return (
        <div className="min-h-screen bg-transparent transition-colors duration-200">
            <SEOHelmet
                title="Find Freelancers - Hire Expert Talent | FreelanceCo"
                description="Find and hire top freelance talent on FreelanceCo. Browse skilled professionals in programming, design, writing, marketing, and more. Get your project done right."
                keywords="hire freelancers, find talent, freelance experts, remote workers, hire developers, hire designers, freelance marketplace"
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
                            <h1 className="text-left text-3xl font-semibold text-slate-800 dark:text-slate-100">Find Freelancers</h1>
                            <p className="text-left text-xs text-slate-600 dark:text-slate-300 font-normal">Discover talented professionals for your projects</p>
                        </div>

                        {/* Right: Search Bar */}
                        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 justify-end relative">
                            {/* Active Filter Tags - LEFT SIDE in RTL order */}
                            <div className="flex items-center gap-1.5 flex-row-reverse">
                                {selectedSkill && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-md font-light">
                                        {selectedSkill}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSkill('')}
                                            className="hover:text-green-900 dark:hover:text-green-200 transition cursor-pointer"
                                            title="Remove skill filter"
                                        >
                                            <HiX size={12} />
                                        </button>
                                    </span>
                                )}
                                {minRate && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-md font-light">
                                        Min: ₹{parseInt(minRate).toLocaleString()}/hr
                                        <button
                                            type="button"
                                            onClick={() => setMinRate('')}
                                            className="hover:text-blue-900 dark:hover:text-blue-200 transition cursor-pointer"
                                            title="Remove min rate filter"
                                        >
                                            <HiX size={12} />
                                        </button>
                                    </span>
                                )}
                                {maxRate && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-md font-light">
                                        Max: ₹{parseInt(maxRate).toLocaleString()}/hr
                                        <button
                                            type="button"
                                            onClick={() => setMaxRate('')}
                                            className="hover:text-purple-900 dark:hover:text-purple-200 transition cursor-pointer"
                                            title="Remove max rate filter"
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
                                    placeholder="Search freelancers..."
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
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-light">Skill</label>
                                                <select
                                                    value={selectedSkill}
                                                    onChange={(e) => setSelectedSkill(e.target.value)}
                                                    className="h-10 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                >
                                                    {popularSkills.map((skill) => (
                                                        <option key={skill} value={skill === 'All Skills' ? '' : skill}>
                                                            {skill}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-light">Min Rate (₹/hr)</label>
                                                <input
                                                    type="number"
                                                    value={minRate}
                                                    onChange={(e) => setMinRate(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-light">Max Rate (₹/hr)</label>
                                                <input
                                                    type="number"
                                                    value={maxRate}
                                                    onChange={(e) => setMaxRate(e.target.value)}
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

                {/* Freelancers Grid */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block w-10 h-10 border-2 border-green-600 dark:border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-light">Finding freelancers...</p>
                    </div>
                ) : freelancers.length === 0 ? (
                    <div className="text-center py-16 glass-surface rounded-lg">
                        <FiUser className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-light mb-1">No freelancers found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-light">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {freelancers.map((freelancer, index) => (
                            <motion.div
                                key={freelancer._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.03, y: -5 }}
                                className="group"
                            >
                                <Link
                                    to={`/user/${freelancer.username}`}
                                    className="glass-surface rounded-lg border border-emerald-100/80 dark:border-emerald-900/50 p-4 transition-all duration-300 h-60 flex flex-col relative overflow-hidden cursor-pointer group-hover:shadow-xl group-hover:shadow-emerald-900/10 group-hover:border-emerald-300 dark:group-hover:border-emerald-700"
                                >
                                    {/* Hover Gradient Overlay */}
                                    <div className="absolute inset-0 bg-linear-to-br from-emerald-50/0 via-lime-50/0 to-emerald-100/0 group-hover:from-emerald-50/60 group-hover:via-lime-50/40 group-hover:to-emerald-100/55 dark:from-emerald-900/0 dark:via-emerald-900/0 dark:to-slate-900/0 dark:group-hover:from-emerald-900/45 dark:group-hover:via-emerald-900/30 dark:group-hover:to-slate-900/50 transition-all duration-500 pointer-events-none" />

                                    {/* Content Container */}
                                    <div className="relative z-10 flex flex-col h-full">
                                        {/* Avatar and Name */}
                                        <motion.div
                                            className="text-center mb-3"
                                            initial={false}
                                            animate={{ y: 0 }}
                                            whileHover={{ y: -3 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {freelancer.avatar ? (
                                                <motion.img
                                                    src={freelancer.avatar}
                                                    alt={freelancer.name}
                                                    className="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2 border-gray-100 dark:border-gray-800 group-hover:border-gray-200 dark:group-hover:border-gray-700 transition-all duration-300"
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                />
                                            ) : (
                                                <motion.div
                                                    className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg font-light mx-auto mb-2 border-2 border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-all duration-300"
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                >
                                                    {freelancer.name.charAt(0).toUpperCase()}
                                                </motion.div>
                                            )}
                                            <h3 className="text-sm font-light text-gray-800 dark:text-gray-200 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors duration-300 truncate">
                                                {freelancer.name}
                                            </h3>
                                            {freelancer.location && (
                                                <motion.div
                                                    className="flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                                                    initial={{ opacity: 0.7 }}
                                                    whileHover={{ opacity: 1 }}
                                                >
                                                    <FiMapPin className="w-3 h-3" />
                                                    <span className="truncate font-light">{freelancer.location}</span>
                                                </motion.div>
                                            )}
                                        </motion.div>

                                        {/* Bio */}
                                        <div className="grow">
                                            <motion.p
                                                className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2 text-center font-light group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300"
                                                initial={{ opacity: 0.8 }}
                                                whileHover={{ opacity: 1 }}
                                            >
                                                {freelancer.bio || 'No bio provided'}
                                            </motion.p>

                                            {/* Skills */}
                                            <div className="flex flex-wrap gap-1 mb-3 justify-center">
                                                {freelancer.skills.slice(0, 3).map((skill, idx) => (
                                                    <motion.span
                                                        key={idx}
                                                        className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full font-light border border-gray-100 dark:border-gray-700 group-hover:bg-green-50 dark:group-hover:bg-green-900/30 group-hover:text-green-700 dark:group-hover:text-green-400 group-hover:border-green-200 dark:group-hover:border-green-700 transition-all duration-300"
                                                        whileHover={{ scale: 1.05 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                    >
                                                        {skill}
                                                    </motion.span>
                                                ))}
                                                {freelancer.skills.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full font-light border border-gray-100 dark:border-gray-700 group-hover:bg-green-50 dark:group-hover:bg-green-900/30 group-hover:text-green-700 dark:group-hover:text-green-400 group-hover:border-green-200 dark:group-hover:border-green-700 transition-all duration-300">
                                                        +{freelancer.skills.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <motion.div
                                            className="pt-3 border-t border-gray-100 dark:border-gray-800 group-hover:border-green-200 dark:group-hover:border-green-700 transition-colors duration-300"
                                            initial={{ opacity: 1 }}
                                            whileHover={{ opacity: 1 }}
                                        >
                                            <div className="flex items-center justify-around text-center">
                                                {/* Rating */}
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                        <FiStar className="w-3 h-3 text-yellow-500 dark:text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-300" />
                                                        <span className="text-xs font-light text-gray-700 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-400 group-hover:font-normal transition-all duration-300">
                                                            {freelancer.rating > 0 ? freelancer.rating.toFixed(1) : 'New'}
                                                        </span>
                                                    </div>
                                                </motion.div>

                                                {/* Rate */}
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                        <span className="text-xs font-light text-gray-700 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-400 group-hover:font-normal transition-all duration-300">
                                                            ₹{freelancer.hourlyCharges || 0}/hr
                                                        </span>
                                                    </div>
                                                </motion.div>

                                                {/* Projects */}
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                        <FiBriefcase className="w-3 h-3 text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors duration-300" />
                                                        <span className="text-xs font-light text-gray-700 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-400 group-hover:font-normal transition-all duration-300">
                                                            {freelancer.completedProjects || 0}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </motion.div>

                                        {/* Hover Detail Overlay - appears on hover */}
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-white/95 via-white/90 to-transparent dark:from-gray-900/95 dark:via-gray-900/90 dark:to-transparent backdrop-blur-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                            initial={{ y: 20 }}
                                            whileHover={{ y: 0 }}
                                        >
                                            <div className="text-center">
                                                <p className="text-xs text-green-600 dark:text-green-500 font-light">
                                                    Click to view profile →
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
