/**
 * Auth Routes
 * ───────────
 * POST /api/auth/login  — Admin login
 * GET  /api/auth/me     — Get admin profile (protected)
 */

const express = require('express');
const router = express.Router();
const { login, getProfile, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateLogin, validateProfileUpdate } = require('../middleware/validate');

// Public: Admin login
router.post('/login', validateLogin, login);

// Protected: Get current admin profile
router.get('/me', auth, getProfile);

// Protected: Update admin profile
router.put('/profile', auth, validateProfileUpdate, updateProfile);

module.exports = router;
