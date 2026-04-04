import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineDocumentText, HiOutlinePaperClip } from 'react-icons/hi';
import { CiCircleInfo } from "react-icons/ci";
import axios from 'axios';
import socketService from '../../services/socketService';
import MessageInput from './MessageInput';
import ContractProposalModal from './ContractProposalModal';
import ContractCard from './ContractCard';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ChatWindow({ conversation, onBack }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [showContractsModal, setShowContractsModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const isGlobal = conversation.conversationType === 'global';
    const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
    const otherUser = participants.find(p => p._id !== user?.userId) || null;
    const isFreelancer = !isGlobal && conversation.applicationId && user?.userId === participants.find(p => p._id !== conversation.projectId?.clientId)?._id;

    useEffect(() => {
        fetchMessages();
        if (!isGlobal) {
            fetchContracts();
        } else {
            setContracts([]);
        }
        socketService.joinConversation(conversation._id);
        socketService.markAsRead(conversation._id);

        // Listen for new messages
        socketService.onNewMessage(handleNewMessage);
        socketService.onUserTyping(handleUserTyping);

        // Listen for contract events (real-time updates)
        const handleContractProposed = ({ contract, conversationId }) => {
            if (conversationId === conversation._id) {
                // Check if contract already exists to prevent duplicates
                setContracts(prev => {
                    const exists = prev.some(c => c._id === contract._id);
                    if (exists) return prev;
                    return [contract, ...prev];
                });
                // Auto-show contracts modal when a new one is proposed
                setShowContractsModal(true);
            }
        };

        const handleContractUpdated = ({ contract, conversationId }) => {
            if (conversationId === conversation._id) {
                setContracts(prev => prev.map(c => c._id === contract._id ? contract : c));
            }
        };

        socketService.onContractProposed(handleContractProposed);
        socketService.onContractUpdated(handleContractUpdated);

        return () => {
            socketService.leaveConversation(conversation._id);
            socketService.offNewMessage(handleNewMessage);
            socketService.offUserTyping(handleUserTyping);

            socketService.offContractProposed(handleContractProposed);
            socketService.offContractUpdated(handleContractUpdated);
        };
    }, [conversation._id, isGlobal]);

    useEffect(() => {
        // Scroll to bottom when messages change - only scroll within container
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/chat/conversations/${conversation._id}`,
                { headers: { Authorization: token } }
            );

            setMessages(response.data.messages || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchContracts = async () => {
        if (isGlobal) {
            setContracts([]);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/contracts/conversation/${conversation._id}`,
                { headers: { Authorization: token } }
            );
            setContracts(response.data.contracts || []);
        } catch (err) {
            console.error('Error fetching contracts:', err);
        }
    };

    const handleNewMessage = ({ message, conversationId }) => {
        if (conversationId === conversation._id) {
            setMessages(prev => [...prev, message]);
            socketService.markAsRead(conversation._id);
        }
    };

    const handleUserTyping = ({ userId, isTyping }) => {
        if (userId !== user?.userId) {
            setOtherUserTyping(isTyping);

            // Clear typing indicator after 3 seconds
            if (isTyping) {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setOtherUserTyping(false);
                }, 3000);
            }
        }
    };

    const formatMessageTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatMessageDate = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const groupMessagesByDate = () => {
        const groups = [];
        let currentDate = null;

        messages.forEach(message => {
            const messageDate = new Date(message.createdAt).toDateString();

            if (messageDate !== currentDate) {
                currentDate = messageDate;
                groups.push({
                    type: 'date',
                    date: message.createdAt
                });
            }

            groups.push({
                type: 'message',
                data: message
            });
        });

        return groups;
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header - Clean & Minimal */}
            <div className="border-b border-emerald-100 dark:border-emerald-900/50 px-6 py-3 flex items-center gap-3 shrink-0 bg-white/70 dark:bg-emerald-950/35">
                <button
                    onClick={onBack}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <HiOutlineChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                {isGlobal ? (
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 text-sm font-semibold">
                        G
                    </div>
                ) : (
                    otherUser?.username ? (
                        <Link to={`/user/${otherUser.username}`}>
                            {otherUser?.avatar ? (
                                <img
                                    src={otherUser.avatar}
                                    alt={otherUser.name}
                                    referrerPolicy="no-referrer"
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm font-medium">
                                    {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </Link>
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm font-medium">
                            {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )
                )}

                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{isGlobal ? (conversation.name || 'Global Chat') : (otherUser?.name || 'Direct Chat')}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {isGlobal ? 'Message everyone in FreelanceCo' : (conversation.projectId?.title || 'Direct message')}
                    </p>
                </div>

                {!isGlobal && contracts.length > 0 && (
                    <button
                        onClick={() => setShowContractsModal(true)}
                        className="p-2 rounded-lg transition text-green-400 hover:bg-green-900/20"
                        title="View Contracts"
                    >
                        <CiCircleInfo size={20} />
                    </button>
                )}

                {/* Propose Contract Button - Freelancers only */}
                {isFreelancer && conversation.applicationId && (() => {
                    const hasAcceptedContract = contracts.some(c => c.status === 'accepted');
                    const hasPendingContract = contracts.some(c => c.status === 'pending');
                    const isDisabled = hasAcceptedContract || hasPendingContract;

                    let buttonText = 'Propose Contract';
                    let buttonTitle = 'Propose a new contract';

                    if (hasAcceptedContract) {
                        buttonText = 'Accepted';
                        buttonTitle = 'Contract already accepted';
                    } else if (hasPendingContract) {
                        buttonText = 'Pending';
                        buttonTitle = 'Waiting for client response';
                    }

                    return (
                        <button
                            onClick={() => setShowContractModal(true)}
                            disabled={isDisabled}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition ${isDisabled
                                ? 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
                                : 'text-green-700 dark:text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                }`}
                            title={buttonTitle}
                        >
                            <HiOutlineDocumentText size={14} />
                            {buttonText}
                        </button>
                    );
                })()}
            </div>

            {/* Messages Area - Fixed height, scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-transparent overscroll-contain">
                {/* Messages */}
                <div className="space-y-3">
                    {groupMessagesByDate().map((item, index) => {
                        if (item.type === 'date') {
                            return (
                                <div key={`date-${index}`} className="flex justify-center my-4">
                                    <span className="px-3 py-1 bg-white/80 dark:bg-emerald-950/40 text-gray-500 dark:text-gray-400 text-xs rounded-full border border-emerald-100 dark:border-emerald-900/50">
                                        {formatMessageDate(item.date)}
                                    </span>
                                </div>
                            );
                        }

                        const message = item.data;

                        // System messages - Compact one-liner with time
                        if (message.messageType === 'system') {
                            return (
                                <div key={message._id} className="flex flex-col items-center my-3">
                                    {/* Time above banner - WhatsApp style */}
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-light mb-1">
                                        {formatMessageTime(message.createdAt)}
                                    </p>
                                    {/* Banner */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-3 py-1.5 rounded-md">
                                        <p className="text-xs text-gray-700 dark:text-gray-300 font-light">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        }

                        // Regular user messages - Clean bubbles
                        const isMine = message.senderId?._id === user?.userId;
                        const senderName = message.senderId?.name || 'User';

                        return (
                            <div
                                key={message._id}
                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {!isMine && isGlobal && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                                            {senderName}
                                        </span>
                                    )}
                                    <div
                                        className={`px-4 py-2 rounded-2xl ${isMine
                                                ? 'bg-emerald-700 text-white rounded-br-sm'
                                                : 'bg-white/85 dark:bg-emerald-950/45 text-gray-800 dark:text-gray-200 border border-emerald-100 dark:border-emerald-900/50 rounded-bl-sm'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap wrap-break-word">
                                            {message.content}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
                                        {formatMessageTime(message.createdAt)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {otherUserTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white/85 dark:bg-emerald-950/45 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3 rounded-2xl rounded-bl-sm">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input - Clean & Fixed at bottom */}
            <div className="border-t border-emerald-100 dark:border-emerald-900/50 bg-white/75 dark:bg-emerald-950/35">
                <MessageInput conversationId={conversation._id} />
            </div>

            {/* Contracts Modal */}
            {showContractsModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4" onClick={() => setShowContractsModal(false)}>
                    <div className="glass-surface rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Contract Details</h2>
                            <button
                                onClick={() => setShowContractsModal(false)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer"
                            >
                                <HiOutlineChevronLeft size={20} className="text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {contracts.length > 0 ? (
                                <div className="space-y-4">
                                    {contracts.map(contract => (
                                        <ContractCard
                                            key={contract._id}
                                            contract={contract}
                                            onUpdate={(updatedContract) => {
                                                setContracts(prev => prev.map(c => c._id === updatedContract._id ? updatedContract : c));
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">No contracts available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Contract Proposal Modal */}
            {showContractModal && conversation.applicationId && (
                <ContractProposalModal
                    conversation={conversation}
                    application={{ _id: conversation.applicationId, proposedBudget: { min: 0, max: 0 }, proposedDuration: '', coverLetter: '' }}
                    onClose={() => setShowContractModal(false)}
                    onSuccess={(contract) => {
                        // Prevent duplicates by checking if contract already exists
                        setContracts(prev => {
                            const exists = prev.some(c => c._id === contract._id);
                            if (exists) return prev;
                            return [contract, ...prev];
                        });
                        setShowContractsModal(true);
                        setShowContractModal(false);
                    }}
                />
            )}
        </div>
    );
}
