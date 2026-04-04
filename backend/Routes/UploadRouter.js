const express = require('express');
const router = express.Router();
const multer = require('multer');
const ensureAuthenticated = require('../Middlewares/Auth');
const UserModel = require('../Models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Upload profile photo
router.post('/upload', ensureAuthenticated, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'No file uploaded',
                success: false
            });
        }

        const userId = req.user._id;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Delete old avatar from Cloudinary if it exists
        if (user.avatar && user.avatar.includes('cloudinary.com')) {
            await deleteFromCloudinary(user.avatar);
        }

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(
            req.file.buffer,
            'prolance/avatars',
            `avatar_${userId}`
        );

        // Update user's avatar with Cloudinary URL
        user.avatar = imageUrl;
        await user.save();

        res.status(200).json({
            message: 'Profile photo uploaded successfully',
            success: true,
            avatar: imageUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            message: error.message || 'Failed to upload photo',
            success: false
        });
    }
});

// Delete profile photo
router.delete('/photo', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Delete from Cloudinary if it exists
        if (user.avatar && user.avatar.includes('cloudinary.com')) {
            await deleteFromCloudinary(user.avatar);
        }

        // Clear avatar from database
        user.avatar = '';
        await user.save();

        res.status(200).json({
            message: 'Profile photo removed successfully',
            success: true
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            message: 'Failed to remove photo',
            success: false
        });
    }
});

// Upload project thumbnail
router.post('/project-thumbnail', ensureAuthenticated, upload.single('thumbnail'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'No file uploaded',
                success: false
            });
        }

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(
            req.file.buffer,
            'prolance/thumbnails'
        );

        res.status(200).json({
            message: 'Thumbnail uploaded successfully',
            success: true,
            thumbnail: imageUrl
        });
    } catch (error) {
        console.error('Thumbnail upload error:', error);
        res.status(500).json({
            message: error.message || 'Failed to upload thumbnail',
            success: false
        });
    }
});

// Upload project images (multiple)
router.post('/project-images', ensureAuthenticated, upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: 'No files uploaded',
                success: false
            });
        }

        // Upload each image to Cloudinary
        const uploadPromises = req.files.map(file =>
            uploadToCloudinary(file.buffer, 'prolance/project-images')
        );

        const imageUrls = await Promise.all(uploadPromises);

        res.status(200).json({
            message: 'Images uploaded successfully',
            success: true,
            images: imageUrls
        });
    } catch (error) {
        console.error('Images upload error:', error);
        res.status(500).json({
            message: error.message || 'Failed to upload images',
            success: false
        });
    }
});

module.exports = router;
