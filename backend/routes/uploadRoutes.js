const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadFile, getImage, deleteImage } = require('../controllers/uploadController');

// Upload image (requires admin authentication)
router.post('/upload', auth, uploadFile);

// Public image serving endpoint (does NOT require auth so <img> tags work everywhere)
router.get('/images/:id', getImage);

// Delete image (requires admin authentication)
router.delete('/images/:id', auth, deleteImage);

module.exports = router;
