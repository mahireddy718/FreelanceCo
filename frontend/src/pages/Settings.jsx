import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import TimezoneSelect from 'react-timezone-select';
import {
    HiOutlineUser,
    HiOutlineBriefcase,
    HiOutlineLockClosed,
    HiOutlineBell,
    HiOutlineCreditCard,
    HiOutlineEye,
    HiPencil,
    HiCheck,
    HiX
} from 'react-icons/hi';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import SkillsAutocompleteInput from '../components/ui/SkillsAutocompleteInput';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Custom styles for react-select with dark mode support
const getCustomSelectStyles = (isDark) => ({
    control: (provided, state) => ({
        ...provided,
        backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'white',
        borderColor: state.isFocused
            ? (isDark ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)')
            : (isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'),
        borderWidth: '1px',
        borderRadius: '0.5rem',
        padding: '0.375rem 0.5rem',
        fontSize: '0.875rem',
        fontWeight: '300',
        boxShadow: 'none',
        minHeight: 'auto',
        transition: 'all 200ms',
        '&:hover': {
            borderColor: state.isFocused
                ? (isDark ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)')
                : (isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'),
        }
    }),
    valueContainer: (provided) => ({ ...provided, padding: '0' }),
    input: (provided) => ({
        ...provided,
        margin: '0',
        padding: '0',
        fontSize: '0.875rem',
        fontWeight: '300',
        color: isDark ? 'rgb(243, 244, 246)' : 'rgb(31, 41, 55)'
    }),
    placeholder: (provided) => ({
        ...provided,
        fontSize: '0.875rem',
        fontWeight: '300',
        color: isDark ? 'rgb(107, 114, 128)' : 'rgb(156, 163, 175)'
    }),
    singleValue: (provided) => ({
        ...provided,
        fontSize: '0.875rem',
        fontWeight: '300',
        color: isDark ? 'rgb(243, 244, 246)' : 'rgb(31, 41, 55)'
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: '0.5rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'white',
        border: isDark ? '1px solid rgb(55, 65, 81)' : 'none'
    }),
    menuList: (provided) => ({ ...provided, padding: '0' }),
    option: (provided, state) => ({
        ...provided,
        fontSize: '0.875rem',
        fontWeight: '300',
        backgroundColor: state.isSelected
            ? (isDark ? 'rgb(21, 128, 61)' : 'rgb(220, 252, 231)')
            : state.isFocused
                ? (isDark ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)')
                : (isDark ? 'rgb(31, 41, 55)' : 'white'),
        color: state.isSelected
            ? (isDark ? 'rgb(220, 252, 231)' : 'rgb(21, 128, 61)')
            : (isDark ? 'rgb(243, 244, 246)' : 'rgb(31, 41, 55)'),
        cursor: 'pointer'
    }),
    dropdownIndicator: (provided) => ({
        ...provided,
        padding: '0 4px',
        color: isDark ? 'rgb(107, 114, 128)' : 'rgb(156, 163, 175)'
    }),
    indicatorSeparator: () => ({ display: 'none' }),
});

export default function Settings() {
    const [activeSection, setActiveSection] = useState('profile');
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const sections = [
        { id: 'profile', name: 'Profile Information', icon: HiOutlineUser },
        { id: 'skills', name: 'Skills & Professional', icon: HiOutlineBriefcase },
        { id: 'security', name: 'Account Security', icon: HiOutlineLockClosed },
        { id: 'notifications', name: 'Notifications', icon: HiOutlineBell },
        { id: 'privacy', name: 'Privacy & Visibility', icon: HiOutlineEye },
        { id: 'danger', name: 'Danger Zone', icon: HiOutlineExclamationTriangle }
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/api/settings`, {
                headers: { Authorization: token }
            });
            setSettings(response.data.settings);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 font-light">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
                <div className="flex gap-8">
                    {/* Left Sidebar */}
                    <div className="w-64 shrink-0">
                        <nav className="space-y-1 glass-surface rounded-2xl p-3 shadow-lg shadow-emerald-900/10">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all cursor-pointer ${activeSection === section.id
                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/15 border border-transparent'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span className="font-light">{section.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 glass-surface rounded-2xl p-4 md:p-5 shadow-lg shadow-emerald-900/10">
                        {activeSection === 'profile' && <ProfileSection settings={settings} onUpdate={fetchSettings} />}
                        {activeSection === 'skills' && <SkillsSection settings={settings} onUpdate={fetchSettings} />}
                        {activeSection === 'security' && <SecuritySection />}
                        {activeSection === 'notifications' && <NotificationsSection settings={settings} onUpdate={fetchSettings} />}
                        {activeSection === 'privacy' && <PrivacySection settings={settings} onUpdate={fetchSettings} />}
                        {activeSection === 'danger' && <DangerZoneSection />}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reusable EditableField component
function EditableField({ label, value, onSave, type = 'text', placeholder, isEditing, onEditToggle, disabled = false }) {
    const [editValue, setEditValue] = useState(value || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setEditValue(value || '');
    }, [value]);

    const handleSave = async () => {
        setSaving(true);
        await onSave(editValue);
        setSaving(false);
        onEditToggle(false);
    };

    const handleCancel = () => {
        setEditValue(value || '');
        onEditToggle(false);
    };

    return (
        <div className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 gap-3">
                    <p className="text-sm text-left text-gray-600 dark:text-gray-400 font-light w-[140px]">{label}</p>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-light">:</span>
                    {!isEditing ? (
                        <p className="text-sm text-left text-gray-700 dark:text-gray-200 font-light">{value || <span className="text-gray-400 dark:text-gray-500">Not set</span>}</p>
                    ) : (
                        <input
                            type={type}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none transition-all font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            autoFocus
                        />
                    )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    {!isEditing ? (
                        !disabled && (
                            <button
                                onClick={() => onEditToggle(true)}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                            >
                                <HiPencil size={16} />
                            </button>
                        )
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="p-2 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition disabled:opacity-50"
                            >
                                <HiCheck size={16} />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            >
                                <HiX size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Profile Section
function ProfileSection({ settings, onUpdate }) {
    const [editingField, setEditingField] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoOperation, setPhotoOperation] = useState(null); // 'uploading', 'removing', or null
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const countryOptions = useMemo(() => countryList().getData(), []);

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');

    useEffect(() => {
        if (settings?.profile?.avatar) {
            setPhotoPreview(settings.profile.avatar);
        }
    }, [settings]);

    // Countdown timer for logout
    useEffect(() => {
        if (showLogoutModal && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (showLogoutModal && countdown === 0) {
            handleLogout();
        }
    }, [showLogoutModal, countdown]);


    const handleLogout = async () => {
        // Sign out from Firebase first to prevent auto-login
        try {
            const { auth } = await import('../config/firebaseConfig');
            const { signOut } = await import('firebase/auth');
            await signOut(auth);
        } catch (error) {
            console.log('Firebase signout skipped:', error.message);
        }

        // Clear all data and redirect
        localStorage.clear();
        window.location.href = '/login';
    };


    const updateField = async (field, value) => {
        try {
            const token = localStorage.getItem('authToken');

            // Check if role is being changed
            const isRoleChange = field === 'role' && value !== settings?.profile?.role;

            await axios.put(`${API_URL}/api/settings/profile`, { [field]: value }, {
                headers: { Authorization: token }
            });

            setMessage('Updated successfully!');
            setIsSuccess(true);
            setTimeout(() => setMessage(''), 2000);
            onUpdate();

            // Show logout modal if role changed
            if (isRoleChange) {
                setShowLogoutModal(true);
                setCountdown(5);
            }
        } catch (error) {
            setMessage('Failed to update');
            setIsSuccess(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setMessage('File size must be less than 5MB');
            return;
        }

        setPhotoOperation('uploading');
        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();
            formData.append('photo', file);

            await axios.post(`${API_URL}/api/upload/upload`, formData, {
                headers: { Authorization: token, 'Content-Type': 'multipart/form-data' }
            });

            setMessage('Photo uploaded successfully!');
            setIsSuccess(true);
            onUpdate();
        } catch (error) {
            setMessage('Failed to upload photo');
            setIsSuccess(false);
        } finally {
            setPhotoOperation(null);
        }
    };

    const handlePhotoRemove = async () => {
        if (!window.confirm('Are you sure you want to remove your profile photo?')) {
            return;
        }

        setPhotoOperation('removing');
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`${API_URL}/api/upload/photo`, {
                headers: { Authorization: token }
            });

            setPhotoPreview(null);
            setMessage('Photo removed successfully!');
            setIsSuccess(true);
            onUpdate();
        } catch (error) {
            setMessage('Failed to remove photo');
            setIsSuccess(false);
        } finally {
            setPhotoOperation(null);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {message && (
                <div className={`p-3 rounded-lg text-sm font-light ${isSuccess ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                    {message}
                </div>
            )}

            {/* Profile Photo Card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                    {photoPreview ? (
                        <img
                            src={photoPreview}
                            alt="Profile"
                            referrerPolicy="no-referrer"
                            onClick={() => setShowImagePreview(true)}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm cursor-pointer hover:opacity-90 transition"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            <HiOutlineUser size={24} className="text-gray-400 dark:text-gray-500" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">{settings?.profile?.name || 'User'}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{settings?.profile?.username || 'username'}</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="file" id="photo-upload" onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                        <label htmlFor="photo-upload" className={`px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-light cursor-pointer inline-block ${photoOperation ? 'opacity-50 pointer-events-none' : ''}`}>
                            {photoOperation === 'uploading' ? 'Uploading...' : 'Change'}
                        </label>
                        {photoPreview && (
                            <button
                                onClick={handlePhotoRemove}
                                disabled={photoOperation !== null}
                                className="px-3 py-1.5 text-xs border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-light cursor-pointer disabled:opacity-50"
                            >
                                {photoOperation === 'removing' ? 'Removing...' : 'Remove'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Basic Info - 2 Column Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Name Card */}
                <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 gap-3 min-w-0">
                            <p className="text-sm text-left text-gray-600 dark:text-gray-400 font-light w-[140px]">Full Name</p>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-light">:</span>
                            {editingField !== 'name' ? (
                                <p className="text-sm text-gray-700 dark:text-gray-200 font-light truncate">{settings?.profile?.name || <span className="text-gray-400 dark:text-gray-500">Not set</span>}</p>
                            ) : (
                                <input
                                    type="text"
                                    defaultValue={settings?.profile?.name}
                                    id="name-input"
                                    className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 focus:border-green-600 focus:outline-none font-light"
                                    autoFocus
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                            {editingField !== 'name' ? (
                                <button onClick={() => setEditingField('name')} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition cursor-pointer">
                                    <HiPencil size={14} />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            updateField('name', document.getElementById('name-input').value);
                                            setEditingField(null);
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition cursor-pointer"
                                    >
                                        <HiCheck size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEditingField(null)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                    >
                                        <HiX size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Username Card */}
                <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-left text-gray-600 font-light w-[140px]">Username {!settings?.profile?.username && <span className="text-red-500">*</span>}</p>
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-light">:</span>
                                {editingField !== 'username' ? (
                                    <p className="text-sm text-gray-700 dark:text-gray-200 font-light truncate">{settings?.profile?.username || <span className="text-red-400">Not set - Required!</span>}</p>
                                ) : (
                                    <input
                                        type="text"
                                        defaultValue={settings?.profile?.username}
                                        id="username-input"
                                        placeholder="username123"
                                        className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 lowercase"
                                        autoFocus
                                        onChange={(e) => {
                                            // Convert to lowercase automatically
                                            e.target.value = e.target.value.toLowerCase();
                                        }}
                                    />
                                )}
                            </div>
                            {editingField === 'username' && (
                                <p className="text-xs text-gray-400 font-light mt-1 ml-[152px]">3-20 characters, lowercase letters, numbers, - and _ only</p>
                            )}
                            {!settings?.profile?.username && editingField !== 'username' && (
                                <p className="text-xs text-red-500 font-light mt-1 ml-[152px]">Please set a username to complete your profile</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                            {editingField !== 'username' ? (
                                <button onClick={() => setEditingField('username')} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition cursor-pointer">
                                    <HiPencil size={14} />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            const value = document.getElementById('username-input').value;
                                            // Validate before saving
                                            if (!value) {
                                                setMessage('Username is required');
                                                setIsSuccess(false);
                                                return;
                                            }
                                            if (!/^[a-z0-9_-]+$/.test(value)) {
                                                setMessage('Invalid username format');
                                                setIsSuccess(false);
                                                return;
                                            }
                                            if (value.length < 3 || value.length > 20) {
                                                setMessage('Username must be 3-20 characters');
                                                setIsSuccess(false);
                                                return;
                                            }
                                            updateField('username', value);
                                            setEditingField(null);
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition cursor-pointer"
                                    >
                                        <HiCheck size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEditingField(null)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                    >
                                        <HiX size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Email Card - Read Only */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 gap-3 min-w-0">
                            <p className="text-sm text-left text-gray-600 font-light w-[140px]">Email</p>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-light">:</span>
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-light truncate">{settings?.profile?.email || <span className="text-gray-400">Not set</span>}</p>
                        </div>
                        <div className="p-1 text-gray-300 ml-2">
                            <HiOutlineLockClosed size={14} />
                        </div>
                    </div>
                </div>

                {/* Role Card */}
                <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 gap-3 min-w-0">
                            <p className="text-sm text-left text-gray-600 font-light w-[140px]">Account Role</p>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-light">:</span>
                            {editingField !== 'role' ? (
                                <p className="text-sm text-gray-700 dark:text-gray-200 font-light capitalize truncate">{settings?.profile?.role || <span className="text-gray-400">Not set</span>}</p>
                            ) : (
                                <select
                                    defaultValue={settings?.profile?.role}
                                    id="role-input"
                                    className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer"
                                    autoFocus
                                >
                                    <option value="freelancer">Freelancer</option>
                                    <option value="client">Client</option>
                                    <option value="both">Both</option>
                                </select>
                            )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                            {editingField !== 'role' ? (
                                <button onClick={() => setEditingField('role')} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition cursor-pointer">
                                    <HiPencil size={14} />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            updateField('role', document.getElementById('role-input').value);
                                            setEditingField(null);
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition cursor-pointer"
                                    >
                                        <HiCheck size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEditingField(null)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                    >
                                        <HiX size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Location Card */}
                <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-left text-gray-600 font-light w-[140px]">Location</p>
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-light">:</span>
                                {editingField !== 'location' ? (
                                    <p className="text-sm text-gray-700 dark:text-gray-200 font-light truncate">{settings?.profile?.location || <span className="text-gray-400">Not set</span>}</p>
                                ) : (
                                    <div className="flex-1">
                                        <Select
                                            options={countryOptions}
                                            value={countryOptions.find(c => c.label === settings?.profile?.location)}
                                            onChange={(selectedOption) => {
                                                // Store the selected country in a temporary state
                                                document.getElementById('location-select-value').value = selectedOption?.label || '';
                                            }}
                                            styles={getCustomSelectStyles(isDarkMode)}
                                            placeholder="Select country..."
                                            isClearable
                                            isSearchable
                                            className="text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                            <input type="hidden" id="location-select-value" defaultValue={settings?.profile?.location} />
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                            {editingField !== 'location' ? (
                                <button onClick={() => setEditingField('location')} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition cursor-pointer">
                                    <HiPencil size={14} />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            const value = document.getElementById('location-select-value').value;
                                            updateField('location', value);
                                            setEditingField(null);
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition cursor-pointer"
                                    >
                                        <HiCheck size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEditingField(null)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                    >
                                        <HiX size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio - Full Width */}
            <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1 gap-3">
                        <p className="text-sm text-left text-gray-600 font-light w-[140px]">Bio</p>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-light">:</span>
                        {editingField !== 'bio' ? (
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-light flex-1">{settings?.profile?.bio || <span className="text-gray-400">Not set</span>}</p>
                        ) : (
                            <textarea
                                defaultValue={settings?.profile?.bio}
                                id="bio-input"
                                rows="2"
                                className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                                autoFocus
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                        {editingField !== 'bio' ? (
                            <button onClick={() => setEditingField('bio')} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition cursor-pointer">
                                <HiPencil size={14} />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        updateField('bio', document.getElementById('bio-input').value);
                                        setEditingField(null);
                                    }}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition cursor-pointer"
                                >
                                    <HiCheck size={14} />
                                </button>
                                <button
                                    onClick={() => setEditingField(null)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                >
                                    <HiX size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Timezone - Single Card */}
            <div className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-left text-gray-600 font-light w-[140px]">Timezone</p>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-light">:</span>
                            {editingField !== 'timezone' ? (
                                <p className="text-sm text-gray-700 dark:text-gray-200 font-light">{settings?.profile?.timezone || <span className="text-gray-400">Not set</span>}</p>
                            ) : (
                                <div className="flex-1">
                                    <TimezoneSelect
                                        value={settings?.profile?.timezone || ''}
                                        onChange={(tz) => {
                                            // Store the timezone value (e.g., "America/New_York")
                                            document.getElementById('timezone-select-value').value = typeof tz === 'string' ? tz : tz.value;
                                        }}
                                        styles={getCustomSelectStyles(isDarkMode)}
                                        placeholder="Select timezone..."
                                    />
                                </div>
                            )}
                        </div>
                        <input type="hidden" id="timezone-select-value" defaultValue={settings?.profile?.timezone} />
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                        {editingField !== 'timezone' ? (
                            <button onClick={() => setEditingField('timezone')} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition cursor-pointer">
                                <HiPencil size={14} />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        const value = document.getElementById('timezone-select-value').value;
                                        updateField('timezone', value);
                                        setEditingField(null);
                                    }}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition cursor-pointer"
                                >
                                    <HiCheck size={14} />
                                </button>
                                <button
                                    onClick={() => setEditingField(null)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                >
                                    <HiX size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {showImagePreview && photoPreview && (
                <div
                    className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowImagePreview(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative max-w-2xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowImagePreview(false)}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition"
                        >
                            <HiX size={24} />
                        </button>
                        <img
                            src={photoPreview}
                            alt="Profile Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-auto rounded-lg shadow-2xl"
                        />
                    </motion.div>
                </div>
            )}

            {/* Logout Countdown Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-8 text-center shadow-2xl"
                    >
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiOutlineLockClosed className="text-green-600 dark:text-green-500" size={32} />
                        </div>

                        <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">Role Updated Successfully!</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-6">
                            Your account role has been changed. You need to log out and log back in for the changes to take effect.
                        </p>

                        <div className="mb-6">
                            <div className="w-20 h-20 bg-green-50 border-4 border-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-3xl font-bold text-green-600">{countdown}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-light">
                                Logging out automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full px-6 py-3 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition font-medium"
                        >
                            Logout Now
                        </button>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}

// Skills Section
function SkillsSection({ settings, onUpdate }) {
    const [editingField, setEditingField] = useState(null);
    const [message, setMessage] = useState('');

    const updateField = async (field, value) => {
        try {
            const token = localStorage.getItem('authToken');
            const payload = field === 'primarySkills' || field === 'secondarySkills'
                ? { [field]: value } // value is already an array from autocomplete
                : { [field]: field === 'hourlyCharges' ? Number(value) : value };

            console.log('Updating field:', field, 'with value:', value);
            console.log('Payload:', payload);

            await axios.put(`${API_URL}/api/settings/skills`, payload, {
                headers: { Authorization: token }
            });
            setMessage('Updated successfully!');
            setTimeout(() => setMessage(''), 2000);
            onUpdate();
        } catch (error) {
            console.error('Update error:', error);
            console.error('Error response:', error.response?.data);
            setMessage(error.response?.data?.message || 'Failed to update');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {message && <div className="p-3 rounded-lg text-sm font-light bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">{message}</div>}

            <div className="space-y-6">
                {/* Primary Skills */}
                <div className="py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                            <p className="text-sm text-left text-gray-600 dark:text-gray-400 font-light w-[140px] pt-2">Primary Skills</p>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-light pt-2">:</span>
                            <div className="flex-1">
                                {editingField !== 'primarySkills' ? (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {settings?.skills?.primarySkills?.length > 0 ? (
                                            settings.skills.primarySkills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="inline-flex px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm font-light"
                                                >
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400 dark:text-gray-500 font-light">Not set</span>
                                        )}
                                    </div>
                                ) : (
                                    <SkillsAutocompleteInput
                                        selectedSkills={settings?.skills?.primarySkills || []}
                                        onChange={(skills) => updateField('primarySkills', skills)}
                                        placeholder="Type to search skills..."
                                        maxSkills={10}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {editingField !== 'primarySkills' ? (
                                <button
                                    onClick={() => setEditingField('primarySkills')}
                                    className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition cursor-pointer"
                                >
                                    <HiPencil size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setEditingField(null)}
                                    className="p-1 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition cursor-pointer"
                                >
                                    <HiCheck size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secondary Skills */}
                <div className="py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                            <p className="text-sm text-left text-gray-600 dark:text-gray-400 font-light w-[140px] pt-2">Secondary Skills</p>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-light pt-2">:</span>
                            <div className="flex-1">
                                {editingField !== 'secondarySkills' ? (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {settings?.skills?.secondarySkills?.length > 0 ? (
                                            settings.skills.secondarySkills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="inline-flex px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-light"
                                                >
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400 dark:text-gray-500 font-light">Not set</span>
                                        )}
                                    </div>
                                ) : (
                                    <SkillsAutocompleteInput
                                        selectedSkills={settings?.skills?.secondarySkills || []}
                                        onChange={(skills) => updateField('secondarySkills', skills)}
                                        placeholder="Type to search skills..."
                                        maxSkills={10}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {editingField !== 'secondarySkills' ? (
                                <button
                                    onClick={() => setEditingField('secondarySkills')}
                                    className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition cursor-pointer"
                                >
                                    <HiPencil size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setEditingField(null)}
                                    className="p-1 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition cursor-pointer"
                                >
                                    <HiCheck size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Experience Level */}
                <div className="py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 gap-3 min-w-0">
                            <p className="text-sm text-left text-gray-600 dark:text-gray-400 font-light w-[140px]">Experience Level</p>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-light">:</span>
                            {editingField !== 'experienceLevel' ? (
                                <p className="text-sm text-gray-700 dark:text-gray-200 font-light capitalize truncate">
                                    {settings?.skills?.experienceLevel || <span className="text-gray-400 dark:text-gray-500">Not set</span>}
                                </p>
                            ) : (
                                <select
                                    defaultValue={settings?.skills?.experienceLevel}
                                    id="experienceLevel-input"
                                    className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer capitalize"
                                    autoFocus
                                >
                                    <option value="">Select level</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="expert">Expert</option>
                                </select>
                            )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                            {editingField !== 'experienceLevel' ? (
                                <button onClick={() => setEditingField('experienceLevel')} className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition cursor-pointer">
                                    <HiPencil size={14} />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            updateField('experienceLevel', document.getElementById('experienceLevel-input').value);
                                            setEditingField(null);
                                        }}
                                        className="p-1 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition cursor-pointer"
                                    >
                                        <HiCheck size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEditingField(null)}
                                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition cursor-pointer"
                                    >
                                        <HiX size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <EditableField
                    label="Hourly Charges (₹)"
                    value={settings?.skills?.hourlyCharges}
                    type="number"
                    onSave={(value) => updateField('hourlyCharges', value)}
                    isEditing={editingField === 'hourlyCharges'}
                    onEditToggle={(editing) => setEditingField(editing ? 'hourlyCharges' : null)}
                    placeholder="1500"
                />
            </div>
        </motion.div>
    );
}

// Security Section
function SecuritySection() {
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(`${API_URL}/api/settings/password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }, { headers: { Authorization: token } });

            setMessage('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {message && <div className="p-3 rounded-lg text-sm font-light bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">{message}</div>}

            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg dark:bg-black">
                <h3 className="text-sm font-light text-gray-700 mb-4 dark:text-gray-100">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                    <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Current password"
                        className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-green-600 focus:outline-none font-light dark:border-gray-700 dark:bg-gray-800"
                        required
                    />
                    <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="New password"
                        className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-green-600 focus:outline-none font-light dark:border-gray-700 dark:bg-gray-800"
                        required
                    />
                    <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition font-light disabled:opacity-50"
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </motion.div>
    );
}

// Notifications Section
function NotificationsSection({ settings, onUpdate }) {
    const [message, setMessage] = useState('');

    const handleToggle = async (field, value) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(`${API_URL}/api/settings/notifications`, { [field]: !value }, {
                headers: { Authorization: token }
            });
            setMessage('Updated successfully!');
            setTimeout(() => setMessage(''), 2000);
            onUpdate();
        } catch (error) {
            setMessage('Failed to update');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {message && <div className="p-3 rounded-lg text-sm font-light bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">{message}</div>}

            <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-lg dark:bg-gray-900">
                <div>
                    <h3 className="text-left text-sm font-light text-gray-700 dark:text-gray-100">In-App Notifications</h3>
                    <p className="text-left text-xs text-gray-400 mt-1 font-light">Receive notifications within the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings?.notifications?.inApp}
                        onChange={() => handleToggle('inApp', settings?.notifications?.inApp)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-lg dark:bg-gray-900">
                <div>
                    <h3 className="text-left text-sm font-light text-gray-700 dark:text-gray-100">Project Updates</h3>
                    <p className="text-left text-xs text-gray-400 mt-1 font-light">Get notified about project status changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings?.notifications?.projectUpdates}
                        onChange={() => handleToggle('projectUpdates', settings?.notifications?.projectUpdates)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </div>
        </motion.div>
    );
}

// Privacy Section
function PrivacySection({ settings, onUpdate }) {
    const [message, setMessage] = useState('');

    const handleToggle = async (field, value) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(`${API_URL}/api/settings/privacy`, { [field]: !value }, {
                headers: { Authorization: token }
            });
            setMessage('Updated successfully!');
            setTimeout(() => setMessage(''), 2000);
            onUpdate();
        } catch (error) {
            setMessage('Failed to update');
        }
    };

    const handleSelectChange = async (value) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(`${API_URL}/api/settings/privacy`, { whoCanMessage: value }, {
                headers: { Authorization: token }
            });
            setMessage('Updated successfully!');
            setTimeout(() => setMessage(''), 2000);
            onUpdate();
        } catch (error) {
            setMessage('Failed to update');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {message && <div className="p-3 rounded-lg text-sm font-light bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">{message}</div>}

            <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-lg dark:bg-gray-900">
                <div>
                    <h3 className="text-left text-sm font-light text-gray-700 dark:text-gray-100">Public Profile</h3>
                    <p className="text-left text-xs text-gray-400 mt-1 font-light">Make your profile visible to everyone</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings?.privacy?.isPublic}
                        onChange={() => handleToggle('isPublic', settings?.privacy?.isPublic)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </div>

            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg dark:bg-gray-900">
                <h3 className="text-left text-sm font-light text-gray-700 mb-3 dark:text-gray-100">Who Can Message Me</h3>
                <select
                    value={settings?.privacy?.whoCanMessage || 'everyone'}
                    onChange={(e) => handleSelectChange(e.target.value)}
                    className="w-full h-10 px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                    <option value="everyone">Everyone</option>
                    <option value="connections">Only connections</option>
                    <option value="none">No one</option>
                </select>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-lg dark:bg-gray-900">
                <div>
                    <h3 className="text-left text-sm font-light text-gray-700 dark:text-gray-100">Show Work History</h3>
                    <p className="text-left text-xs text-gray-400 mt-1 font-light">Display your completed projects</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings?.privacy?.showWorkHistory}
                        onChange={() => handleToggle('showWorkHistory', settings?.privacy?.showWorkHistory)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </div>
        </motion.div>
    );
}

// Danger Zone Section
function DangerZoneSection() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkingProjects, setCheckingProjects] = useState(false);
    const [canDelete, setCanDelete] = useState(null);
    const [activeProjectsCount, setActiveProjectsCount] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Check for active projects
    const checkActiveProjects = async () => {
        setCheckingProjects(true);
        setMessage(''); // Clear any previous messages
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_URL}/api/users/active-projects-count`, {
                headers: { Authorization: token }
            });

            const count = response.data.activeProjectsCount || 0;
            setActiveProjectsCount(count);
            setCanDelete(count === 0);
        } catch (error) {
            console.error('Error checking projects:', error);
            setMessage('Failed to check active projects. Please refresh the page.');
            setIsSuccess(false);
            setCanDelete(null); // Set to null to indicate error state
        } finally {
            setCheckingProjects(false);
        }
    };

    useEffect(() => {
        checkActiveProjects();
    }, []);

    const handleDeleteAccount = async () => {
        if (confirmText !== 'DELETE') {
            setMessage('Please type DELETE to confirm');
            setIsSuccess(false);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');

            // CRITICAL: Sign out from Firebase FIRST to prevent auto-login
            // The AuthContext has a listener that auto-syncs Firebase users with backend
            // If we don't sign out from Firebase, it will restore the auth after clearing localStorage
            try {
                const { auth } = await import('../config/firebaseConfig');
                const { signOut } = await import('firebase/auth');
                await signOut(auth);
            } catch (firebaseError) {
                // Ignore Firebase errors (user might not be using Firebase auth)
                console.log('Firebase signout skipped:', firebaseError.message);
            }

            // Now delete the account from backend
            await axios.delete(`${API_URL}/api/users/delete-account`, {
                headers: { Authorization: token }
            });

            // Clear all local storage
            localStorage.clear();
            setMessage('Account deleted successfully');
            setIsSuccess(true);

            setTimeout(() => {
                window.location.href = '/login'; // Hard redirect to ensure clean state
            }, 2000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to delete account');
            setIsSuccess(false);
            setLoading(false);
            setShowConfirmModal(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
                <h2 className="text-xl font-light text-gray-900 dark:text-gray-100 mb-2">Danger Zone</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                    Irreversible and destructive actions
                </p>
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm font-light ${isSuccess ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                    {message}
                </div>
            )}

            <div className="border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <HiOutlineExclamationTriangle className="text-red-600 dark:text-red-400" size={20} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">Delete Account</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4">
                            Once you delete your account, there is no going back. All your data will be permanently removed.
                        </p>

                        {checkingProjects ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Checking active projects...</p>
                        ) : canDelete === false ? (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                                <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
                                    Cannot delete account
                                </p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-500 font-light mt-1">
                                    You have {activeProjectsCount} active or in-progress {activeProjectsCount === 1 ? 'project' : 'projects'}.
                                    Please complete or cancel them before deleting your account.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                                <p className="text-sm text-green-700 dark:text-green-400 font-light">
                                    ✓ No active projects found. You can delete your account.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={!canDelete || checkingProjects || loading}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-light disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Delete My Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <HiOutlineExclamationTriangle className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Confirm Account Deletion</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4">
                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-700 dark:text-gray-300 font-light mb-2">
                                Type <span className="font-medium text-red-600 dark:text-red-400">DELETE</span> to confirm:
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-red-500 dark:focus:border-red-500 focus:outline-none font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                placeholder="DELETE"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setConfirmText('');
                                }}
                                disabled={loading}
                                className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-light cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading || confirmText !== 'DELETE'}
                                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-light disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
