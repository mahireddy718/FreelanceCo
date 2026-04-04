const UserModel = require('../Models/User');
const bcrypt = require('bcrypt');

// Get all user settings
const getSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        res.status(200).json({
            success: true,
            settings: {
                profile: {
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    bio: user.bio,
                    location: user.location,
                    timezone: user.timezone,
                    avatar: user.avatar,
                    role: user.role
                },
                skills: {
                    primarySkills: user.primarySkills,
                    secondarySkills: user.secondarySkills,
                    experienceLevel: user.experienceLevel,
                    hourlyCharges: user.hourlyCharges,
                    portfolioLinks: user.portfolioLinks
                },
                notifications: user.notificationSettings,
                payment: {
                    withdrawalMethods: user.withdrawalMethods,
                    paymentMethods: user.paymentMethods
                },
                privacy: user.privacySettings
            }
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Update profile information
const updateProfileInfo = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, username, bio, location, timezone, avatar, role } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (location !== undefined) updateData.location = location;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (role !== undefined) updateData.role = role;

        // Handle username update with validation
        if (username !== undefined) {
            // Validate username format
            if (!/^[a-z0-9_-]+$/.test(username)) {
                return res.status(400).json({
                    message: 'Username can only contain lowercase letters, numbers, hyphens, and underscores',
                    success: false
                });
            }

            // Validate username length
            if (username.length < 3 || username.length > 20) {
                return res.status(400).json({
                    message: 'Username must be between 3 and 20 characters',
                    success: false
                });
            }

            // Check if username is already taken by another user
            const existingUser = await UserModel.findOne({
                username: username.toLowerCase(),
                _id: { $ne: userId }
            });

            if (existingUser) {
                return res.status(400).json({
                    message: 'Username is already taken',
                    success: false
                });
            }

            updateData.username = username.toLowerCase();
        }

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
        if (err.code === 11000) {
            return res.status(400).json({
                message: 'Username already taken',
                success: false
            });
        }
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Update skills and professional details
const updateSkills = async (req, res) => {
    try {
        const userId = req.user._id;
        const { primarySkills, secondarySkills, experienceLevel, hourlyCharges, portfolioLinks } = req.body;

        const updateData = {};
        if (primarySkills !== undefined) updateData.primarySkills = primarySkills;
        if (secondarySkills !== undefined) updateData.secondarySkills = secondarySkills;
        if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
        if (hourlyCharges !== undefined) updateData.hourlyCharges = hourlyCharges;
        if (portfolioLinks !== undefined) updateData.portfolioLinks = portfolioLinks;

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
            message: 'Skills updated successfully',
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

// Change email (requires current password)
const changeEmail = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newEmail } = req.body;

        if (!currentPassword || !newEmail) {
            return res.status(400).json({
                message: 'Current password and new email are required',
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

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Incorrect password',
                success: false
            });
        }

        // Check if email already exists
        const emailExists = await UserModel.findOne({ email: newEmail, _id: { $ne: userId } });
        if (emailExists) {
            return res.status(400).json({
                message: 'Email already in use',
                success: false
            });
        }

        user.email = newEmail;
        await user.save();

        res.status(200).json({
            message: 'Email updated successfully',
            success: true
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required',
                success: false
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters long',
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

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Incorrect current password',
                success: false
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: 'Password changed successfully',
            success: true
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Update notification settings
const updateNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { inApp, projectUpdates } = req.body;

        const updateData = {};
        if (inApp !== undefined) updateData['notificationSettings.inApp'] = inApp;
        if (projectUpdates !== undefined) updateData['notificationSettings.projectUpdates'] = projectUpdates;

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
            message: 'Notification settings updated successfully',
            success: true,
            notifications: user.notificationSettings
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Update privacy settings
const updatePrivacySettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { isPublic, whoCanMessage, showWorkHistory } = req.body;

        const updateData = {};
        if (isPublic !== undefined) updateData['privacySettings.isPublic'] = isPublic;
        if (whoCanMessage !== undefined) updateData['privacySettings.whoCanMessage'] = whoCanMessage;
        if (showWorkHistory !== undefined) updateData['privacySettings.showWorkHistory'] = showWorkHistory;

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
            message: 'Privacy settings updated successfully',
            success: true,
            privacy: user.privacySettings
        });
    } catch (err) {
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

module.exports = {
    getSettings,
    updateProfileInfo,
    updateSkills,
    changeEmail,
    changePassword,
    updateNotifications,
    updatePrivacySettings
};
