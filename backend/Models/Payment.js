const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    // Razorpay identifiers
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    razorpaySignature: {
        type: String,
        default: null
    },

    // Transaction details
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['created', 'authorized', 'captured', 'refunded', 'failed', 'pending'],
        default: 'created'
    },

    // Escrow tracking
    escrowStatus: {
        type: String,
        enum: ['held', 'released', 'refunded'],
        default: 'released' // Default to 'released' for backward compatibility with existing payments
    },
    releasedAt: {
        type: Date,
        default: null
    },
    releasedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },

    // Project and user references
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'projects',
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    contractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'contracts',
        default: null
    },

    // Payment metadata
    paymentMethod: {
        type: String,
        default: null
    },
    bank: {
        type: String,
        default: null
    },
    wallet: {
        type: String,
        default: null
    },
    vpa: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    contact: {
        type: String,
        default: null
    },

    // Verification
    verified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date,
        default: null
    },

    // Razorpay webhook data
    webhookData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    // Receipt and notes
    receipt: {
        type: String,
        default: null
    },
    notes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Error tracking
    errorCode: {
        type: String,
        default: null
    },
    errorDescription: {
        type: String,
        default: null
    },
    errorSource: {
        type: String,
        default: null
    },
    errorStep: {
        type: String,
        default: null
    },
    errorReason: {
        type: String,
        default: null
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    capturedAt: {
        type: Date,
        default: null
    },
    refundedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
PaymentSchema.index({ projectId: 1 });
PaymentSchema.index({ clientId: 1 });
PaymentSchema.index({ freelancerId: 1 });
PaymentSchema.index({ razorpayPaymentId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('payments', PaymentSchema);
