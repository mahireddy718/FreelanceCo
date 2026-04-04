import { motion } from 'motion/react';
import { HiOutlineDocumentText, HiOutlineCheck, HiOutlineBan, HiOutlineClock, HiOutlineDownload } from 'react-icons/hi';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Rqm0GwJb97hPsJ';

export default function ContractCard({ contract, onUpdate }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const isClient = contract.clientId._id === user?.userId;
    const isFreelancer = contract.freelancerId._id === user?.userId;

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const navigate = useNavigate();

    const handleAction = async (status) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.patch(
                `${API_BASE_URL}/api/contracts/${contract._id}/status`,
                { status },
                { headers: { Authorization: token } }
            );

            // Check if payment is required
            if (response.data.requiresPayment && response.data.paymentDetails) {
                // Payment required - navigate to payment page
                navigate(`/payment/${response.data.paymentDetails.projectId}`, {
                    state: {
                        amount: response.data.paymentDetails.amount,
                        contractId: response.data.paymentDetails.contractId,
                        contractTitle: contract.contractDetails.title,
                        freelancerName: contract.freelancerId?.name
                    }
                });
            } else {
                // No payment required or contract rejected
                onUpdate && onUpdate(response.data.contract);
            }
        } catch (err) {
            console.error('Error updating contract:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentFlow = async (paymentDetails, updatedContract) => {
        setProcessingPayment(true);
        try {
            const token = localStorage.getItem('authToken');

            // Create Razorpay order
            const orderResponse = await axios.post(
                `${API_BASE_URL}/api/payments/create-order`,
                {
                    projectId: paymentDetails.projectId,
                    amount: paymentDetails.amount,
                    contractId: paymentDetails.contractId
                },
                { headers: { Authorization: token } }
            );

            const { order, keyId } = orderResponse.data;

            // Open Razorpay checkout
            const options = {
                key: keyId || RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'FreelanceCo',
                description: `Escrow payment for ${contract.contractDetails.title}`,
                order_id: order.id,
                handler: async function (razorpayResponse) {
                    await verifyPayment(razorpayResponse, paymentDetails.projectId, updatedContract);
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#16a34a'
                },
                modal: {
                    ondismiss: function () {
                        setProcessingPayment(false);
                        console.log('Payment cancelled');
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            console.error('Payment initiation error:', err);
            setProcessingPayment(false);
        }
    };

    const verifyPayment = async (razorpayResponse, projectId, updatedContract) => {
        try {
            const token = localStorage.getItem('authToken');
            const verifyResponse = await axios.post(
                `${API_BASE_URL}/api/payments/verify`,
                {
                    razorpay_order_id: razorpayResponse.razorpay_order_id,
                    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                    razorpay_signature: razorpayResponse.razorpay_signature,
                    projectId: projectId
                },
                { headers: { Authorization: token } }
            );

            if (verifyResponse.data.success) {
                // Payment successful - update contract with escrow funding
                updatedContract.escrowFunded = true;
                updatedContract.escrowFundedAt = new Date();
                onUpdate && onUpdate(updatedContract);
            }
        } catch (err) {
            console.error('Payment verification error:', err);
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleDownload = () => {
        const doc = new jsPDF();
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // --- Background & Watermark ---
        doc.setFillColor(248, 250, 252); // Very light gray/blue background
        doc.rect(0, 0, width, height, 'F');

        doc.setTextColor(240, 240, 240);
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        doc.text('ORIGINAL', width / 2, height / 2, { align: 'center', angle: 45 });

        // --- Border ---
        doc.setLineWidth(2);
        doc.setDrawColor(100, 100, 100);
        doc.rect(10, 10, width - 20, height - 20);
        doc.setLineWidth(0.5);
        doc.rect(12, 12, width - 24, height - 24);

        // --- Header (e-Stamp Style) ---
        // Header Background
        doc.setFillColor(230, 240, 230); // Light green for header
        doc.rect(13, 13, width - 26, 40, 'F');

        // Govt Label
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text('FREELANCECO', width / 2, 25, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('e-Stamp', width / 2, 32, { align: 'center' });

        // Certificate Details
        doc.setFontSize(9);
        doc.text(`Certificate No.    : IN-${contract._id.slice(0, 10).toUpperCase()}`, 20, 42);
        doc.text(`Certificate Issued : ${new Date().toLocaleString()}`, 20, 48);
        doc.text(`Account Reference  : FREELANCECO-BOND-${new Date().getFullYear()}`, width - 80, 42);
        doc.text(`Unique Doc. Ref.   : ${contract._id}`, width - 80, 48);

        // --- Main Title ---
        doc.setFont('times', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(22, 100, 50); // Dark Green
        doc.text('WORK CONTRACT AGREEMENT', width / 2, 70, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(40, 72, width - 40, 72);

        // --- Agreement Text ---
        let yPos = 90;
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        const introText = `THIS AGREEMENT is made on this ${new Date(contract.status === 'accepted' ? contract.updatedAt : Date.now()).toLocaleDateString()} by and between:`;
        doc.text(introText, 25, yPos);
        yPos += 15;

        // Parties Box
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(25, yPos, width - 50, 35, 2, 2, 'FD');

        const clientText = `FIRST PARTY (Client): ${contract.clientId.name}`;
        const freelancerText = `SECOND PARTY (Freelancer): ${contract.freelancerId.name}`;

        doc.setFont('times', 'bold');
        doc.text(clientText, 30, yPos + 12);
        doc.text(freelancerText, 30, yPos + 24);

        yPos += 50;

        // Content
        doc.setFont('times', 'normal');
        const bodyText = `WHEREAS, the First Party has a requirement for certain services and the Second Party has agreed to provide such services under the following terms and conditions:

1. PROJECT TITLE: ${contract.contractDetails.title}

2. SCOPE OF WORK:
${contract.contractDetails.scope}

3. FINANCIALS:
The agreed consideration for the services is INR ${contract.contractDetails.finalAmount.toLocaleString()}.

4. TIMELINE:
The duration of the project shall be ${contract.contractDetails.duration}, commencing from ${new Date(contract.contractDetails.startDate).toLocaleDateString()}.

5. PAYMENT TERMS:
${contract.contractDetails.paymentTerms}`;

        const splitBody = doc.splitTextToSize(bodyText, width - 50);
        doc.text(splitBody, 25, yPos);
        yPos += (splitBody.length * 6) + 10;

        // Deliverables (if fit)
        if (contract.contractDetails.deliverables?.length > 0 && yPos < height - 60) {
            doc.text('6. DELIVERABLES:', 25, yPos);
            yPos += 6;
            contract.contractDetails.deliverables.forEach(d => {
                doc.text(`- ${d}`, 30, yPos);
                yPos += 6;
            });
        }

        // --- footer / Signatures ---
        yPos = Math.max(yPos + 20, height - 60);

        doc.setFont('times', 'bold');
        doc.text('For First Party', 40, yPos);
        doc.text('For Second Party', width - 80, yPos);

        // Stamps
        if (contract.status === 'accepted') {
            // Circle Stamp
            doc.setDrawColor(0, 100, 0); // Dark Green
            doc.setLineWidth(1);
            doc.circle(width - 60, yPos + 15, 12);
            doc.setFontSize(8);
            doc.setTextColor(0, 100, 0);
            doc.text('APPROVED', width - 60, yPos + 15, { align: 'center' });
            doc.text('FREELANCECO', width - 60, yPos + 12, { align: 'center', angle: 30 }); // Curved-ish text hack

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text('(Digitally Signed)', 40, yPos + 20);
            doc.text('(Digitally Signed)', width - 80, yPos + 20);
        } else {
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('(Pending Signature)', 40, yPos + 20);
            doc.text('(Pending Signature)', width - 80, yPos + 20);
        }

        doc.save(`Bond_Agreement_${contract._id}.pdf`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            case 'accepted': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'rejected': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-4 p-5 bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-800 border-2 border-green-200 dark:border-green-800 rounded-lg shadow-sm"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <HiOutlineDocumentText size={24} className="text-green-600 dark:text-green-500" />
                    <div>
                        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Work Contract Proposal</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-0.5">
                            Proposed by {contract.freelancerId.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        disabled={contract.status !== 'accepted'}
                        className={`p-1.5 rounded-lg transition ${contract.status === 'accepted'
                            ? 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer'
                            : 'text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
                            }`}
                        title={contract.status === 'accepted' ? 'Download Contract PDF' : 'Contract must be accepted to download PDF'}
                    >
                        <HiOutlineDownload size={20} />
                    </button>
                    <span className={`px-3 py-1 text-xs rounded-full border font-light ${getStatusColor(contract.status)}`}>
                        {contract.status}
                    </span>
                </div>
            </div>

            {/* Contract Details */}
            <div className="space-y-3 mb-4">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Project Title</p>
                    <p className="text-sm font-normal text-gray-800 dark:text-gray-200">{contract.contractDetails.title}</p>
                </div>

                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Scope of Work</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-light line-clamp-3">{contract.contractDetails.scope}</p>
                </div>

                {contract.contractDetails.deliverables?.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Deliverables</p>
                        <ul className="text-sm text-gray-700 dark:text-gray-300 font-light space-y-1">
                            {contract.contractDetails.deliverables.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-500 mt-0.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Project Amount</p>
                        <p className="text-sm font-normal text-gray-800 dark:text-gray-200">
                            ₹{contract.contractDetails.finalAmount.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Duration</p>
                        <p className="text-sm font-normal text-gray-800 dark:text-gray-200">{contract.contractDetails.duration}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Start Date</p>
                        <p className="text-sm font-normal text-gray-800 dark:text-gray-200">
                            {new Date(contract.contractDetails.startDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Payment Terms</p>
                        <p className="text-sm font-normal text-gray-800 dark:text-gray-200">{contract.contractDetails.paymentTerms}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {contract.status === 'pending' && isClient && (
                <div className="flex gap-2 pt-3 border-t border-green-200 dark:border-green-800">
                    <button
                        onClick={() => handleAction('accepted')}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-green-600 dark:bg-green-500 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition font-light cursor-pointer disabled:opacity-50"
                    >
                        <HiOutlineCheck size={16} />
                        Accept Contract
                    </button>
                    <button
                        onClick={() => handleAction('rejected')}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-light cursor-pointer disabled:opacity-50"
                    >
                        <HiOutlineBan size={16} />
                        Reject
                    </button>
                </div>
            )}

            {contract.status === 'accepted' && (
                <div className="flex items-center gap-2 pt-3 border-t border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 font-light">
                    <HiOutlineCheck size={16} />
                    <span>Contract accepted • Project assigned to {contract.freelancerId.name}</span>
                </div>
            )}

            {/* Escrow Funding Status */}
            {contract.status === 'accepted' && contract.escrowFunded && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                    {/* Check if payment is released */}
                    {contract.paymentReleased || contract.escrowStatus === 'released' ? (
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                            <div className="w-10 h-10 bg-green-600 dark:bg-green-700 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                                    {isClient ? '✓ Payment Released Successfully' : '✓ Payment Received Successfully'}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 font-light mt-0.5">
                                    {isClient
                                        ? `₹${contract.contractDetails.finalAmount.toLocaleString()} has been released to ${contract.freelancerId.name}. Project completed!`
                                        : `₹${contract.contractDetails.finalAmount.toLocaleString()} has been credited to your account. Congratulations!`
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="w-8 h-8 bg-green-600 dark:bg-green-700 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                    {isFreelancer ? '✓ Project Funded - Payment in Escrow' : '✓ Payment Held in Escrow'}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 font-light mt-0.5">
                                    {isFreelancer
                                        ? `Client has deposited ₹${contract.contractDetails.finalAmount.toLocaleString()} in escrow. Funds will be released upon project completion and approval.`
                                        : `₹${contract.contractDetails.finalAmount.toLocaleString()} held securely. Will be released to freelancer upon your approval of completed work.`
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Processing Payment Indicator */}
            {processingPayment && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-blue-700 dark:text-blue-400 font-light">Processing payment...</p>
                    </div>
                </div>
            )}

            {contract.status === 'rejected' && contract.clientNotes && (
                <div className="pt-3 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light mb-1">Client Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-light">{contract.clientNotes}</p>
                </div>
            )}

            {contract.status === 'pending' && isFreelancer && (
                <div className="flex items-center gap-2 pt-3 border-t border-green-200 dark:border-green-800 text-sm text-yellow-700 dark:text-yellow-400 font-light">
                    <HiOutlineClock size={16} />
                    <span>Waiting for client's response</span>
                </div>
            )}
        </motion.div>
    );
}
