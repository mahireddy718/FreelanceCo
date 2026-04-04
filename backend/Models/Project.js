const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Programming & Tech',
            'Graphics & Design',
            'Digital Marketing',
            'Writing & Translation',
            'Video & Animation',
            'AI Services',
            'Music & Audio',
            'Business',
            'Consulting',
            'Other'
        ]
    },
    budget: {
        min: {
            type: Number,
            required: true
        },
        max: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ['fixed', 'hourly'],
            default: 'fixed'
        }
    },
    duration: {
        type: String,
        required: true
    },
    skillsRequired: {
        type: [String],
        default: []
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'completed', 'closed', 'cancelled'],
        default: 'open'
    },
    proposalCount: {
        type: Number,
        default: 0
    },
    acceptedProposalId: {
        type: Schema.Types.ObjectId,
        ref: 'proposals',
        default: null
    },
    assignedFreelancerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    attachments: {
        type: [{
            name: String,
            url: String
        }],
        default: []
    },
    deadline: {
        type: Date,
        default: null
    },
    tags: {
        type: [String],
        default: []
    },
    viewCount: {
        type: Number,
        default: 0
    },
    viewedBy: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'users'
        }],
        default: []
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    thumbnail: {
        type: String,
        default: ''
    },
    images: {
        type: [String],
        default: []
    },
    // Workspace fields for freelancer project management
    workStatus: {
        type: String,
        enum: ['planning', 'designing', 'development', 'testing', 'review', 'completed'],
        default: 'planning'
    },
    phaseHistory: [{
        phase: {
            type: String,
            enum: ['planning', 'designing', 'development', 'testing', 'review', 'completed']
        },
        completedAt: {
            type: Date,
            default: Date.now
        }
    }],
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    milestones: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed'],
            default: 'pending'
        },
        dueDate: Date,
        completedAt: Date,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    deliverables: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        fileUrl: String,
        fileName: String,
        fileSize: Number,
        deliverableType: {
            type: String,
            enum: ['demo', 'final'],
            default: 'final'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    workNotes: [{
        note: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for search and filtering
ProjectSchema.index({ category: 1, status: 1 });
ProjectSchema.index({ clientId: 1 });
ProjectSchema.index({ createdAt: -1 });

const ProjectModel = mongoose.model('projects', ProjectSchema);
module.exports = ProjectModel;
