/**
 * Skill Routes
 * ────────────
 * GET    /api/skills      — List all skills (public)
 * POST   /api/skills      — Create skill (admin)
 * PUT    /api/skills/:id  — Update skill (admin)
 * DELETE /api/skills/:id  — Delete skill (admin)
 */

const express = require('express');
const router = express.Router();
const {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} = require('../controllers/skillController');
const auth = require('../middleware/auth');
const { validateSkill } = require('../middleware/validate');

// Public route
router.get('/', getSkills);

// Admin-protected routes
router.post('/', auth, validateSkill, createSkill);
router.put('/:id', auth, validateSkill, updateSkill);
router.delete('/:id', auth, deleteSkill);

module.exports = router;
