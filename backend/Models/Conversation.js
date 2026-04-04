const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
    conversationType: {
        type: String,
        enum: ['direct', 'global', 'one_to_one'],
        default: 'direct'
    },
    name: {
        type: String,
        trim: true,
        default: null
    },
    globalKey: {
        type: String,
        default: null
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }],
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'projects',
        required: function () {
            return this.conversationType === 'direct';
        }
    },
    applicationId: {
        type: Schema.Types.ObjectId,
        ref: 'applications',
        required: function () {
            return this.conversationType === 'direct';
        }
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    lastMessage: {
        content: String,
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        createdAt: Date
    }
}, {
    timestamps: true
});

// Validate exactly 2 participants
ConversationSchema.pre('save', function (next) {
    if ((this.conversationType === 'direct' || this.conversationType === 'one_to_one') && this.participants.length !== 2) {
        next(new Error('A conversation must have exactly 2 participants'));
        return;
    }

    if (this.conversationType !== 'direct') {
        this.projectId = undefined;
        this.applicationId = undefined;
    }

    if (this.conversationType === 'global' && !this.globalKey) {
        this.globalKey = 'GLOBAL_CHAT';
    }

    next();
});

// Index for faster queries
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
ConversationSchema.index({ projectId: 1 });

// Ensure unique conversation per application (this also creates an index)
ConversationSchema.index(
    { applicationId: 1 },
    { unique: true, partialFilterExpression: { conversationType: 'direct' } }
);

// Keep only one global conversation per key
ConversationSchema.index({ globalKey: 1 }, { unique: true, sparse: true });

const ConversationModel = mongoose.model('conversations', ConversationSchema);
module.exports = ConversationModel;
