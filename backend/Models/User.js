const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PortfolioItemSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    imageUrl: String,
    link: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        validate: {
            validator: function (v) {
                // Only allow lowercase letters, numbers, hyphens, and underscores
                return /^[a-z0-9_-]+$/.test(v);
            },
            message: 'Username can only contain lowercase letters, numbers, hyphens, and underscores'
        }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['client', 'freelancer', 'both'],
        default: 'freelancer'
    },
    avatar: {
        type: String,
        default: ''
    },
    firebaseUid: {
        type: String,
        default: ''
    },
    photoURL: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    timezone: {
        type: String,
        default: ''
    },
    // Skills section
    primarySkills: {
        type: [String],
        default: []
    },
    secondarySkills: {
        type: [String],
        default: []
    },
    skills: {
        type: [String],
        default: []
    },
    experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'expert', ''],
        default: ''
    },
    hourlyCharges: {
        type: Number,
        default: 0
    },
    portfolioLinks: {
        type: [String],
        default: []
    },
    phone: {
        type: String,
        default: ''
    },
    portfolio: {
        type: [PortfolioItemSchema],
        default: []
    },
    // Notification settings
    notificationSettings: {
        inApp: {
            type: Boolean,
            default: true
        },
        projectUpdates: {
            type: Boolean,
            default: true
        }
    },
    // // Payment settings
    // withdrawalMethods: {
    //     type: [{
    //         type: String,
    //         method: String,
    //         details: String
    //     }],
    //     default: []
    // },
    paymentMethods: {
        type: [{
            type: String,
            method: String,
            details: String
        }],
        default: []
    },
    // Privacy settings
    privacySettings: {
        isPublic: {
            type: Boolean,
            default: true
        },
        whoCanMessage: {
            type: String,
            enum: ['everyone', 'connections', 'none'],
            default: 'everyone'
        },
        showWorkHistory: {
            type: Boolean,
            default: true
        }
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    completedProjects: {
        type: Number,
        default: 0
    },
    profileViews: {
        type: Number,
        default: 0
    },
    // resetOTP: {
    //     type: String,
    //     default: ''
    // },
    // resetOTPExpires: {
    //     type: Date,
    //     default: null
    // },
    // In-app notifications
    notifications: [{
        type: {
            type: String,
            enum: ['project_completed', 'project_accepted', 'review_requested', 'application_received', 'application_accepted', 'contract_proposed', 'contract_accepted', 'contract_rejected', 'message_received', 'payment_received', 'escrow_funded', 'escrow_released', 'escrow_payment_held', 'project_closed'],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'projects'
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'conversations'
        },
        read: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;