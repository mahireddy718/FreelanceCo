const UserModel = require('../Models/User');
const ProjectModel = require('../Models/Project');
const ContractModel = require('../Models/Contract');
const ConversationModel = require('../Models/Conversation');
const MessageModel = require('../Models/Message');
const ApplicationModel = require('../Models/Application');

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user._id; // From auth middleware
        const user = await UserModel.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get public user profile by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findById(id).select('-password -email -phone');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get public user profile by username
const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const viewerId = req.user?._id; // May be undefined for non-authenticated users

        const user = await UserModel.findOne({ username: username.toLowerCase() }).select('-password -email -phone');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Increment profile views if viewer is not the profile owner
        if (!viewerId || viewerId.toString() !== user._id.toString()) {
            await UserModel.findByIdAndUpdate(
                user._id,
                { $inc: { profileViews: 1 } }
            );
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            name,
            bio,
            skills,
            hourlyCharges,
            location,
            phone,
            avatar,
            role
        } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (skills) updateData.skills = skills;
        if (hourlyCharges !== undefined) updateData.hourlyCharges = hourlyCharges;
        if (location !== undefined) updateData.location = location;
        if (phone !== undefined) updateData.phone = phone;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (role) updateData.role = role;

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Add portfolio item
const addPortfolioItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { title, description, imageUrl, link } = req.body;

        if (!title) {
            return res.status(400).json({
                message: 'Title is required',
                success: false
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        user.portfolio.push({ title, description, imageUrl, link });
        await user.save();

        res.status(200).json({
            message: 'Portfolio item added successfully',
            success: true,
            portfolio: user.portfolio
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Remove portfolio item
const removePortfolioItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId } = req.params;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        user.portfolio = user.portfolio.filter(
            item => item._id.toString() !== itemId
        );
        await user.save();

        res.status(200).json({
            message: 'Portfolio item removed successfully',
            success: true,
            portfolio: user.portfolio
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Search freelancers
const searchFreelancers = async (req, res) => {
    try {
        const { skills, minRate, maxRate, search, excludeUserId } = req.query;

        let query = {
            $or: [
                { role: 'freelancer' },
                { role: 'both' }
            ],
            'privacySettings.isPublic': true  // Only show public profiles
        };

        // Exclude current user from results
        if (excludeUserId) {
            query._id = { $ne: excludeUserId };
        }

        // Add skills filter
        if (skills) {
            const skillsArray = skills.split(',').map(s => s.trim());
            query.skills = { $in: skillsArray };
        }

        // Add rate range filter
        if (minRate || maxRate) {
            query.hourlyCharges = {};
            if (minRate) query.hourlyCharges.$gte = Number(minRate);
            if (maxRate) query.hourlyCharges.$lte = Number(maxRate);
        }

        // Add text search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { bio: { $regex: search, $options: 'i' } }
            ];
        }

        const freelancers = await UserModel.find(query)
            .select('-password -email -phone')
            .sort({ rating: -1, totalReviews: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            freelancers,
            count: freelancers.length
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Search all users for one-to-one chat (authenticated)
const searchUsersForChat = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { search = '' } = req.query;

        const query = {
            _id: { $ne: userId },
            role: { $ne: 'admin' }
        };

        if (search && search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { username: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        const users = await UserModel.find(query)
            .select('name username avatar role')
            .sort({ name: 1 })
            .limit(20);

        res.status(200).json({
            success: true,
            users,
            count: users.length
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get active projects count for account deletion check
const getActiveProjectsCount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Count projects where user is client (any status except 'closed')
        const activeProjectsAsClient = await ProjectModel.countDocuments({
            clientId: userId,
            status: { $ne: 'closed' }
        });

        // Count projects where user is assigned as freelancer (any status except 'closed')
        const activeProjectsAsFreelancer = await ProjectModel.countDocuments({
            assignedFreelancerId: userId,
            status: { $ne: 'closed' }
        });

        const totalActiveProjects = activeProjectsAsClient + activeProjectsAsFreelancer;

        res.status(200).json({
            success: true,
            activeProjectsCount: totalActiveProjects
        });
    } catch (err) {
        console.error('Error getting active projects count:', err);
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Delete user account and all associated data
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // First check if user has active projects
        const activeProjectsAsClient = await ProjectModel.countDocuments({
            clientId: userId,
            status: { $ne: 'closed' }
        });

        const activeProjectsAsFreelancer = await ProjectModel.countDocuments({
            assignedFreelancerId: userId,
            status: { $ne: 'closed' }
        });

        const totalActiveProjects = activeProjectsAsClient + activeProjectsAsFreelancer;

        if (totalActiveProjects > 0) {
            return res.status(400).json({
                message: `Cannot delete account. You have ${totalActiveProjects} active project(s). Please complete or cancel them first.`,
                success: false,
                activeProjectsCount: totalActiveProjects
            });
        }

        // Delete all user's projects (as client)
        await ProjectModel.deleteMany({ clientId: userId });

        // Delete all contracts (as both client and freelancer)
        await ContractModel.deleteMany({
            $or: [
                { clientId: userId },
                { freelancerId: userId }
            ]
        });

        // Delete all conversations where user is a participant
        const conversations = await ConversationModel.find({
            participants: userId
        });
        const conversationIds = conversations.map(conv => conv._id);

        // Delete all messages in those conversations
        await MessageModel.deleteMany({
            conversationId: { $in: conversationIds }
        });

        // Delete the conversations
        await ConversationModel.deleteMany({
            participants: userId
        });

        // Delete all applications (as freelancer)
        await ApplicationModel.deleteMany({ freelancerId: userId });

        // Finally, delete the user
        await UserModel.findByIdAndDelete(userId);

        res.status(200).json({
            message: 'Account deleted successfully',
            success: true
        });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).json({
            message: 'Failed to delete account. Please try again.',
            success: false
        });
    }
};

module.exports = {
    getProfile,
    getUserById,
    getUserByUsername,
    updateProfile,
    addPortfolioItem,
    removePortfolioItem,
    searchFreelancers,
    searchUsersForChat,
    getActiveProjectsCount,
    deleteAccount
};
