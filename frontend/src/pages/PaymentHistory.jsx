import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/PaymentHistory.css';

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, client, freelancer
    const [statusFilter, setStatusFilter] = useState('all'); // all, captured, failed, pending
    const navigate = useNavigate();

    useEffect(() => {
        fetchPayments();
    }, [filter, statusFilter]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            let url = `${import.meta.env.VITE_API_URL}/api/payments/history?`;
            if (filter !== 'all') {
                url += `role=${filter}&`;
            }
            if (statusFilter !== 'all') {
                url += `status=${statusFilter}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPayments(response.data.payments || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'captured':
                return 'status-badge success';
            case 'failed':
                return 'status-badge failed';
            case 'pending':
            case 'created':
                return 'status-badge pending';
            case 'refunded':
                return 'status-badge refunded';
            default:
                return 'status-badge';
        }
    };

    const getStatusText = (status) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="payment-history-page">
            <div className="payment-history-container">
                <div className="page-header">
                    <h1>Payment History</h1>
                    <p>View all your transaction history</p>
                </div>

                <div className="filters-section">
                    <div className="filter-group">
                        <label>Role Filter:</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Transactions</option>
                            <option value="client">As Client (Sent)</option>
                            <option value="freelancer">As Freelancer (Received)</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Status Filter:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="captured">Successful</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading payments...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-receipt"></i>
                        <h3>No Payments Found</h3>
                        <p>You don't have any payment transactions yet.</p>
                    </div>
                ) : (
                    <div className="payments-list">
                        {payments.map((payment) => (
                            <div
                                key={payment._id}
                                className="payment-card"
                                onClick={() => navigate(`/project-workspace/${payment.projectId._id}`)}
                            >
                                <div className="payment-card-header">
                                    <div className="project-info">
                                        {payment.projectId?.thumbnail && (
                                            <img
                                                src={payment.projectId.thumbnail}
                                                alt={payment.projectId.title}
                                                className="project-thumb"
                                            />
                                        )}
                                        <div className="project-details">
                                            <h3>{payment.projectId?.title || 'N/A'}</h3>
                                            <p className="transaction-id">
                                                Transaction ID: {payment.razorpayPaymentId || payment.razorpayOrderId}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={getStatusBadgeClass(payment.status)}>
                                        {getStatusText(payment.status)}
                                    </div>
                                </div>

                                <div className="payment-card-body">
                                    <div className="payment-detail-row">
                                        <span className="detail-label">
                                            <i className="fas fa-user"></i>
                                            Client:
                                        </span>
                                        <span className="detail-value">{payment.clientId?.name || 'N/A'}</span>
                                    </div>

                                    <div className="payment-detail-row">
                                        <span className="detail-label">
                                            <i className="fas fa-user-tie"></i>
                                            Freelancer:
                                        </span>
                                        <span className="detail-value">{payment.freelancerId?.name || 'N/A'}</span>
                                    </div>

                                    <div className="payment-detail-row">
                                        <span className="detail-label">
                                            <i className="fas fa-calendar"></i>
                                            Date:
                                        </span>
                                        <span className="detail-value">{formatDate(payment.createdAt)}</span>
                                    </div>

                                    {payment.paymentMethod && (
                                        <div className="payment-detail-row">
                                            <span className="detail-label">
                                                <i className="fas fa-credit-card"></i>
                                                Method:
                                            </span>
                                            <span className="detail-value">{payment.paymentMethod}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="payment-card-footer">
                                    <div className="amount-display">
                                        <span className="currency">₹</span>
                                        <span className="amount">{payment.amount?.toLocaleString('en-IN')}</span>
                                    </div>
                                    {payment.verified && (
                                        <div className="verified-badge">
                                            <i className="fas fa-check-circle"></i>
                                            Verified
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHistory;
