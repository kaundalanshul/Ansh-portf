/**
 * Message Routes
 * ──────────────
 * POST   /api/messages           — Submit contact message (public)
 * GET    /api/messages           — List all messages (admin)
 * PATCH  /api/messages/:id/read  — Toggle read status (admin)
 * DELETE /api/messages/:id       — Delete message (admin)
 */

const express = require('express');
const router = express.Router();
const {
  createMessage,
  getMessages,
  toggleReadStatus,
  deleteMessage,
} = require('../controllers/messageController');
const auth = require('../middleware/auth');
const { validateMessage } = require('../middleware/validate');

// Public route
router.post('/', validateMessage, createMessage);

// Admin-protected routes
router.get('/', auth, getMessages);
router.patch('/:id/read', auth, toggleReadStatus);
router.delete('/:id', auth, deleteMessage);

module.exports = router;
