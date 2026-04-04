const cloudinary = require('cloudinary').v2;

// Configure Cloudinary - dotenv is already loaded in index.js
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log config status (remove in production)
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ CLOUDINARY CREDENTIALS MISSING! Check your .env file.');
    console.error('Required variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Cloudinary folder name (e.g., 'avatars', 'thumbnails')
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<string>} - Cloudinary URL of uploaded image
 */
const uploadToCloudinary = async (buffer, folder = 'prolance', publicId = null) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: folder,
            resource_type: 'image',
            transformation: [
                { quality: 'auto' }, // Automatic quality optimization
                { fetch_format: 'auto' } // Automatic format selection (WebP when supported)
            ]
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );

        uploadStream.end(buffer);
    });
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Cloudinary URL to delete
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (imageUrl) => {
    try {
        // Extract public_id from Cloudinary URL
        const urlParts = imageUrl.split('/');
        const publicIdWithExt = urlParts.slice(-2).join('/'); // folder/filename.ext
        const publicId = publicIdWithExt.split('.')[0]; // Remove extension

        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Don't throw error - deletion failure shouldn't break the flow
    }
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary
};
