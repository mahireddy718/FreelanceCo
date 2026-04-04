import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HiOutlineX, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ContractProposalModal({ conversation, application, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: conversation.projectId?.title || '',
        scope: '',
        deliverables: [''],
        finalAmount: 0,
        duration: '',
        paymentTerms: 'Full payment on completion',
        startDate: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [fetchingApp, setFetchingApp] = useState(true);

    useEffect(() => {
        const fetchApplicationDetails = async () => {
            if (!application?._id && !conversation.applicationId) {
                setFetchingApp(false);
                return;
            }

            try {
                const appId = application?._id || conversation.applicationId;
                const token = localStorage.getItem('authToken');
                const response = await axios.get(`${API_BASE_URL}/api/applications/${appId}`, {
                    headers: { Authorization: token }
                });

                if (response.data.application) {
                    const app = response.data.application;
                    // Use the max budget as the final amount (or average)
                    const finalAmount = app.proposedBudget?.max || app.proposedBudget?.min || 0;
                    setFormData(prev => ({
                        ...prev,
                        scope: app.coverLetter || '',
                        finalAmount: finalAmount,
                        duration: app.proposedDuration || ''
                    }));
                }
            } catch (err) {
                console.error('Error fetching application details:', err);
            } finally {
                setFetchingApp(false);
            }
        };

        fetchApplicationDetails();
    }, [conversation.applicationId, application?._id]);

    const handleDeliverableChange = (index, value) => {
        const newDeliverables = [...formData.deliverables];
        newDeliverables[index] = value;
        setFormData({ ...formData, deliverables: newDeliverables });
    };

    const addDeliverable = () => {
        setFormData({ ...formData, deliverables: [...formData.deliverables, ''] });
    };

    const removeDeliverable = (index) => {
        const newDeliverables = formData.deliverables.filter((_, i) => i !== index);
        setFormData({ ...formData, deliverables: newDeliverables });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/api/contracts`,
                {
                    conversationId: conversation._id,
                    projectId: conversation.projectId._id,
                    applicationId: application?._id || conversation.applicationId,
                    contractDetails: {
                        title: formData.title,
                        scope: formData.scope,
                        deliverables: formData.deliverables.filter(d => d.trim() !== ''),
                        finalAmount: Number(formData.finalAmount),
                        currency: 'INR',
                        duration: formData.duration,
                        paymentTerms: formData.paymentTerms,
                        startDate: new Date(formData.startDate)
                    }
                },
                { headers: { Authorization: token } }
            );

            onSuccess && onSuccess(response.data.contract);
            onClose();
        } catch (err) {
            console.error('Error proposing contract:', err);
            alert('Failed to propose contract');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-normal text-gray-800 dark:text-gray-200">Propose Work Contract</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer"
                    >
                        <HiOutlineX size={20} className="text-gray-400 dark:text-gray-500" />
                    </button>
                </div>

                {/* Loading State */}
                {fetchingApp ? (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-light">Loading application details...</p>
                    </div>
                ) : (
                    /* Form */
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div className="space-y-4">
                            {/* Project Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    required
                                />
                            </div>

                            {/* Scope of Work */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scope of Work</label>
                                <textarea
                                    value={formData.scope}
                                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    required
                                />
                            </div>

                            {/* Deliverables */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deliverables</label>
                                    <button
                                        type="button"
                                        onClick={addDeliverable}
                                        className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 cursor-pointer"
                                    >
                                        <HiOutlinePlus size={14} />
                                        Add
                                    </button>
                                </div>
                                {formData.deliverables.map((deliverable, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={deliverable}
                                            onChange={(e) => handleDeliverableChange(index, e.target.value)}
                                            placeholder={`Deliverable ${index + 1}`}
                                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        />
                                        {formData.deliverables.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDeliverable(index)}
                                                className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer"
                                            >
                                                <HiOutlineTrash size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Fixed Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Amount (₹)</label>
                                <input
                                    type="number"
                                    value={formData.finalAmount}
                                    onChange={(e) => setFormData({ ...formData, finalAmount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    placeholder="Enter fixed project amount"
                                    min="0"
                                    step="100"
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-light">This is the total fixed amount that will be paid for this project</p>
                            </div>

                            {/* Duration & Start Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="e.g., 2 weeks, 1 month"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Payment Terms */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
                                <select
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    className="w-full h-10 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-light bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="Milestone-based">Milestone-based</option>
                                    <option value="50% upfront, 50% on completion">50% upfront, 50% on completion</option>
                                    <option value="Full payment on completion">Full payment on completion</option>
                                    <option value="Weekly payments">Weekly payments</option>
                                    <option value="Monthly payments">Monthly payments</option>
                                </select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-light cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition font-light cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Proposing...' : 'Propose Contract'}
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
