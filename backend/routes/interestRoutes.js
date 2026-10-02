/**
 * Interest Routes
 * ───────────────
 * Public:
 *   GET    /api/interests             — List all categories with items
 *   GET    /api/interests/:id         — Get single category
 * Admin (Protected):
 *   POST   /api/interests             — Create interest category
 *   PUT    /api/interests/:id         — Update interest category
 *   DELETE /api/interests/:id         — Delete interest category
 *   POST   /api/interests/:id/items   — Add related item
 *   PUT    /api/interests/:id/items/:itemId — Update related item
 *   DELETE /api/interests/:id/items/:itemId — Delete related item
 *   POST   /api/interests/:id/playlists           — Add Spotify playlist
 *   PUT    /api/interests/:id/playlists/:playlistId — Update Spotify playlist
 *   DELETE /api/interests/:id/playlists/:playlistId — Delete Spotify playlist
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getInterests,
  getInterest,
  createInterest,
  updateInterest,
  deleteInterest,
  addItem,
  updateItem,
  deleteItem,
  addPlaylist,
  updatePlaylist,
  deletePlaylist,
} = require('../controllers/interestController');

// Public routes
router.get('/', getInterests);
router.get('/:id', getInterest);

// Admin category routes
router.post('/', auth, createInterest);
router.put('/:id', auth, updateInterest);
router.delete('/:id', auth, deleteInterest);

// Admin item routes
router.post('/:id/items', auth, addItem);
router.put('/:id/items/:itemId', auth, updateItem);
router.delete('/:id/items/:itemId', auth, deleteItem);

// Admin Spotify playlist routes
router.post('/:id/playlists', auth, addPlaylist);
router.put('/:id/playlists/:playlistId', auth, updatePlaylist);
router.delete('/:id/playlists/:playlistId', auth, deletePlaylist);

module.exports = router;
