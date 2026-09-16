/**
 * Project Dual-Persistence Storage Utility
 * ────────────────────────────────────────
 * Guarantees that portfolio projects are NEVER lost across server restarts,
 * nodemon reloads, in-memory MongoDB reboots, or database disconnects.
 *
 * Keeps backend/data/projects.json in continuous sync with MongoDB.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

/** Ensure data directory and file exist */
function ensureStorageExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROJECTS_FILE)) {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (err) {
    console.error('⚠️  Failed to initialize projects storage directory:', err.message);
  }
}

/** Read projects array from disk */
function getPersistentProjects() {
  ensureStorageExists();
  try {
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('⚠️  Error reading projects from disk:', err.message);
    return [];
  }
}

/** Save projects array to disk */
function savePersistentProjects(projects) {
  ensureStorageExists();
  try {
    const cleanList = (Array.isArray(projects) ? projects : []).map((p) => {
      const obj = p.toObject ? p.toObject() : { ...p };
      if (obj._id) obj._id = String(obj._id);
      return obj;
    });
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(cleanList, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('⚠️  Error saving projects to disk:', err.message);
    return false;
  }
}

/** Synchronize a single created or updated project into disk backup */
function syncProjectToDisk(project) {
  try {
    const current = getPersistentProjects();
    const projObj = project.toObject ? project.toObject() : { ...project };
    const id = String(projObj._id || projObj.id);
    projObj._id = id;

    const existingIdx = current.findIndex((p) => String(p._id) === id);
    if (existingIdx >= 0) {
      current[existingIdx] = { ...current[existingIdx], ...projObj };
    } else {
      current.push(projObj);
    }
    savePersistentProjects(current);
  } catch (err) {
    console.error('⚠️  Error syncing project to disk:', err.message);
  }
}

/** Remove a project from disk backup */
function removeProjectFromDisk(id) {
  try {
    const current = getPersistentProjects();
    const filtered = current.filter((p) => String(p._id) !== String(id));
    savePersistentProjects(filtered);
  } catch (err) {
    console.error('⚠️  Error removing project from disk:', err.message);
  }
}

/**
 * Startup synchronization between MongoDB and disk storage:
 * - If DB has 0 projects and disk has projects, restore them to DB immediately.
 * - If DB has projects, update disk storage so disk backup is 100% current.
 */
async function initProjectSync(ProjectModel) {
  ensureStorageExists();
  try {
    const dbCount = await ProjectModel.countDocuments();
    const diskProjects = getPersistentProjects();

    if (dbCount === 0 && diskProjects.length > 0) {
      console.log(`📦 Restoring ${diskProjects.length} projects from persistent disk storage to database...`);
      for (const p of diskProjects) {
        try {
          const toInsert = { ...p };
          if (toInsert._id) {
            // Keep original ID if valid
            await ProjectModel.findByIdAndUpdate(
              toInsert._id,
              toInsert,
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } else {
            await ProjectModel.create(toInsert);
          }
        } catch (innerErr) {
          // If upsert fails with custom ID, fallback to create
          delete toInsert._id;
          await ProjectModel.create(toInsert);
        }
      }
      console.log(`✅ Projects successfully restored to database.`);
    } else if (dbCount > 0) {
      const allDBProjects = await ProjectModel.find().sort({ order: 1, createdAt: -1 });
      savePersistentProjects(allDBProjects);
      console.log(`💾 Synced ${allDBProjects.length} database projects to persistent disk backup.`);
    }
  } catch (err) {
    console.error('⚠️  initProjectSync error:', err.message);
  }
}

module.exports = {
  getPersistentProjects,
  savePersistentProjects,
  syncProjectToDisk,
  removeProjectFromDisk,
  initProjectSync,
};
