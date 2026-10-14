/**
 * Cloudinary Configuration & Uploader
 * ──────────────────────────────────
 * Provides cloud-hosted persistent storage for portfolio images and assets.
 * Compatible with Render's ephemeral filesystem.
 *
 * Supports configuration via:
 * 1. CLOUDINARY_URL (e.g. cloudinary://api_key:api_secret@cloud_name)
 *    OR
 * 2. Individual variables:
 *    - CLOUDINARY_CLOUD_NAME
 *    - CLOUDINARY_API_KEY
 *    - CLOUDINARY_API_SECRET
 */

const cloudinary = require('cloudinary').v2;

// Check if Cloudinary credentials are provided in environment
function isCloudinaryConfigured() {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
    return true;
  }
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Configure Cloudinary SDK if credentials exist
if (isCloudinaryConfigured()) {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config(); // auto-reads CLOUDINARY_URL
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  console.log('☁️  Cloudinary configured successfully for persistent image storage.');
} else {
  console.log('ℹ️  Cloudinary not configured. Defaulting to persistent MongoDB Atlas image storage.');
}

/**
 * Upload a binary buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - { folder, public_id, resource_type, filename }
 * @returns {Promise<Object>} { url, public_id, format, size }
 */
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error('Cloudinary is not configured. Missing credentials in environment.'));
    }

    const uploadOptions = {
      folder: options.folder || 'ansh_portfolio',
      resource_type: options.resource_type || 'auto',
      public_id: options.public_id,
      overwrite: true,
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
      });
    });

    stream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary
 * @param {string} publicId
 * @returns {Promise<Object>}
 */
async function deleteFromCloudinary(publicId) {
  if (!isCloudinaryConfigured() || !publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`⚠️ Cloudinary deletion error for ${publicId}:`, err.message);
    return null;
  }
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
