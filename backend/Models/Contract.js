const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'projects',
        required: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'applications',
        required: true
    },
    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'conversations',
        required: true
    },
    contractDetails: {
        title: {
            type: String,
            required: true
        },
        scope: {
            type: String,
            required: true
        },
        deliverables: [{
            type: String
        }],
        finalAmount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'INR'
        },
        duration: {
            type: String,
            required: true
        },
        paymentTerms: {
            type: String,
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        milestones: [{
            title: String,
            description: String,
            dueDate: Date,
            payment: Number
        }]
    },
    paymentRequired: {
        type: Boolean,
        default: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'payments',
        default: null
    },
    // Escrow funding tracking
    escrowFunded: {
        type: Boolean,
        default: false
    },
    escrowPaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'payments',
        default: null
    },
    escrowFundedAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
    },
    proposedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date
    },
    clientNotes: {
        type: String
    }
}, {
    timestamps: true
});

// Index for faster queries
ContractSchema.index({ projectId: 1, status: 1 });
ContractSchema.index({ freelancerId: 1 });
ContractSchema.index({ clientId: 1 });
ContractSchema.index({ conversationId: 1 });

module.exports = mongoose.model('contracts', ContractSchema);
