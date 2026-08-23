/**
 * Profile Routes
 * ──────────────
 * GET /api/profile - Fetch profile & site settings (public)
 * PUT /api/profile - Update profile & site settings (admin auth required)
 */

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.get('/', getProfile);
router.put('/', auth, updateProfile);

module.exports = router;
