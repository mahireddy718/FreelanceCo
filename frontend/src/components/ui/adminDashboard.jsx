import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineChartBar,
    HiOutlineUsers,
    HiOutlineHome,
    HiOutlineExternalLink,
    HiOutlineLogout,
    HiOutlineUserGroup,
    HiOutlineBriefcase,
    HiOutlineCode,
    HiOutlineRefresh,
    HiOutlineTrendingUp,
    HiOutlineStar,
    HiOutlineCheckCircle,
    HiOutlineCog,
    HiOutlineX,
    HiOutlineViewGrid,
    HiOutlineViewList
} from 'react-icons/hi';
import './admindashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Interactive Chart Component
const InteractiveChart = ({ data, timePeriod }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const svgRef = useRef(null);

    if (!data || data.length === 0) return <div>No data available</div>;

    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const minCount = Math.min(...data.map(d => d.count), 0);

    // Calculate smooth curve path
    const getSmoothPath = () => {
        const points = data.map((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * (width - padding.left - padding.right);
            const y = height - padding.bottom - ((d.count - minCount) / (maxCount - minCount || 1)) * (height - padding.top - padding.bottom);
            return { x, y, data: d };
        });

        if (points.length < 2) return { line: '', area: '', points: [] };

        // Create smooth curve using cardinal spline
        let linePath = `M ${points[0].x} ${points[0].y}`;
        let areaPath = `M ${points[0].x} ${height - padding.bottom}`;
        areaPath += ` L ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 3;
            const cp1y = points[i].y;
            const cp2x = points[i + 1].x - (points[i + 1].x - points[i].x) / 3;
            const cp2y = points[i + 1].y;

            linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
            areaPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
        }

        areaPath += ` L ${points[points.length - 1].x} ${height - padding.bottom} Z`;

        return { line: linePath, area: areaPath, points };
    };

    const { line, area, points } = getSmoothPath();

    const handleMouseMove = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Find nearest point
        let nearest = null;
        let minDist = Infinity;
        points.forEach((p, i) => {
            const dist = Math.abs(p.x - x);
            if (dist < minDist && dist < 30) {
                minDist = dist;
                nearest = { ...p, index: i };
            }
        });

        setHoveredPoint(nearest);
        if (nearest) {
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="chart-wrapper" onMouseLeave={() => setHoveredPoint(null)}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                className="area-chart-svg"
            >
                <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#18181b" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#18181b" stopOpacity="0.02" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Area fill */}
                <path
                    d={area}
                    fill="url(#areaGradient)"
                    opacity="0.9"
                />

                {/* Line */}
                <path
                    d={line}
                    fill="none"
                    stroke="#18181b"
                    strokeWidth="2"
                />

                {/* Data points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredPoint?.index === i ? 5 : 3}
                        fill="#18181b"
                        stroke="#fff"
                        strokeWidth={hoveredPoint?.index === i ? 2 : 1}
                        className="chart-point"
                        style={{ transition: 'all 0.2s' }}
                    />
                ))}

                {/* Y-axis labels */}
                {[0, 0.5, 1].map((ratio) => {
                    const y = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
                    const value = Math.round(minCount + ratio * (maxCount - minCount));
                    return (
                        <text
                            key={ratio}
                            x={padding.left - 10}
                            y={y}
                            textAnchor="end"
                            fontSize="12"
                            fill="#7a7a7a"
                            dy="0.3em"
                        >
                            {value}
                        </text>
                    );
                })}

                {/* X-axis labels */}
                {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1).map((p, i) => (
                    <text
                        key={i}
                        x={p.x}
                        y={height - padding.bottom + 20}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#7a7a7a"
                    >
                        {formatDate(p.data.date)}
                    </text>
                ))}
            </svg>

            {/* Tooltip */}
            {hoveredPoint && (
                <div
                    className="chart-tooltip"
                    style={{
                        left: `${tooltipPos.x}px`,
                        top: `${tooltipPos.y - 60}px`,
                    }}
                >
                    <div className="tooltip-date">{formatDate(hoveredPoint.data.date)}</div>
                    <div className="tooltip-value">{hoveredPoint.data.count} users</div>
                </div>
            )}
        </div>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('dashboard');
    const [timePeriod, setTimePeriod] = useState('7'); // '7', '30', '90'
    const [stats, setStats] = useState({
        totalUsers: 0,
        clientCount: 0,
        freelancerCount: 0,
        bothCount: 0,
        recentUsers: 0
    });
    const [chartData, setChartData] = useState([]);
    const [users, setUsers] = useState([]);
    const [freelancers, setFreelancers] = useState([]);
    const [freelancerStats, setFreelancerStats] = useState(null);
    const [filters, setFilters] = useState({
        verified: '',
        experienceLevel: '',
        banned: ''
    });
    const [userRoleFilter, setUserRoleFilter] = useState(''); // 'client', 'freelancer', 'both', or ''
    const [selectedUser, setSelectedUser] = useState(null); // For slide-in panel
    const [selectedFreelancer, setSelectedFreelancer] = useState(null); // For slide-in panel
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
        fetchChartData();
    }, []);

    useEffect(() => {
        if (activeView === 'users') {
            fetchUsers();
        } else if (activeView === 'freelancers') {
            fetchFreelancers();
            fetchFreelancerStats();
        }
    }, [activeView, userRoleFilter]);

    useEffect(() => {
        if (activeView === 'freelancers') {
            fetchFreelancers();
        }
    }, [filters]);

    useEffect(() => {
        fetchChartData();
    }, [timePeriod]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch statistics');

            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchChartData = async () => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE_URL}/api/admin/user-growth?days=${timePeriod}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch chart data');

            const data = await response.json();
            if (data.success) {
                setChartData(data.data);
            }
        } catch (err) {
            console.error('Chart data error:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            if (data.success) {
                // Filter users based on userRoleFilter if set
                let filteredUsers = data.users;
                if (userRoleFilter) {
                    filteredUsers = data.users.filter(user => user.role === userRoleFilter);
                }
                setUsers(filteredUsers);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                fetchUsers();
                alert('User deleted successfully');
            }
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleBanUser = async (userId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                fetchUsers();
                alert('User banned successfully');
            }
        } catch (err) {
            alert('Failed to ban user');
        }
    };

    const handleUnbanUser = async (userId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unban`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                fetchUsers();
                alert('User unbanned successfully');
            }
        } catch (err) {
            alert('Failed to unban user');
        }
    };

    const fetchFreelancers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            const queryParams = new URLSearchParams();
            if (filters.verified) queryParams.append('verified', filters.verified);
            if (filters.experienceLevel) queryParams.append('experienceLevel', filters.experienceLevel);
            if (filters.banned) queryParams.append('banned', filters.banned);

            const response = await fetch(`${API_BASE_URL}/api/admin/freelancers?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch freelancers');

            const data = await response.json();
            if (data.success) {
                setFreelancers(data.freelancers);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchFreelancerStats = async () => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE_URL}/api/admin/freelancers/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch freelancer stats');

            const data = await response.json();
            if (data.success) {
                setFreelancerStats(data.stats);
            }
        } catch (err) {
            console.error('Freelancer stats error:', err);
        }
    };

    const handleVerifyFreelancer = async (freelancerId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/admin/freelancers/${freelancerId}/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                fetchFreelancers();
                fetchFreelancerStats();
                alert('Freelancer verified successfully');
            }
        } catch (err) {
            alert('Failed to verify freelancer');
        }
    };

    const handleUnverifyFreelancer = async (freelancerId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/admin/freelancers/${freelancerId}/unverify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                fetchFreelancers();
                fetchFreelancerStats();
                alert('Freelancer unverified successfully');
            }
        } catch (err) {
            alert('Failed to unverify freelancer');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        navigate('/login');
    };

    if (loading && chartData.length === 0) {
        return (
            <div className="admin-dashboard-root">
                <div className="dashboard-container">
                    <div className="main-content">
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <p>Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-root">
            <div className="dashboard-container">
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="sidebar-logo">
                        <div className="logo-icon">P</div>
                        <span>FreelanceCo Admin</span>
                    </div>

                    <div className="nav-section">
                        <div className="nav-label">MAIN</div>
                        <div
                            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveView('dashboard')}
                        >
                            <HiOutlineHome className="nav-icon" />
                            <span>Dashboard</span>
                        </div>

                        <div className="nav-item" onClick={() => navigate('/dashboard')}>
                            <HiOutlineExternalLink className="nav-icon" />
                            <span>Main Site</span>
                        </div>
                    </div>

                    <div className="nav-section">
                        <div className="nav-label">ACCOUNT</div>
                        <div className="nav-item" onClick={handleLogout}>
                            <HiOutlineLogout className="nav-icon" />
                            <span>Logout</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="main-content">
                    {activeView === 'dashboard' ? (
                        <>
                            <div className="top-bar">
                                <h1 className="page-title">Admin Dashboard</h1>
                                <button className="quick-create-btn" onClick={fetchStats}>
                                    <HiOutlineRefresh />
                                    <span>Refresh</span>
                                </button>
                            </div>

                            {error && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                }}>
                                    <strong>Error:</strong> {error}
                                </div>
                            )}

                            {/* Metrics Grid */}
                            <div className="metrics-grid">
                                <div className="metric-card clickable" onClick={() => { setUserRoleFilter(''); setActiveView('users'); }}>
                                    <div className="metric-header">
                                        <span className="metric-label">Total Users</span>
                                        <div className="trend-badge positive">
                                            <HiOutlineTrendingUp className="trend-icon" />
                                            <span>Active</span>
                                        </div>
                                    </div>
                                    <div className="metric-value">{stats.totalUsers}</div>
                                    <div className="metric-description">
                                        <HiOutlineUserGroup />
                                        <span>All registered users</span>
                                    </div>
                                    <div className="metric-subdesc">
                                        {stats.recentUsers} new in last 30 days
                                    </div>
                                </div>

                                <div className="metric-card clickable" onClick={() => { setUserRoleFilter('client'); setActiveView('users'); }}>
                                    <div className="metric-header">
                                        <span className="metric-label">Clients</span>
                                        <div className="trend-badge positive">
                                            <HiOutlineTrendingUp className="trend-icon" />
                                            <span>{((stats.clientCount / stats.totalUsers) * 100 || 0).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="metric-value">{stats.clientCount}</div>
                                    <div className="metric-description">
                                        <HiOutlineBriefcase />
                                        <span>Client accounts</span>
                                    </div>
                                    <div className="metric-subdesc">
                                        Users posting projects
                                    </div>
                                </div>

                                <div className="metric-card clickable" onClick={() => setActiveView('freelancers')}>
                                    <div className="metric-header">
                                        <span className="metric-label">Freelancers</span>
                                        <div className="trend-badge positive">
                                            <HiOutlineTrendingUp className="trend-icon" />
                                            <span>{((stats.freelancerCount / stats.totalUsers) * 100 || 0).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="metric-value">{stats.freelancerCount}</div>
                                    <div className="metric-description">
                                        <HiOutlineCode />
                                        <span>Freelancer accounts</span>
                                    </div>
                                    <div className="metric-subdesc">
                                        Users offering services
                                    </div>
                                </div>

                                <div className="metric-card clickable" onClick={() => { setUserRoleFilter('both'); setActiveView('users'); }}>
                                    <div className="metric-header">
                                        <span className="metric-label">Dual Role</span>
                                        <div className="trend-badge positive">
                                            <HiOutlineTrendingUp className="trend-icon" />
                                            <span>{((stats.bothCount / stats.totalUsers) * 100 || 0).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="metric-value">{stats.bothCount}</div>
                                    <div className="metric-description">
                                        <HiOutlineUsers />
                                        <span>Client & Freelancer</span>
                                    </div>
                                    <div className="metric-subdesc">
                                        Users with both roles
                                    </div>
                                </div>
                            </div>

                            {/* Area Chart Section */}
                            <div className="chart-section">
                                <div className="chart-header">
                                    <div className="chart-title-group">
                                        <h3>Total Visitors</h3>
                                        <p className="chart-subtitle">User registrations over time</p>
                                    </div>
                                    <div className="chart-tabs">
                                        <button
                                            className={`chart-tab ${timePeriod === '90' ? 'active' : ''}`}
                                            onClick={() => setTimePeriod('90')}
                                        >
                                            Last 3 months
                                        </button>
                                        <button
                                            className={`chart-tab ${timePeriod === '30' ? 'active' : ''}`}
                                            onClick={() => setTimePeriod('30')}
                                        >
                                            Last 30 days
                                        </button>
                                        <button
                                            className={`chart-tab ${timePeriod === '7' ? 'active' : ''}`}
                                            onClick={() => setTimePeriod('7')}
                                        >
                                            Last 7 days
                                        </button>
                                    </div>
                                </div>
                                <InteractiveChart data={chartData} timePeriod={timePeriod} />
                            </div>
                        </>
                    ) : activeView === 'users' ? (
                        <>
                            <div className="top-bar">
                                <h1 className="page-title">
                                    {userRoleFilter === 'both' ? 'Dual Role Users' :
                                        userRoleFilter === 'client' ? 'Client Users' :
                                            userRoleFilter ? `${userRoleFilter.charAt(0).toUpperCase() + userRoleFilter.slice(1)} Users` :
                                                'User Management'}
                                </h1>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div className="view-toggle">
                                        <button
                                            className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                                            onClick={() => setViewMode('card')}
                                            title="Card View"
                                        >
                                            <HiOutlineViewGrid />
                                        </button>
                                        <button
                                            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                            onClick={() => setViewMode('list')}
                                            title="List View"
                                        >
                                            <HiOutlineViewList />
                                        </button>
                                    </div>
                                    {userRoleFilter && (
                                        <button
                                            className="quick-create-btn"
                                            onClick={() => { setUserRoleFilter(''); fetchUsers(); }}
                                            style={{ background: '#6b7280' }}
                                        >
                                            <span>Clear Filter</span>
                                        </button>
                                    )}
                                    <button className="quick-create-btn" onClick={fetchUsers}>
                                        <HiOutlineRefresh />
                                        <span>Refresh</span>
                                    </button>
                                </div>
                            </div>

                            {/* User Cards/Table */}
                            {viewMode === 'card' ? (
                                <div className="user-cards-grid">
                                    {users.map(user => (
                                        <div key={user._id} className="user-card">
                                            <div className="user-card-header">
                                                <div className="user-avatar">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="avatar-img" />
                                                    ) : (
                                                        user.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="user-info-main">
                                                    <h4 className="user-name">{user.name}</h4>
                                                    <p className="user-email">{user.email}</p>
                                                </div>
                                                <button
                                                    className="settings-icon-btn"
                                                    onClick={() => setSelectedUser(user)}
                                                >
                                                    <HiOutlineCog />
                                                </button>
                                            </div>
                                            <div className="user-card-body">
                                                <div className="user-badge-group">
                                                    <span className="role-badge">{user.role}</span>
                                                    <span className={`status-badge ${user.isBanned ? 'banned' : 'active'}`}>
                                                        {user.isBanned ? 'Banned' : 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="users-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th style={{ width: '50px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user._id}>
                                                    <td>{user.name}</td>
                                                    <td>{user.email}</td>
                                                    <td><span className="role-badge">{user.role}</span></td>
                                                    <td>
                                                        <span className={`status-badge ${user.isBanned ? 'banned' : 'active'}`}>
                                                            {user.isBanned ? 'Banned' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="settings-icon-btn"
                                                            onClick={() => setSelectedUser(user)}
                                                        >
                                                            <HiOutlineCog />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* User Action Panel */}
                            {selectedUser && (
                                <>
                                    <div className="panel-overlay" onClick={() => setSelectedUser(null)}></div>
                                    <div className="action-panel">
                                        <div className="panel-header">
                                            <h3>User Actions</h3>
                                            <button className="panel-close" onClick={() => setSelectedUser(null)}>
                                                <HiOutlineX />
                                            </button>
                                        </div>
                                        <div className="panel-content">
                                            <div className="panel-user-info">
                                                <div className="user-detail">
                                                    <span className="detail-label">Name:</span>
                                                    <span className="detail-value">{selectedUser.name}</span>
                                                </div>
                                                <div className="user-detail">
                                                    <span className="detail-label">Email:</span>
                                                    <span className="detail-value">{selectedUser.email}</span>
                                                </div>
                                                <div className="user-detail">
                                                    <span className="detail-label">Role:</span>
                                                    <span className="role-badge">{selectedUser.role}</span>
                                                </div>
                                                <div className="user-detail">
                                                    <span className="detail-label">Status:</span>
                                                    <span className={`status-badge ${selectedUser.isBanned ? 'banned' : 'active'}`}>
                                                        {selectedUser.isBanned ? 'Banned' : 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="panel-actions">
                                                {selectedUser.isBanned ? (
                                                    <button
                                                        className="panel-btn btn-unban"
                                                        onClick={() => {
                                                            handleUnbanUser(selectedUser._id);
                                                            setSelectedUser(null);
                                                        }}
                                                    >
                                                        Unban User
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="panel-btn btn-ban"
                                                        onClick={() => {
                                                            handleBanUser(selectedUser._id);
                                                            setSelectedUser(null);
                                                        }}
                                                    >
                                                        Ban User
                                                    </button>
                                                )}
                                                <button
                                                    className="panel-btn btn-delete"
                                                    onClick={() => {
                                                        handleDeleteUser(selectedUser._id);
                                                        setSelectedUser(null);
                                                    }}
                                                >
                                                    Delete User
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="top-bar">
                                <h1 className="page-title">Freelancer Management</h1>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div className="view-toggle">
                                        <button
                                            className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                                            onClick={() => setViewMode('card')}
                                            title="Card View"
                                        >
                                            <HiOutlineViewGrid />
                                        </button>
                                        <button
                                            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                            onClick={() => setViewMode('list')}
                                            title="List View"
                                        >
                                            <HiOutlineViewList />
                                        </button>
                                    </div>
                                    <button className="quick-create-btn" onClick={() => { fetchFreelancers(); fetchFreelancerStats(); }}>
                                        <HiOutlineRefresh />
                                        <span>Refresh</span>
                                    </button>
                                </div>
                            </div>

                            {/* Freelancer Stats */}
                            {freelancerStats && (
                                <div className="metrics-grid">
                                    <div className="metric-card">
                                        <div className="metric-header">
                                            <span className="metric-label">Total Freelancers</span>
                                        </div>
                                        <div className="metric-value">{freelancerStats.totalFreelancers}</div>
                                        <div className="metric-description">
                                            <HiOutlineCode />
                                            <span>All freelancer accounts</span>
                                        </div>
                                    </div>

                                    <div className="metric-card">
                                        <div className="metric-header">
                                            <span className="metric-label">Verified</span>
                                        </div>
                                        <div className="metric-value">{freelancerStats.verifiedFreelancers}</div>
                                        <div className="metric-description">
                                            <HiOutlineCheckCircle />
                                            <span>Verified freelancers</span>
                                        </div>
                                    </div>

                                    <div className="metric-card">
                                        <div className="metric-header">
                                            <span className="metric-label">Expert Level</span>
                                        </div>
                                        <div className="metric-value">{freelancerStats.experienceDistribution.expert}</div>
                                        <div className="metric-description">
                                            <HiOutlineStar />
                                            <span>Expert freelancers</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Filters */}
                            <div className="filters-section">
                                <div className="filters-row">
                                    <div className="filter-group">
                                        <label>Verification Status</label>
                                        <select
                                            value={filters.verified}
                                            onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
                                        >
                                            <option value="">All</option>
                                            <option value="true">Verified</option>
                                            <option value="false">Unverified</option>
                                        </select>
                                    </div>

                                    <div className="filter-group">
                                        <label>Experience Level</label>
                                        <select
                                            value={filters.experienceLevel}
                                            onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                                        >
                                            <option value="">All</option>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                    </div>

                                    <div className="filter-group">
                                        <label>Status</label>
                                        <select
                                            value={filters.banned}
                                            onChange={(e) => setFilters({ ...filters, banned: e.target.value })}
                                        >
                                            <option value="">All</option>
                                            <option value="false">Active</option>
                                            <option value="true">Banned</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Freelancer Cards/Table */}
                            {viewMode === 'card' ? (
                                <div className="user-cards-grid">
                                    {freelancers.map(freelancer => (
                                        <div key={freelancer._id} className="user-card freelancer-card">
                                            <div className="user-card-header">
                                                <div className="user-avatar">
                                                    {freelancer.avatar ? (
                                                        <img src={freelancer.avatar} alt={freelancer.name} className="avatar-img" />
                                                    ) : (
                                                        freelancer.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="user-info-main">
                                                    <h4 className="user-name">{freelancer.name}</h4>
                                                    <p className="user-email">{freelancer.email}</p>
                                                </div>
                                                <button
                                                    className="settings-icon-btn"
                                                    onClick={() => setSelectedFreelancer(freelancer)}
                                                >
                                                    <HiOutlineCog />
                                                </button>
                                            </div>
                                            <div className="user-card-body">
                                                <div className="freelancer-stats">
                                                    <div className="stat-item">
                                                        <span className="stat-label">Experience</span>
                                                        {freelancer.experienceLevel ? (
                                                            <span className={`experience-badge ${freelancer.experienceLevel}`}>
                                                                {freelancer.experienceLevel}
                                                            </span>
                                                        ) : (
                                                            <span className="stat-value-muted">Not set</span>
                                                        )}
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Rating</span>
                                                        <div className="rating-display">
                                                            <HiOutlineStar style={{ color: '#f59e0b', fontSize: '14px' }} />
                                                            <span className="stat-value">{freelancer.rating?.toFixed(1) || '0.0'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="freelancer-tags">
                                                    <div className="skill-tags">
                                                        {freelancer.skills?.slice(0, 4).map((skill, idx) => (
                                                            <span key={idx} className="skill-tag">{skill}</span>
                                                        ))}
                                                        {freelancer.skills?.length > 4 && (
                                                            <span className="skill-tag">+{freelancer.skills.length - 4}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="user-badge-group">
                                                    <span className={`verified-badge ${freelancer.isVerified ? 'verified' : 'unverified'}`}>
                                                        {freelancer.isVerified ? (
                                                            <>
                                                                <HiOutlineCheckCircle />
                                                                <span>Verified</span>
                                                            </>
                                                        ) : (
                                                            <span>Not Verified</span>
                                                        )}
                                                    </span>
                                                    <span className={`status-badge ${freelancer.isBanned ? 'banned' : 'active'}`}>
                                                        {freelancer.isBanned ? 'Banned' : 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="users-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Experience</th>
                                                <th>Skills</th>
                                                <th>Rating</th>
                                                <th>Verified</th>
                                                <th>Status</th>
                                                <th style={{ width: '50px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {freelancers.map(freelancer => (
                                                <tr key={freelancer._id}>
                                                    <td>{freelancer.name}</td>
                                                    <td>{freelancer.email}</td>
                                                    <td>
                                                        {freelancer.experienceLevel ? (
                                                            <span className={`experience-badge ${freelancer.experienceLevel}`}>
                                                                {freelancer.experienceLevel}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not set</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="skill-tags">
                                                            {freelancer.skills?.slice(0, 3).map((skill, idx) => (
                                                                <span key={idx} className="skill-tag">{skill}</span>
                                                            ))}
                                                            {freelancer.skills?.length > 3 && (
                                                                <span className="skill-tag">+{freelancer.skills.length - 3}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <HiOutlineStar style={{ color: '#f59e0b', fontSize: '14px' }} />
                                                            <span>{freelancer.rating?.toFixed(1) || '0.0'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`verified-badge ${freelancer.isVerified ? 'verified' : 'unverified'}`}>
                                                            {freelancer.isVerified ? (
                                                                <>
                                                                    <HiOutlineCheckCircle />
                                                                    <span>Verified</span>
                                                                </>
                                                            ) : (
                                                                <span>Not Verified</span>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${freelancer.isBanned ? 'banned' : 'active'}`}>
                                                            {freelancer.isBanned ? 'Banned' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="settings-icon-btn"
                                                            onClick={() => setSelectedFreelancer(freelancer)}
                                                        >
                                                            <HiOutlineCog />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Freelancer Action Panel */}
                            {selectedFreelancer && (
                                <>
                                    <div className="panel-overlay" onClick={() => setSelectedFreelancer(null)}></div>
                                    <div className="action-panel">
                                        <div className="panel-header">
                                            <h3>Freelancer Actions</h3>
                                            <button className="panel-close" onClick={() => setSelectedFreelancer(null)}>
                                                <HiOutlineX />
                                            </button>
                                        </div>
                                        <div className="panel-content">
                                            <div className="panel-user-info">
                                                <div className="user-detail">
                                                    <span className="detail-label">Name:</span>
                                                    <span className="detail-value">{selectedFreelancer.name}</span>
                                                </div>
                                                <div className="user-detail">
                                                    <span className="detail-label">Email:</span>
                                                    <span className="detail-value">{selectedFreelancer.email}</span>
                                                </div>
                                                <div className="user-detail">
                                                    <span className="detail-label">Experience:</span>
                                                    {selectedFreelancer.experienceLevel ? (
                                                        <span className={`experience-badge ${selectedFreelancer.experienceLevel}`}>
                                                            {selectedFreelancer.experienceLevel}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>Not set</span>
                                                    )}
                                                </div>
                                                <div className="user-detail">
                                                    <span className="detail-label">Verified:</span>
                                                    <span className={`verified-badge ${selectedFreelancer.isVerified ? 'verified' : 'unverified'}`}>
                                                        {selectedFreelancer.isVerified ? (
                                                            <>
                                                                <HiOutlineCheckCircle />
                                                                <span>Verified</span>
                                                            </>
                                                        ) : (
                                                            <span>Not Verified</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="user-detail">
                                                    <span className="detail-label">Status:</span>
                                                    <span className={`status-badge ${selectedFreelancer.isBanned ? 'banned' : 'active'}`}>
                                                        {selectedFreelancer.isBanned ? 'Banned' : 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="panel-actions">
                                                {selectedFreelancer.isVerified ? (
                                                    <button
                                                        className="panel-btn btn-unverify"
                                                        onClick={() => {
                                                            handleUnverifyFreelancer(selectedFreelancer._id);
                                                            setSelectedFreelancer(null);
                                                        }}
                                                    >
                                                        Unverify Freelancer
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="panel-btn btn-verify"
                                                        onClick={() => {
                                                            handleVerifyFreelancer(selectedFreelancer._id);
                                                            setSelectedFreelancer(null);
                                                        }}
                                                    >
                                                        Verify Freelancer
                                                    </button>
                                                )}
                                                {selectedFreelancer.isBanned ? (
                                                    <button
                                                        className="panel-btn btn-unban"
                                                        onClick={() => {
                                                            handleUnbanUser(selectedFreelancer._id);
                                                            setSelectedFreelancer(null);
                                                        }}
                                                    >
                                                        Unban Freelancer
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="panel-btn btn-ban"
                                                        onClick={() => {
                                                            handleBanUser(selectedFreelancer._id);
                                                            setSelectedFreelancer(null);
                                                        }}
                                                    >
                                                        Ban Freelancer
                                                    </button>
                                                )}
                                                <button
                                                    className="panel-btn btn-delete"
                                                    onClick={() => {
                                                        handleDeleteUser(selectedFreelancer._id);
                                                        setSelectedFreelancer(null);
                                                    }}
                                                >
                                                    Delete Freelancer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;