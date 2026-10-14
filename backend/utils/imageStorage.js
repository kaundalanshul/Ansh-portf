/**
 * Image Storage & Cache Utility
 * ──────────────────────────────
 * Provides multi-tier reliable persistence for portfolio uploads:
 * 1. Tier 1 (CDN): Cloudinary (if configured with CLOUDINARY_URL or credentials)
 * 2. Tier 2 (Database): MongoDB Atlas binary buffer (survives Render restarts)
 * 3. Tier 3 (Local Cache): backend/uploads directory for fast disk access
 */

const fs = require('fs');
const path = require('path');
const Image = require('../models/Image');
const {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} = require('../config/cloudinary');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

/** Ensure uploads cache directory exists */
function ensureUploadsDir() {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('⚠️  Failed to create uploads directory:', err.message);
  }
}

/**
 * Save an image with reliable persistence
 * @param {Object} options - { filename, contentType, buffer }
 * @returns {Promise<Object>} { _id, url, filename, contentType, size }
 */
async function saveImage({ filename, contentType, buffer }) {
  ensureUploadsDir();

  let cloudinaryUrl = null;
  let cloudinaryPublicId = null;

  // 1. Try Cloudinary if credentials are provided in environment
  if (isCloudinaryConfigured()) {
    try {
      console.log(`☁️  Uploading "${filename}" to Cloudinary...`);
      const cResult = await uploadBufferToCloudinary(buffer, {
        filename,
        resource_type: contentType.includes('pdf') ? 'raw' : 'image',
      });
      cloudinaryUrl = cResult.url;
      cloudinaryPublicId = cResult.public_id;
      console.log(`✅ Uploaded to Cloudinary: ${cloudinaryUrl}`);
    } catch (cErr) {
      console.warn('⚠️  Cloudinary upload failed, falling back to MongoDB Atlas:', cErr.message);
    }
  }

  // 2. Persist metadata (and binary buffer if not on Cloudinary) to MongoDB
  const imageDocData = {
    filename: filename || 'upload.jpg',
    contentType: contentType || 'image/jpeg',
    size: buffer.length,
    cloudinaryUrl,
    cloudinaryPublicId,
  };

  // Only store binary buffer in MongoDB if Cloudinary is not used, to optimize DB storage
  if (!cloudinaryUrl) {
    imageDocData.data = buffer;
  }

  const imageDoc = await Image.create(imageDocData);

  // 3. Cache to disk using document ID as filename base
  try {
    const ext = getExtensionFromMime(contentType) || path.extname(filename) || '.jpg';
    const diskPath = path.join(UPLOADS_DIR, `${imageDoc._id}${ext}`);
    fs.writeFileSync(diskPath, buffer);
  } catch (diskErr) {
    console.warn('⚠️  Could not write disk cache for image:', diskErr.message);
  }

  // Determine final public URL
  const publicUrl = cloudinaryUrl || `/api/images/${imageDoc._id}`;

  return {
    _id: imageDoc._id,
    url: publicUrl,
    filename: imageDoc.filename,
    contentType: imageDoc.contentType,
    size: imageDoc.size,
    cloudinaryUrl,
  };
}

/**
 * Get an image by ID (from Cloudinary redirect, MongoDB buffer, or disk cache)
 * @param {string} id - Image ObjectId
 * @returns {Promise<Object|null>} { data, contentType, filename, redirectUrl }
 */
async function getImageById(id) {
  try {
    const doc = await Image.findById(id);
    if (doc) {
      // If hosted on Cloudinary, return the secure CDN URL for redirect
      if (doc.cloudinaryUrl) {
        return {
          redirectUrl: doc.cloudinaryUrl,
          contentType: doc.contentType || 'image/jpeg',
          filename: doc.filename,
        };
      }

      // If stored as binary buffer in MongoDB
      if (doc.data && doc.data.length > 0) {
        return {
          data: doc.data,
          contentType: doc.contentType || 'image/jpeg',
          filename: doc.filename,
        };
      }
    }
  } catch (dbErr) {
    console.warn(`⚠️ DB lookup for image ${id} failed:`, dbErr.message);
  }

  // Fallback to disk cache if DB query failed or document had no buffer
  ensureUploadsDir();
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    const match = files.find((f) => f.startsWith(String(id)));
    if (match) {
      const filePath = path.join(UPLOADS_DIR, match);
      const data = fs.readFileSync(filePath);
      const ext = path.extname(match).toLowerCase();
      const mime = getMimeFromExtension(ext);
      return {
        data,
        contentType: mime,
        filename: match,
      };
    }
  } catch (diskErr) {
    console.warn(`⚠️ Disk cache lookup for image ${id} failed:`, diskErr.message);
  }

  return null;
}

/**
 * Delete an image by ID (from Cloudinary, MongoDB, and disk cache)
 * @param {string} id - Image ObjectId
 */
async function deleteImageById(id) {
  try {
    const doc = await Image.findById(id);
    if (doc && doc.cloudinaryPublicId) {
      await deleteFromCloudinary(doc.cloudinaryPublicId);
    }
    await Image.findByIdAndDelete(id);
  } catch (e) {
    console.warn('⚠️ Error deleting image from DB:', e.message);
  }

  try {
    ensureUploadsDir();
    const files = fs.readdirSync(UPLOADS_DIR);
    const match = files.find((f) => f.startsWith(String(id)));
    if (match) {
      fs.unlinkSync(path.join(UPLOADS_DIR, match));
    }
  } catch (e) {
    /* ignore disk delete errors */
  }
}

function getExtensionFromMime(mime) {
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
  };
  return map[mime] || '.jpg';
}

function getMimeFromExtension(ext) {
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
}

module.exports = {
  saveImage,
  getImageById,
  deleteImageById,
  ensureUploadsDir,
};
