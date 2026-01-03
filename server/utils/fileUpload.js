const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.fieldname === 'avatar') {
    // Only allow images for avatars
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  } else if (file.fieldname === 'documents') {
    // Allow images and PDFs for documents
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed for documents'), false);
    }
  } else {
    cb(null, true);
  }
};

// Create multer upload middleware
exports.upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

// Upload single file to Cloudinary
exports.uploadToCloudinary = async (buffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'auto',
        folder: 'zipzo',
        ...options
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Upload multiple files to Cloudinary
exports.uploadMultipleToCloudinary = async (files, options = {}) => {
  try {
    const uploadPromises = files.map(file => 
      this.uploadToCloudinary(file.buffer, {
        ...options,
        public_id: `${options.folder || 'zipzo'}/${Date.now()}_${file.originalname}`
      })
    );

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple file upload error:', error);
    throw error;
  }
};

// Delete file from Cloudinary
exports.deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Get file info from Cloudinary
exports.getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary file info error:', error);
    throw error;
  }
};

// Generate signed URL for secure uploads
exports.generateSignedUrl = (options = {}) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      folder: 'zipzo',
      ...options
    };

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

    return {
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      ...params
    };
  } catch (error) {
    console.error('Signed URL generation error:', error);
    throw error;
  }
};

// Validate file type
exports.validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.mimetype);
};

// Validate file size
exports.validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

// Generate unique filename
exports.generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
};

// Compress image before upload
exports.compressImage = async (buffer, options = {}) => {
  try {
    const defaultOptions = {
      quality: 80,
      format: 'jpg',
      width: 800,
      height: 600,
      crop: 'limit',
      ...options
    };

    return await this.uploadToCloudinary(buffer, defaultOptions);
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
};

// Create thumbnail
exports.createThumbnail = async (buffer, options = {}) => {
  try {
    const thumbnailOptions = {
      width: 150,
      height: 150,
      crop: 'fill',
      quality: 70,
      format: 'jpg',
      ...options
    };

    return await this.uploadToCloudinary(buffer, thumbnailOptions);
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    throw error;
  }
};