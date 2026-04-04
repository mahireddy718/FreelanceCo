import { useState } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function RoleSelectionModal({ onComplete }) {
    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!selectedRole) {
            setError('Please select a role');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            console.log('Token:', token ? 'exists' : 'missing');
            console.log('Selected role:', selectedRole);

            const response = await axios.post(
                `${API_BASE_URL}/auth/update-role`,
                { role: selectedRole },
                { headers: { Authorization: token } }
            );

            console.log('Response:', response.data);

            if (response.data.success) {
                onComplete(response.data.user);
            } else {
                setError(response.data.message || 'Failed to update role');
            }
        } catch (err) {
            console.error('Update role error:', err);
            console.error('Error response:', err.response?.data);
            setError(err.response?.data?.message || 'Failed to update role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-sm mx-4 bg-white rounded-lg shadow-lg p-6"
            >
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-xl font-light text-gray-800 mb-1">Welcome to FreelanceCo</h2>
                    <p className="text-sm text-gray-500 font-light">
                        Select your role to continue
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-light">
                        {error}
                    </div>
                )}

                {/* Radio Options */}
                <div className="space-y-3 mb-6">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-300 transition cursor-pointer">
                        <input
                            type="radio"
                            name="role"
                            value="freelancer"
                            checked={selectedRole === 'freelancer'}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer"
                        />
                        <div className="flex-1">
                            <div className="text-sm font-normal text-gray-800">Freelancer</div>
                            <div className="text-xs text-gray-500 font-light">I want to work on projects</div>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-300 transition cursor-pointer">
                        <input
                            type="radio"
                            name="role"
                            value="client"
                            checked={selectedRole === 'client'}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer"
                        />
                        <div className="flex-1">
                            <div className="text-sm font-normal text-gray-800">Client</div>
                            <div className="text-xs text-gray-500 font-light">I want to hire freelancers</div>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-300 transition cursor-pointer">
                        <input
                            type="radio"
                            name="role"
                            value="both"
                            checked={selectedRole === 'both'}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer"
                        />
                        <div className="flex-1">
                            <div className="text-sm font-normal text-gray-800">Both</div>
                            <div className="text-xs text-gray-500 font-light">I want to do both</div>
                        </div>
                    </label>
                </div>

                {/* Confirm Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!selectedRole || loading}
                    className="w-full bg-green-600 text-white font-light py-2.5 text-sm rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Please wait...' : 'Confirm'}
                </button>
            </motion.div>
        </div>
    );
}
