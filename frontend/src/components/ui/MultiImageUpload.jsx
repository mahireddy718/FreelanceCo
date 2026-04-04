import { useState } from 'react';
import { HiOutlinePhotograph, HiOutlineX } from 'react-icons/hi';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function MultiImageUpload({ values = [], onChange, maxImages = 5 }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Check if adding files would exceed max
        if (values.length + files.length > maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }

        setError('');
        setUploading(true);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('images', file);
            });

            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/api/upload/project-images`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: token
                    }
                }
            );

            if (response.data.success) {
                onChange([...values, ...response.data.images]);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (index) => {
        const newValues = values.filter((_, i) => i !== index);
        onChange(newValues);
    };

    const canAddMore = values.length < maxImages;

    return (
        <div>
            <div className="grid grid-cols-3 gap-3">
                {/* Existing images */}
                {values.map((image, index) => (
                    <div key={index} className="relative group">
                        <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-900 text-red-600 dark:text-red-500 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/30 transition opacity-0 group-hover:opacity-100"
                        >
                            <HiOutlineX size={14} />
                        </button>
                    </div>
                ))}

                {/* Upload button */}
                {canAddMore && (
                    <label className="block w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={uploading}
                        />
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                            {uploading ? (
                                <>
                                    <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-green-600 dark:border-t-green-500 rounded-full animate-spin mb-1"></div>
                                    <p className="text-xs font-light">Uploading...</p>
                                </>
                            ) : (
                                <>
                                    <HiOutlinePhotograph size={24} className="mb-1" />
                                    <p className="text-xs font-light">Add Image</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{values.length}/{maxImages}</p>
                                </>
                            )}
                        </div>
                    </label>
                )}
            </div>
            {error && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-light">{error}</p>
            )}
        </div>
    );
}
