const multer = require('multer');
const path = require('path');

// Store files in memory buffer so they can be uploaded directly to S3 without writing temp files to disk
const storage = multer.memoryStorage();

// Allowed MIME types and extensions for images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Validate extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(`Unsupported file extension: ${ext}. Only JPG, PNG, and WebP images are allowed.`),
      false
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(`Unsupported file type: ${file.mimetype}. Only JPG, PNG, and WebP images are allowed.`),
      false
    );
  }

  cb(null, true);
};

// Multer upload instance with 5MB limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

module.exports = upload;
