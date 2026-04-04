import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HiOutlineX } from 'react-icons/hi';
import axios from 'axios';
import { showToast } from './Toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ApplicationModal({ isOpen, onClose, project, onSuccess }) {
    const [formData, setFormData] = useState({
        coverLetter: '',
        proposedBudgetMin: project?.budget?.min || '',
        proposedBudgetMax: project?.budget?.max || '',
        proposedDuration: project?.duration || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.coverLetter.length < 50) {
            setError('Cover letter must be at least 50 characters');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/api/applications`,
                {
                    projectId: project._id,
                    coverLetter: formData.coverLetter,
                    proposedBudget: {
                        min: Number(formData.proposedBudgetMin),
                        max: Number(formData.proposedBudgetMax)
                    },
                    proposedDuration: formData.proposedDuration
                },
                {
                    headers: { Authorization: token }
                }
            );

            if (response.data.success) {
                showToast('Application submitted successfully!', 'success');
                onSuccess();
                onClose();
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to submit application';
            setError(errorMessage);
            // Don't show toast for errors, display in modal instead
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h2 className="text-xl font-light text-gray-800 dark:text-gray-200">Apply for Project</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-light mt-0.5">{project?.title}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer"
                                title="Close"
                            >
                                <HiOutlineX size={20} className="text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 font-light">
                                    {error}
                                </div>
                            )}

                            {/* Cover Letter */}
                            <div className="mb-5">
                                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-light">
                                    Cover Letter <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.coverLetter}
                                    onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                                    placeholder="Explain why you're the perfect fit for this project..."
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    rows={6}
                                    required
                                    minLength={50}
                                    maxLength={2000}
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 font-light">
                                    {formData.coverLetter.length}/2000 characters (minimum 50)
                                </p>
                            </div>

                            {/* Proposed Budget */}
                            <div className="mb-5">
                                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-light">
                                    Proposed Budget (₹) <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <input
                                            type="number"
                                            value={formData.proposedBudgetMin}
                                            onChange={(e) => setFormData({ ...formData, proposedBudgetMin: e.target.value })}
                                            placeholder="Minimum"
                                            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                            required
                                            min={100}
                                            max={50000}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            value={formData.proposedBudgetMax}
                                            onChange={(e) => setFormData({ ...formData, proposedBudgetMax: e.target.value })}
                                            placeholder="Maximum"
                                            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                            required
                                            min={100}
                                            max={50000}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 font-light">
                                        Budget must be between ₹100 and ₹50,000
                                    </p>
                                </div>
                            </div>

                            {/* Proposed Duration */}
                            <div className="mb-6">
                                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-light">
                                    Proposed Timeline <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.proposedDuration}
                                        onChange={(e) => setFormData({ ...formData, proposedDuration: e.target.value })}
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:border-green-600 dark:focus:border-green-500 focus:outline-none font-light bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select duration</option>
                                        <option value="1-3 days">1-3 days</option>
                                        <option value="3-5 days">3-5 days</option>
                                        <option value="1-2 weeks">1-2 weeks</option>
                                        <option value="2-4 weeks">2-4 weeks</option>
                                        <option value="1 month">1 month</option>
                                        <option value="More than 1 month">More than 1 month</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-light cursor-pointer"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition font-light disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed cursor-pointer"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
