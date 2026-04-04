const UserModel = require('../Models/User');

const getStats = async (req, res) => {
    try {
        // Get total user count
        const totalUsers = await UserModel.countDocuments();

        // Get count by role
        const clientCount = await UserModel.countDocuments({ role: 'client' });
        const freelancerCount = await UserModel.countDocuments({ role: 'freelancer' });
        const bothCount = await UserModel.countDocuments({ role: 'both' });

        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUsers = await UserModel.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                clientCount,
                freelancerCount,
                bothCount,
                recentUsers
            }
        });
    } catch (err) {
        console.error('Error fetching admin stats:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            users
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        await UserModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
};

const banUser = async (req, res) => {
    try {
        const { id } = req.params;

        await UserModel.findByIdAndUpdate(id, { isBanned: true });

        res.status(200).json({
            success: true,
            message: 'User banned successfully'
        });
    } catch (err) {
        console.error('Error banning user:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to ban user'
        });
    }
};

const unbanUser = async (req, res) => {
    try {
        const { id } = req.params;

        await UserModel.findByIdAndUpdate(id, { isBanned: false });

        res.status(200).json({
            success: true,
            message: 'User unbanned successfully'
        });
    } catch (err) {
        console.error('Error unbanning user:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to unban user'
        });
    }
};

const getUserGrowth = async (req, res) => {
    try {
        const { days = 7 } = req.query; // Default to 7 days
        const numDays = parseInt(days);

        const growthData = [];
        const today = new Date();

        for (let i = numDays - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await UserModel.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });

            growthData.push({
                date: date.toISOString().split('T')[0],
                count
            });
        }

        res.status(200).json({
            success: true,
            data: growthData
        });
    } catch (err) {
        console.error('Error fetching user growth:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user growth data'
        });
    }
};

// Get freelancers with filtering
const getFreelancers = async (req, res) => {
    try {
        const { verified, experienceLevel, banned } = req.query;

        let query = {
            $or: [
                { role: 'freelancer' },
                { role: 'both' }
            ]
        };

        // Add filters if provided
        if (verified !== undefined) {
            query.isVerified = verified === 'true';
        }
        if (experienceLevel) {
            query.experienceLevel = experienceLevel;
        }
        if (banned !== undefined) {
            query.isBanned = banned === 'true';
        }

        const freelancers = await UserModel.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            freelancers
        });
    } catch (err) {
        console.error('Error fetching freelancers:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch freelancers'
        });
    }
};

// Get freelancer statistics
const getFreelancerStats = async (req, res) => {
    try {
        const freelancerQuery = {
            $or: [
                { role: 'freelancer' },
                { role: 'both' }
            ]
        };

        const totalFreelancers = await UserModel.countDocuments(freelancerQuery);
        const verifiedFreelancers = await UserModel.countDocuments({
            ...freelancerQuery,
            isVerified: true
        });
        const bannedFreelancers = await UserModel.countDocuments({
            ...freelancerQuery,
            isBanned: true
        });

        // Get experience level distribution
        const beginnerCount = await UserModel.countDocuments({
            ...freelancerQuery,
            experienceLevel: 'beginner'
        });
        const intermediateCount = await UserModel.countDocuments({
            ...freelancerQuery,
            experienceLevel: 'intermediate'
        });
        const expertCount = await UserModel.countDocuments({
            ...freelancerQuery,
            experienceLevel: 'expert'
        });

        // Get top skills (aggregate all skills and count)
        const skillsAggregation = await UserModel.aggregate([
            { $match: freelancerQuery },
            { $unwind: '$skills' },
            { $group: { _id: '$skills', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalFreelancers,
                verifiedFreelancers,
                bannedFreelancers,
                experienceDistribution: {
                    beginner: beginnerCount,
                    intermediate: intermediateCount,
                    expert: expertCount
                },
                topSkills: skillsAggregation.map(s => ({ skill: s._id, count: s.count }))
            }
        });
    } catch (err) {
        console.error('Error fetching freelancer stats:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch freelancer statistics'
        });
    }
};

// Verify a freelancer
const verifyFreelancer = async (req, res) => {
    try {
        const { id } = req.params;

        await UserModel.findByIdAndUpdate(id, { isVerified: true });

        res.status(200).json({
            success: true,
            message: 'Freelancer verified successfully'
        });
    } catch (err) {
        console.error('Error verifying freelancer:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to verify freelancer'
        });
    }
};

// Unverify a freelancer
const unverifyFreelancer = async (req, res) => {
    try {
        const { id } = req.params;

        await UserModel.findByIdAndUpdate(id, { isVerified: false });

        res.status(200).json({
            success: true,
            message: 'Freelancer unverified successfully'
        });
    } catch (err) {
        console.error('Error unverifying freelancer:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to unverify freelancer'
        });
    }
};

// Get detailed freelancer information
const getFreelancerDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const freelancer = await UserModel.findById(id).select('-password');

        if (!freelancer) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer not found'
            });
        }

        res.status(200).json({
            success: true,
            freelancer
        });
    } catch (err) {
        console.error('Error fetching freelancer details:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch freelancer details'
        });
    }
};

module.exports = {
    getStats,
    getAllUsers,
    deleteUser,
    banUser,
    unbanUser,
    getUserGrowth,
    getFreelancers,
    getFreelancerStats,
    verifyFreelancer,
    unverifyFreelancer,
    getFreelancerDetails
};
