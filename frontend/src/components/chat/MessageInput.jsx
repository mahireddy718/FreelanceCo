import { useState, useRef } from 'react';
import { HiOutlinePaperAirplane, HiOutlinePaperClip } from 'react-icons/hi';
import socketService from '../../services/socketService';

export default function MessageInput({ conversationId }) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const typingTimeoutRef = useRef(null);
    const textareaRef = useRef(null);

    const handleTyping = (value) => {
        setMessage(value);

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }

        // Emit typing indicator
        socketService.emitTyping(conversationId, true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 1 second of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            socketService.emitTyping(conversationId, false);
        }, 1000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim() || sending) return;

        setSending(true);
        socketService.emitTyping(conversationId, false);

        try {
            socketService.sendMessage(conversationId, message.trim());
            setMessage('');

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="px-6 mt-4 p-2 ">
            <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => handleTyping(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 dark:focus:border-green-500 focus:outline-none resize-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        rows={1}
                        style={{
                            maxHeight: '120px',
                            overflow: 'auto'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-sm"
                    title="Send message"
                >
                    <HiOutlinePaperAirplane size={18} />
                </button>
            </div>
        </form>
    );
}
