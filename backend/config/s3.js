const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_BUCKET_NAME || 'lost-and-found-uploads-bucket';
const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true';

// AWS SDK v3 Client
// If AWS_ACCESS_KEY_ID is not provided, the SDK uses the EC2 IAM Instance Profile / environment credentials
const s3Config = { region };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const s3Client = new S3Client(s3Config);

/**
 * Upload a file to Amazon S3 (or local disk fallback)
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} S3 object key
 */
async function uploadToS3(file) {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const uniqueKey = `items/${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;

  // If local storage mode is requested for offline / lab testing without AWS
  if (useLocalStorage) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFileName = uniqueKey.replace('items/', '');
    const localFilePath = path.join(uploadDir, localFileName);
    fs.writeFileSync(localFilePath, file.buffer);
    return uniqueKey;
  }

  // Upload to Amazon S3
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueKey,
    Body: file.buffer,
    ContentType: file.mimetype
  });

  await s3Client.send(command);
  return uniqueKey;
}

/**
 * Generate a short-lived presigned GET URL for secure viewing of private S3 objects
 * @param {string} key - S3 object key
 * @param {number} expiresInSeconds - Lifetime in seconds (default 15 minutes / 900s)
 * @returns {Promise<string|null>} Presigned URL or local static URL
 */
async function getPresignedImageUrl(key, expiresInSeconds = 900) {
  if (!key) return null;

  // If local storage mode, return local file endpoint
  if (useLocalStorage) {
    const localFileName = key.replace('items/', '');
    return `/uploads/${localFileName}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    // Generates a time-limited signed URL using AWS SDK v3
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    console.error('Error generating S3 presigned URL for key:', key, error.message);
    return null;
  }
}

/**
 * Delete an object from Amazon S3
 * @param {string} key - S3 object key
 */
async function deleteFromS3(key) {
  if (!key) return;

  if (useLocalStorage) {
    const localFileName = key.replace('items/', '');
    const localFilePath = path.join(__dirname, '..', 'uploads', localFileName);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.warn('Failed to delete local file:', err.message);
      }
    }
    return;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting object from S3:', key, error.message);
  }
}

module.exports = {
  s3Client,
  bucketName,
  uploadToS3,
  getPresignedImageUrl,
  deleteFromS3
};
