import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import {
    HiOutlineCreditCard,
    HiOutlineShieldCheck,
    HiOutlineCheckCircle,
    HiOutlineCurrencyRupee,
    HiOutlineBriefcase,
    HiOutlineArrowLeft
} from 'react-icons/hi';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Rqm0GwJb97hPsJ';

const PaymentPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    // Get payment details from state
    const amount = location.state?.amount || null;
    const contractId = location.state?.contractId || null;
    const contractTitle = location.state?.contractTitle || null;
    const freelancerName = location.state?.freelancerName || null;

    useEffect(() => {
        fetchProjectDetails();
        loadRazorpayScript();
    }, [projectId]);

    const fetchProjectDetails = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/projects/${projectId}`,
                { headers: { Authorization: token } }
            );
            setProject(response.data.project);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching project:', err);
            setError('Failed to load project details');
            setLoading(false);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!amount) {
            setError('Payment amount not specified');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');

            const orderResponse = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/payments/create-order`,
                {
                    projectId: projectId,
                    amount: amount,
                    contractId: contractId // Pass contractId for escrow payment
                },
                { headers: { Authorization: token } }
            );

            const { order, keyId } = orderResponse.data;

            const options = {
                key: keyId || RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'FreelanceCo',
                description: `Payment for ${project.title}`,
                order_id: order.id,
                handler: async function (response) {
                    await verifyPayment(response);
                },
                prefill: {
                    name: localStorage.getItem('userName') || '',
                    email: localStorage.getItem('userEmail') || '',
                    contact: localStorage.getItem('userPhone') || ''
                },
                theme: {
                    color: '#16a34a'
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.response?.data?.message || 'Failed to initiate payment');
            setProcessing(false);
        }
    };

    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const verifyPayment = async (paymentResponse) => {
        try {
            const token = localStorage.getItem('authToken');
            const verifyResponse = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/payments/verify`,
                {
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_signature: paymentResponse.razorpay_signature,
                    projectId: projectId
                },
                { headers: { Authorization: token } }
            );

            if (verifyResponse.data.success) {
                // Show success screen first
                setPaymentSuccess(true);
                setProcessing(false);

                // Redirect after 3 seconds
                setTimeout(() => {
                    if (contractId) {
                        navigate('/chat', {
                            state: { paymentSuccess: true }
                        });
                    } else {
                        navigate(`/project-workspace/${projectId}`, {
                            state: { paymentSuccess: true }
                        });
                    }
                }, 3000);
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError('Payment verification failed. Please contact support if amount was deducted.');
            setProcessing(false);
        }
    };

    // Payment Success Screen
    if (paymentSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-gray-900 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-8 max-w-md w-full text-center"
                >
                    {/* Success Animation */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <HiOutlineCheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </motion.div>

                    <h1 className="text-2xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                        Payment Successful! 🎉
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-light mb-4">
                        ₹{amount?.toLocaleString('en-IN')} has been deposited to escrow
                    </p>

                    {contractTitle && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                            <p className="text-sm text-green-800 dark:text-green-300 font-light">
                                Contract "<span className="font-medium">{contractTitle}</span>" is now active!
                            </p>
                            {freelancerName && (
                                <p className="text-xs text-green-600 dark:text-green-400 font-light mt-1">
                                    {freelancerName} can now start working on your project.
                                </p>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
                        Redirecting you back...
                    </p>
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3 }}
                            className="h-full bg-green-600 dark:bg-green-500"
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-light">Loading payment details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-gray-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 font-light transition"
                    >
                        <HiOutlineArrowLeft size={20} />
                        Back
                    </button>
                    <h1 className="text-3xl font-light text-gray-800 dark:text-gray-200 mb-2">Complete Payment</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Secure payment powered by Razorpay</p>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                        <p className="text-sm text-red-700 dark:text-red-400 font-light">{error}</p>
                    </motion.div>
                )}

                {/* Payment Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                    {/* Project Info */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-green-50 to-white dark:from-green-900/20 dark:to-gray-900">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <HiOutlineBriefcase className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg text-left font-medium text-gray-800 dark:text-gray-200 mb-1">{project?.title}</h2>
                                <p className="text-sm text-left text-gray-600 dark:text-gray-400 font-light line-clamp-2">
                                    {project?.description}
                                </p>
                                {/* Show contract details if coming from contract acceptance */}
                                {contractTitle && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <p className="text-xs text-left text-gray-500 dark:text-gray-400 font-light">
                                            Contract: <span className="text-gray-700 dark:text-gray-300">{contractTitle}</span>
                                        </p>
                                        {freelancerName && (
                                            <p className="text-xs text-left text-gray-500 dark:text-gray-400 font-light mt-1">
                                                Freelancer: <span className="text-gray-700 dark:text-gray-300">{freelancerName}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Amount Section */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-light">Project Amount</span>
                            <div className="flex items-center gap-1 text-2xl font-light text-gray-800 dark:text-gray-200">
                                <HiOutlineCurrencyRupee size={24} />
                                {amount?.toLocaleString('en-IN')}
                            </div>
                        </div>

                        {/* Payment breakdown */}
                        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400 font-light">Subtotal</span>
                                <span className="text-gray-700 dark:text-gray-300 font-light">₹{amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400 font-light">Processing Fee</span>
                                <span className="text-green-600 dark:text-green-400 font-light">Free</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-gray-800 dark:text-gray-200 font-medium">Total Amount</span>
                                <span className="text-lg font-medium text-gray-800 dark:text-gray-200">₹{amount?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-start gap-3 mb-4">
                            <HiOutlineShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm text-left font-medium text-gray-800 dark:text-gray-200 mb-1">Secure Payment</h3>
                                <p className="text-xs text-left text-gray-600 dark:text-gray-400 font-light">
                                    Your payment is secured with 256-bit encryption and processed by Razorpay
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <HiOutlineCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm text-left font-medium text-gray-800 dark:text-gray-200 mb-1">Money-back Guarantee</h3>
                                <p className="text-xs text-left text-gray-600 dark:text-gray-400 font-light">
                                    Protected by FreelanceCo's secure escrow system
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Button */}
                    <div className="p-6">
                        <button
                            onClick={handlePayment}
                            disabled={processing || !amount}
                            className={`w-full py-3 px-6 rounded-lg font-light text-white transition-all flex items-center justify-center gap-2 ${processing || !amount
                                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-sm hover:shadow-md'
                                }`}
                        >
                            {processing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <HiOutlineCreditCard size={20} />
                                    Pay ₹{amount?.toLocaleString('en-IN')}
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 font-light mt-4">
                            By proceeding, you agree to FreelanceCo's terms and conditions
                        </p>
                    </div>
                </motion.div>

                {/* Payment Methods */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-center"
                >
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-3">Accepted Payment Methods</p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <span className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-light">
                            Credit Card
                        </span>
                        <span className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-light">
                            Debit Card
                        </span>
                        <span className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-light">
                            UPI
                        </span>
                        <span className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-light">
                            Net Banking
                        </span>
                        <span className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-light">
                            Wallets
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PaymentPage;
