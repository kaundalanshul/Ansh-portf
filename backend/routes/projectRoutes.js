/**
 * Project Routes
 * ──────────────
 * GET    /api/projects      — List all projects (public)
 * GET    /api/projects/:id  — Get single project (public)
 * POST   /api/projects      — Create project (admin)
 * PUT    /api/projects/:id  — Update project (admin)
 * DELETE /api/projects/:id  — Delete project (admin)
 */

const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const auth = require('../middleware/auth');
const { validateProject } = require('../middleware/validate');

// Public routes
router.get('/', getProjects);
router.get('/:id', getProject);

// Admin-protected routes
router.post('/', auth, validateProject, createProject);
router.put('/:id', auth, validateProject, updateProject);
router.delete('/:id', auth, deleteProject);

module.exports = router;
