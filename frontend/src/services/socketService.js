import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect(token) {
        if (this.socket && this.isConnected) {
            return this.socket;
        }

        this.socket = io(API_BASE_URL, {
            auth: {
                token
            },
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.isConnected = false;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    joinConversation(conversationId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join-conversation', conversationId);
        }
    }

    leaveConversation(conversationId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave-conversation', conversationId);
        }
    }

    sendMessage(conversationId, content) {
        if (this.socket && this.isConnected) {
            this.socket.emit('send-message', { conversationId, content });
        }
    }

    emitTyping(conversationId, isTyping) {
        if (this.socket && this.isConnected) {
            this.socket.emit('typing', { conversationId, isTyping });
        }
    }

    markAsRead(conversationId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('mark-read', { conversationId });
        }
    }

    onNewMessage(callback) {
        if (this.socket) {
            this.socket.on('new-message', callback);
        }
    }

    onConversationUpdated(callback) {
        if (this.socket) {
            this.socket.on('conversation-updated', callback);
        }
    }

    onUserTyping(callback) {
        if (this.socket) {
            this.socket.on('user-typing', callback);
        }
    }

    onMessagesRead(callback) {
        if (this.socket) {
            this.socket.on('messages-read', callback);
        }
    }

    offNewMessage(callback) {
        if (this.socket) {
            this.socket.off('new-message', callback);
        }
    }

    offConversationUpdated(callback) {
        if (this.socket) {
            this.socket.off('conversation-updated', callback);
        }
    }

    offUserTyping(callback) {
        if (this.socket) {
            this.socket.off('user-typing', callback);
        }
    }

    offMessagesRead(callback) {
        if (this.socket) {
            this.socket.off('messages-read', callback);
        }
    }

    getSocket() {
        return this.socket;
    }

    isSocketConnected() {
        return this.isConnected;
    }

    // Contract event listeners
    onContractProposed(callback) {
        if (this.socket) {
            this.socket.on('contract-proposed', callback);
        }
    }

    onContractUpdated(callback) {
        if (this.socket) {
            this.socket.on('contract-updated', callback);
        }
    }

    offContractProposed(callback) {
        if (this.socket) {
            this.socket.off('contract-proposed', callback);
        }
    }

    offContractUpdated(callback) {
        if (this.socket) {
            this.socket.off('contract-updated', callback);
        }
    }

    // Generic event listeners
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
