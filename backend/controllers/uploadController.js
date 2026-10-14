/**
 * Upload & Image Controller
 * ─────────────────────────
 * Handles persistent image and file storage in Cloudinary with MongoDB Atlas fallback.
 */

const { saveImage, getImageById, deleteImageById } = require('../utils/imageStorage');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit

/**
 * Upload an image or file
 * POST /api/upload
 */
const uploadFile = async (req, res, next) => {
  try {
    let filename = 'upload.jpg';
    let contentType = 'image/jpeg';
    let buffer = null;

    // Check if body contains base64 data string
    if (req.body && (req.body.image || req.body.data || req.body.file)) {
      const rawPayload = req.body.image || req.body.data || req.body.file;
      filename = req.body.filename || 'uploaded_image.jpg';

      if (typeof rawPayload === 'string' && rawPayload.startsWith('data:')) {
        const matches = rawPayload.match(/^data:([A-Za-z0-9\/+-]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return res.status(400).json({
            success: false,
            message: 'Invalid base64 data URL format.',
          });
        }
        contentType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else if (typeof rawPayload === 'string') {
        // Plain base64 string
        buffer = Buffer.from(rawPayload, 'base64');
        contentType = req.body.contentType || 'image/jpeg';
      }
    } else if (req.file && req.file.buffer) {
      // Multipart upload fallback
      filename = req.file.originalname || 'upload.jpg';
      contentType = req.file.mimetype || 'image/jpeg';
      buffer = req.file.buffer;
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file data provided in request. Send a base64 image or file.',
      });
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(contentType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type: ${contentType}. Allowed types: JPG, PNG, WEBP, GIF, SVG, PDF.`,
      });
    }

    // Validate size
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `File is too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 15MB.`,
      });
    }

    // Persist to Cloudinary or MongoDB Atlas
    const savedDoc = await saveImage({
      filename,
      contentType,
      buffer,
    });

    res.status(201).json({
      success: true,
      message: savedDoc.cloudinaryUrl
        ? 'Image uploaded to Cloudinary CDN successfully.'
        : 'Image stored persistently in database.',
      url: savedDoc.url,
      id: savedDoc._id,
      filename: savedDoc.filename,
      contentType: savedDoc.contentType,
      size: savedDoc.size,
      cloudinaryUrl: savedDoc.cloudinaryUrl,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Serve an image or file by ID
 * GET /api/images/:id
 */
const getImage = async (req, res, next) => {
  try {
    let id = req.params.id;
    // Strip file extension if appended in URL (e.g. 6acdf...jpg -> 6acdf...)
    if (id && id.includes('.')) {
      id = id.split('.')[0];
    }

    const image = await getImageById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found.',
      });
    }

    // If hosted on Cloudinary, redirect client to high-speed CDN URL
    if (image.redirectUrl) {
      return res.redirect(302, image.redirectUrl);
    }

    if (!image.data) {
      return res.status(404).json({
        success: false,
        message: 'Image binary data not found.',
      });
    }

    // Set CORS headers specifically to allow cross-origin embedding everywhere
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Content-Length', image.data.length);
    res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');

    return res.end(image.data);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an image by ID
 * DELETE /api/images/:id
 */
const deleteImage = async (req, res, next) => {
  try {
    let id = req.params.id;
    if (id && id.includes('.')) {
      id = id.split('.')[0];
    }

    await deleteImageById(id);

    res.json({
      success: true,
      message: 'Image deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadFile,
  getImage,
  deleteImage,
};
