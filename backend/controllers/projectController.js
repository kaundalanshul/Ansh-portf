/**
 * Project Controller
 * ──────────────────
 * CRUD operations for portfolio projects.
 * Public: GET (list, single)
 * Admin: POST, PUT, DELETE
 *
 * All mutations sync immediately to persistent disk storage
 * so projects survive server restarts and in-memory DB resets.
 */

const Project = require('../models/Project');
const {
  syncProjectToDisk,
  removeProjectFromDisk,
  savePersistentProjects,
  getPersistentProjects,
} = require('../utils/projectStorage');

/**
 * GET /api/projects
 * Public: List all projects sorted by order then newest.
 * If DB returns empty but disk backup has projects, restore them first.
 */
const getProjects = async (req, res, next) => {
  try {
    let projects = await Project.find().sort({ order: 1, createdAt: -1 });

    // Self-healing: restore from disk if DB is empty (e.g. after in-memory reset)
    if (projects.length === 0) {
      const diskProjects = getPersistentProjects();
      if (diskProjects.length > 0) {
        console.log(`📦 DB is empty — restoring ${diskProjects.length} project(s) from disk backup...`);
        for (const p of diskProjects) {
          try {
            const toInsert = { ...p };
            if (toInsert._id) {
              await Project.findByIdAndUpdate(
                toInsert._id,
                toInsert,
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
            } else {
              await Project.create(toInsert);
            }
          } catch (innerErr) {
            try {
              const fallback = { ...p };
              delete fallback._id;
              await Project.create(fallback);
            } catch (createErr) {
              console.error('⚠️  Failed to restore project:', p.title, createErr.message);
            }
          }
        }
        projects = await Project.find().sort({ order: 1, createdAt: -1 });
        console.log(`✅ Restored ${projects.length} project(s) to database.`);
      }
    }

    res.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Public: Get a single project by ID
 */
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects
 * Admin: Create a new project
 * Syncs to disk backup immediately after DB save.
 */
const createProject = async (req, res, next) => {
  try {
    const project = await Project.create(req.body);

    // Sync: save to persistent disk backup
    syncProjectToDisk(project);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/projects/:id
 * Admin: Update an existing project
 * Syncs to disk backup immediately after DB update.
 */
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Sync: update persistent disk backup
    syncProjectToDisk(project);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id
 * Admin: Delete a project
 * Removes from disk backup immediately after DB delete.
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Sync: remove from persistent disk backup
    removeProjectFromDisk(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
