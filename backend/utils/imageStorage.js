/**
 * Image Storage & Cache Utility
 * ──────────────────────────────
 * Provides dual storage for uploaded photos:
 * 1. Primary: MongoDB Atlas (persistent in cloud, survives Render restarts)
 * 2. Secondary Cache: Local backend/uploads directory for fast disk access
 */

const fs = require('fs');
const path = require('path');
const Image = require('../models/Image');

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
 * Save an image to MongoDB and disk cache
 * @param {Object} options - { filename, contentType, buffer }
 * @returns {Promise<Object>} Created image document
 */
async function saveImage({ filename, contentType, buffer }) {
  ensureUploadsDir();

  // 1. Save to MongoDB
  const imageDoc = await Image.create({
    filename: filename || 'upload.jpg',
    contentType: contentType || 'image/jpeg',
    size: buffer.length,
    data: buffer,
  });

  // 2. Cache to disk using document ID as filename base
  try {
    const ext = getExtensionFromMime(contentType) || path.extname(filename) || '.jpg';
    const diskPath = path.join(UPLOADS_DIR, `${imageDoc._id}${ext}`);
    fs.writeFileSync(diskPath, buffer);
  } catch (diskErr) {
    console.warn('⚠️  Could not write disk cache for image:', diskErr.message);
  }

  return imageDoc;
}

/**
 * Get an image by ID (from MongoDB or disk cache)
 * @param {string} id - Image ObjectId
 * @returns {Promise<Object|null>} { data, contentType, filename }
 */
async function getImageById(id) {
  try {
    const doc = await Image.findById(id);
    if (doc && doc.data) {
      return {
        data: doc.data,
        contentType: doc.contentType || 'image/jpeg',
        filename: doc.filename,
      };
    }
  } catch (dbErr) {
    console.warn(`⚠️ DB lookup for image ${id} failed:`, dbErr.message);
  }

  // Fallback to disk cache if DB query failed
  ensureUploadsDir();
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    const match = files.find(f => f.startsWith(String(id)));
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
 * Delete an image by ID
 * @param {string} id - Image ObjectId
 */
async function deleteImageById(id) {
  try {
    await Image.findByIdAndDelete(id);
  } catch (e) { /* ignore */ }

  try {
    ensureUploadsDir();
    const files = fs.readdirSync(UPLOADS_DIR);
    const match = files.find(f => f.startsWith(String(id)));
    if (match) {
      fs.unlinkSync(path.join(UPLOADS_DIR, match));
    }
  } catch (e) { /* ignore */ }
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
