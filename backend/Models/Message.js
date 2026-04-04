const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'conversations',
        required: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: false // Not required for system messages
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    messageType: {
        type: String,
        enum: ['user', 'system'],
        default: 'user'
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ read: 1 });

const MessageModel = mongoose.model('messages', MessageSchema);
module.exports = MessageModel;
