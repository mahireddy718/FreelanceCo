import { HiOutlineChat } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

export default function ConversationsList({ conversations, selectedConversation, onSelectConversation }) {
    const { user } = useAuth();

    const formatTime = (date) => {
        if (!date) return '';

        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return messageDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <HiOutlineChat className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Search for freelancers to start chatting</p>
                </div>
            </div>
        );
    }

    return (
        <div className="divide-y divide-emerald-100/70 dark:divide-emerald-900/50">
            {conversations.map((conversation) => {
                const isGlobal = conversation.conversationType === 'global';
                // Get the other participant (not the current user)
                const otherParticipant = conversation.participants.find(p => p._id !== user?.userId) || conversation.participants[0];
                const isSelected = selectedConversation?._id === conversation._id;
                const hasUnread = conversation.unreadCount > 0;
                const displayName = isGlobal
                    ? (conversation.name || 'Global Chat')
                    : `${otherParticipant?.name?.split(' ')[0] || 'User'}${conversation.projectId?.title ? ` - ${conversation.projectId.title}` : ''}`;
                const messagePreview = conversation.lastMessage?.content || (isGlobal ? 'Say hello to everyone...' : 'Start chatting...');

                return (
                    <button
                        key={conversation._id}
                        onClick={() => onSelectConversation(conversation)}
                        className={`w-full px-4 py-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/25 transition text-left ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/30 border-l-2 border-emerald-600' : ''
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            {/* Avatar */}
                            {isGlobal ? (
                                <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                    <span className="text-green-700 dark:text-green-400 font-semibold text-sm">G</span>
                                </div>
                            ) : otherParticipant?.avatar ? (
                                <img
                                    src={otherParticipant.avatar}
                                    alt={otherParticipant.name}
                                    referrerPolicy="no-referrer"
                                    className="w-11 h-11 rounded-full object-cover shrink-0"
                                />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                                        {otherParticipant?.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <h3 className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                        {displayName}
                                    </h3>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                                        {formatTime(conversation.lastMessageAt)}
                                    </span>
                                </div>

                                {/* Last Message */}
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-xs truncate ${hasUnread ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {messagePreview}
                                    </p>
                                    {hasUnread && (
                                        <span className="shrink-0 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                                            {conversation.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
