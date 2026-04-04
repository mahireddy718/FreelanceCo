import { useState, useRef, useCallback } from 'react';
import { HiOutlinePhotograph, HiOutlineX, HiCheck, HiOutlineUpload, HiOutlineCloudUpload } from 'react-icons/hi';
import axios from 'axios';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ImageUpload({ value, onChange, label = 'Upload Image' }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [showCrop, setShowCrop] = useState(false);
    const [imageSrc, setImageSrc] = useState('');
    const [crop, setCrop] = useState({ unit: '%', width: 90, aspect: 1 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const imgRef = useRef(null);
    const fileRef = useRef(null);

    const processFile = (file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        setError('');
        fileRef.current = file;

        // Read the file as data URL for cropping
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result?.toString() || '');
            setShowCrop(true);
        });
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const onImageLoad = useCallback((e) => {
        const { width, height } = e.currentTarget;

        // Calculate square crop size based on the smaller dimension
        const minDimension = Math.min(width, height);
        const cropSize = minDimension * 0.9; // 90% of the smaller dimension

        // Convert to percentage for both width and height
        const widthPercent = (cropSize / width) * 100;
        const heightPercent = (cropSize / height) * 100;

        const newCrop = {
            unit: '%',
            width: widthPercent,
            height: heightPercent,
            x: (100 - widthPercent) / 2,
            y: (100 - heightPercent) / 2,
            aspect: 1
        };

        setCrop(newCrop);
    }, []);

    const getCroppedImage = async () => {
        if (!imgRef.current || !completedCrop) {
            return null;
        }

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Set canvas size to desired output size (1:1 Instagram square)
        const outputWidth = 1080;
        const outputHeight = 1080; // 1:1 square ratio

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            outputWidth,
            outputHeight
        );

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    resolve(blob);
                },
                'image/jpeg',
                0.95
            );
        });
    };

    const handleCropComplete = async () => {
        try {
            setUploading(true);
            const croppedBlob = await getCroppedImage();

            if (!croppedBlob) {
                setError('Failed to crop image');
                return;
            }

            const formData = new FormData();
            formData.append('thumbnail', croppedBlob, 'thumbnail.jpg');

            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/api/upload/project-thumbnail`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: token
                    }
                }
            );

            if (response.data.success) {
                onChange(response.data.thumbnail);
                setShowCrop(false);
                setImageSrc('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleCancelCrop = () => {
        setShowCrop(false);
        setImageSrc('');
        setCrop({ unit: '%', width: 90, aspect: 1 });
        setCompletedCrop(null);
    };

    const handleRemove = () => {
        onChange('');
        setError('');
    };

    if (showCrop) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-light text-gray-700 dark:text-gray-200">Crop Image</h3>
                            <button
                                type="button"
                                onClick={handleCancelCrop}
                                disabled={uploading}
                                className="dark:text-gray-200 dark:hover:text-gray-400 p-2 text-gray-400 hover:text-gray-600 transition"
                            >
                                <HiOutlineX size={20} />
                            </button>
                        </div>

                        {/* Crop Area */}
                        <div className="mb-6">
                            <p className="text-sm dark:text-gray-200 text-gray-600 font-light mb-3">
                                Adjust the crop area (Instagram square format 1:1)
                            </p>
                            <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    locked={true}
                                    className="max-w-full"
                                >
                                    <img
                                        ref={imgRef}
                                        src={imageSrc}
                                        alt="Crop preview"
                                        onLoad={onImageLoad}
                                        style={{ maxHeight: '60vh', width: 'auto' }}
                                        className="max-w-full h-auto"
                                    />
                                </ReactCrop>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCancelCrop}
                                disabled={uploading}
                                className="px-6 py-2.5 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-light"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCropComplete}
                                disabled={uploading || !completedCrop}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-light"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <HiCheck size={16} />
                                        Apply & Upload
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <p className="text-xs text-red-500 mt-4 font-light">{error}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {value ? (
                <div className="relative group">
                    <img
                        src={value}
                        alt="Upload"
                        className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-900 text-red-600 dark:text-red-500 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/30 transition opacity-0 group-hover:opacity-100"
                    >
                        <HiOutlineX size={16} />
                    </button>
                </div>
            ) : (
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`relative transition-all ${isDragging
                        ? 'border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.02]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                >
                    <label className="block w-full h-48 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl cursor-pointer transition-all">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="h-full flex flex-col items-center justify-center p-6">
                            {isDragging ? (
                                <>
                                    <HiOutlineCloudUpload size={48} className="text-green-600 dark:text-green-500 mb-3 animate-bounce" />
                                    <p className="text-sm font-medium text-green-600 dark:text-green-500">Drop your image here</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                        <HiOutlinePhotograph size={32} className="text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">or drag and drop</p>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
                                        <HiOutlineUpload size={14} />
                                        PNG, JPG up to 5MB
                                    </div>
                                </>
                            )}
                        </div>
                    </label>
                </div>
            )}
            {error && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-light">{error}</p>
            )}
        </div>
    );
}
