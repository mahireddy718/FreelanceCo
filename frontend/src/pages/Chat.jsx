import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { HiOutlineChat, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import axios from 'axios';
import socketService from '../services/socketService';
import ConversationsList from '../components/chat/ConversationsList';
import ChatWindow from '../components/chat/ChatWindow';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function Chat() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320); // Default 320px (md:w-80)
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);

    const activateConversation = (conversation) => {
        if (!conversation) return;

        setSelectedConversation(conversation);
        setShowMobileChat(true);
        setShowSearch(false);
        setSearchQuery('');
        localStorage.setItem('lastSelectedConversation', conversation._id);

        setConversations(prev => prev.map(conv =>
            conv._id === conversation._id
                ? { ...conv, unreadCount: 0 }
                : conv
        ));
    };

    const findConversationWithUser = (allConversations, targetUserId) => {
        return allConversations.find(conv =>
            conv.conversationType !== 'global' &&
            conv.participants?.some(p => p._id === targetUserId)
        );
    };

    const handleSearchResultClick = async (resultUser) => {
        await handleStartChat(resultUser);
    };

    useEffect(() => {
        // Connect socket
        const token = localStorage.getItem('authToken');
        if (token) {
            socketService.connect(token);
        }

        fetchConversations();

        // Listen for conversation updates
        socketService.onConversationUpdated(handleConversationUpdate);

        return () => {
            socketService.offConversationUpdated(handleConversationUpdate);
        };
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const timer = setTimeout(() => {
                searchUsersForChat();
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/chat/conversations`, {
                headers: { Authorization: token }
            });

            const fetchedConversations = response.data.conversations || [];
            setConversations(fetchedConversations);

            const requestedConversationId = searchParams.get('conversationId');
            if (requestedConversationId) {
                const requestedConversation = fetchedConversations.find(
                    conv => conv._id === requestedConversationId
                );

                if (requestedConversation) {
                    setSelectedConversation(requestedConversation);
                    setShowMobileChat(true);
                    localStorage.setItem('lastSelectedConversation', requestedConversation._id);
                    setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        next.delete('conversationId');
                        return next;
                    }, { replace: true });
                    return;
                }
            }

            const globalConversation = fetchedConversations.find(
                conv => conv.conversationType === 'global'
            );

            // Restore last selected conversation from localStorage
            const savedConversationId = localStorage.getItem('lastSelectedConversation');
            if (savedConversationId && fetchedConversations.length > 0) {
                const savedConv = fetchedConversations.find(conv => conv._id === savedConversationId);
                if (savedConv) {
                    setSelectedConversation(savedConv);
                    return;
                }
            }

            if (globalConversation) {
                setSelectedConversation(globalConversation);
                localStorage.setItem('lastSelectedConversation', globalConversation._id);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const searchUsersForChat = async () => {
        setSearching(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${API_BASE_URL}/api/users/search/chat?search=${encodeURIComponent(searchQuery)}`,
                { headers: { Authorization: token } }
            );
            setSearchResults(response.data.users || []);
        } catch (err) {
            console.error('Error searching users:', err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleStartChat = async (user) => {
        try {
            const token = localStorage.getItem('authToken');

            // Prefer one-to-one conversation if already available.
            const existingOneToOneConv = conversations.find(conv =>
                conv.conversationType === 'one_to_one' &&
                conv.participants?.some(p => p._id === user._id)
            );

            if (existingOneToOneConv) {
                activateConversation(existingOneToOneConv);
                return;
            }

            // Fallback to any existing non-global chat with this user.
            const existingAnyConv = findConversationWithUser(conversations, user._id);
            if (existingAnyConv) {
                activateConversation(existingAnyConv);
                return;
            }

            // Create new conversation
            const response = await axios.post(
                `${API_BASE_URL}/api/chat/conversations`,
                { participantId: user._id },
                { headers: { Authorization: token } }
            );

            const createdConversation = response?.data?.conversation;
            if (createdConversation?._id) {
                const refreshResponse = await axios.get(`${API_BASE_URL}/api/chat/conversations`, {
                    headers: { Authorization: token }
                });
                const refreshedConversations = refreshResponse.data.conversations || [];
                setConversations(refreshedConversations);

                const exactConversation = refreshedConversations.find(
                    conv => conv._id === createdConversation._id
                );

                activateConversation(exactConversation || createdConversation);
                return;
            }

            // Safety net: refresh conversations and try to find one with this user.
            const refreshResponse = await axios.get(`${API_BASE_URL}/api/chat/conversations`, {
                headers: { Authorization: token }
            });
            const refreshedConversations = refreshResponse.data.conversations || [];
            setConversations(refreshedConversations);

            const fallbackConversation = findConversationWithUser(refreshedConversations, user._id);
            if (fallbackConversation) {
                activateConversation(fallbackConversation);
            }
        } catch (err) {
            console.error('Error starting chat:', err);

            // Final fallback: try to open any existing chat with this user.
            const fallbackConversation = findConversationWithUser(conversations, user._id);
            if (fallbackConversation) {
                activateConversation(fallbackConversation);
            }
        }
    };

    const handleSearchKeyDown = async (e) => {
        if (e.key === 'Enter' && searchResults.length > 0 && !searching) {
            e.preventDefault();
            await handleSearchResultClick(searchResults[0]);
        }
    };

    const handleConversationUpdate = ({ conversationId, lastMessage }) => {
        setConversations(prev => {
            const updated = prev.map(conv =>
                conv._id === conversationId
                    ? { ...conv, lastMessage, lastMessageAt: lastMessage.createdAt }
                    : conv
            );
            // Sort by last message time
            return updated.sort((a, b) =>
                new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
            );
        });
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setShowMobileChat(true);

        // Save selected conversation to localStorage
        localStorage.setItem('lastSelectedConversation', conversation._id);

        // Immediately clear unread count for this conversation in the list
        setConversations(prev => prev.map(conv =>
            conv._id === conversation._id
                ? { ...conv, unreadCount: 0 }
                : conv
        ));
    };

    const handleBackToList = () => {
        setShowMobileChat(false);
        setSelectedConversation(null);
    };

    // Sidebar resize handlers
    const handleMouseDown = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isResizing || !containerRef.current) return;

        // Get the container's left position to calculate relative mouse position
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;

        // Constrain width between 240px and 600px
        if (newWidth >= 240 && newWidth <= 600) {
            setSidebarWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
    };

    // Add global mouse listeners for resize
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
    }, [isResizing]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-transparent">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-transparent overflow-hidden" style={{ height: 'calc(100vh - 90px)' }}>
            {/* Fixed height container - aligned with navbar */}
            <div ref={containerRef} className="flex-1 flex overflow-hidden w-full max-w-7xl mx-auto glass-surface rounded-2xl shadow-xl shadow-emerald-900/10">
                {/* Conversations List Sidebar */}
                <div
                    className={`${showMobileChat ? 'hidden md:flex' : 'flex'} border-r border-emerald-100 dark:border-emerald-900/50 bg-white/70 dark:bg-emerald-950/35 flex-col relative overflow-hidden`}
                    style={{ width: `${sidebarWidth}px` }}
                >
                    {/* Sidebar Header */}
                    <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Messages</h2>

                        {/* Search */}
                        <div className="relative">
                            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowSearch(true)}
                                onKeyDown={handleSearchKeyDown}
                                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 dark:focus:border-green-500 transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setShowSearch(false);
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <HiOutlineX className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showSearch && searchQuery && (
                            <div className="absolute left-4 right-4 mt-2 glass-surface rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto border border-emerald-100/80 dark:border-emerald-900/50">
                                {searching ? (
                                    <div className="p-4 text-center">
                                        <div className="inline-block w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div>
                                        {searchResults.map((user) => (
                                            <button
                                                key={user._id}
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => handleSearchResultClick(user)}
                                                className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 text-left cursor-pointer"
                                                title={`Chat with ${user.name}`}
                                            >
                                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-green-700 dark:text-green-400 font-medium text-sm">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                        <ConversationsList
                            conversations={conversations}
                            selectedConversation={selectedConversation}
                            onSelectConversation={handleSelectConversation}
                        />
                    </div>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-green-500 dark:hover:bg-green-600 transition-colors group"
                        title="Drag to resize"
                    >
                        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-12 bg-gray-300 dark:bg-gray-600 group-hover:bg-green-500 dark:group-hover:bg-green-600 rounded-l transition-colors"></div>
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`flex-1 ${showMobileChat ? 'block' : 'hidden md:block'} bg-white/70 dark:bg-emerald-950/35`}>
                    {selectedConversation ? (
                        <ChatWindow
                            conversation={selectedConversation}
                            onBack={handleBackToList}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-transparent">
                            <div className="text-center">
                                <HiOutlineChat className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Select a conversation to start messaging
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
