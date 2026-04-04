const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApplicationSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'projects',
        required: true
    },
    freelancerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    coverLetter: {
        type: String,
        required: true,
        minlength: 50,
        maxlength: 2000
    },
    proposedBudget: {
        min: {
            type: Number,
            required: true
        },
        max: {
            type: Number,
            required: true
        }
    },
    proposedDuration: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
        default: 'pending'
    },
    clientNotes: {
        type: String,
        default: ''
    },
    // AI Scoring Fields
    aiScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    aiAnalysis: {
        relevance: { type: Number, min: 0, max: 100 },
        professionalism: { type: Number, min: 0, max: 100 },
        clarity: { type: Number, min: 0, max: 100 },
        experience: { type: Number, min: 0, max: 100 },
        summary: { type: String }
    },
    scoredAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
ApplicationSchema.index({ projectId: 1, createdAt: -1 });
ApplicationSchema.index({ freelancerId: 1, createdAt: -1 });
ApplicationSchema.index({ status: 1 });

// Ensure a freelancer can only apply once per project (unique already creates index)
ApplicationSchema.index({ projectId: 1, freelancerId: 1 }, { unique: true });

const ApplicationModel = mongoose.model('applications', ApplicationSchema);
module.exports = ApplicationModel;
