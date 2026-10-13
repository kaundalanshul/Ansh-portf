/**
 * Skills Dual-Persistence Storage Utility
 * ───────────────────────────────────────
 * Guarantees that skills are NEVER lost across server restarts,
 * nodemon reloads, or in-memory DB reboots.
 *
 * Keeps backend/data/skills.json in continuous sync with MongoDB.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');

/** Ensure data directory exists */
function ensureStorageExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('⚠️  Failed to create data directory for skills:', err.message);
  }
}

/** Read skills array from disk */
function getPersistentSkills() {
  ensureStorageExists();
  try {
    if (!fs.existsSync(SKILLS_FILE)) return [];
    const raw = fs.readFileSync(SKILLS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('⚠️  Error reading skills from disk:', err.message);
    return [];
  }
}

/** Save skills array to disk */
function savePersistentSkills(skills) {
  ensureStorageExists();
  try {
    const cleanList = (Array.isArray(skills) ? skills : []).map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      if (obj._id) obj._id = String(obj._id);
      delete obj.__v;
      return obj;
    });
    fs.writeFileSync(SKILLS_FILE, JSON.stringify(cleanList, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('⚠️  Error saving skills to disk:', err.message);
    return false;
  }
}

/** Synchronize a single created or updated skill into disk backup */
function syncSkillToDisk(skill) {
  try {
    const current = getPersistentSkills();
    const skillObj = skill.toObject ? skill.toObject() : { ...skill };
    const id = String(skillObj._id || skillObj.id || '');
    if (id) skillObj._id = id;

    const existingIdx = current.findIndex((s) => (s._id && String(s._id) === id) || (s.name && s.name.toLowerCase() === skillObj.name?.toLowerCase()));
    if (existingIdx >= 0) {
      current[existingIdx] = { ...current[existingIdx], ...skillObj };
    } else {
      current.push(skillObj);
    }
    savePersistentSkills(current);
  } catch (err) {
    console.error('⚠️  Error syncing skill to disk:', err.message);
  }
}

/** Remove a skill from disk backup */
function removeSkillFromDisk(id) {
  try {
    const current = getPersistentSkills();
    const filtered = current.filter((s) => String(s._id) !== String(id));
    savePersistentSkills(filtered);
  } catch (err) {
    console.error('⚠️  Error removing skill from disk:', err.message);
  }
}

/**
 * Startup synchronization between MongoDB and disk storage:
 * - If DB has 0 skills and disk has skills, restore them to DB immediately.
 * - If DB has skills, update disk backup to match DB.
 */
async function initSkillSync(SkillModel) {
  ensureStorageExists();
  try {
    const dbCount = await SkillModel.countDocuments();
    const diskSkills = getPersistentSkills();

    if (dbCount === 0 && diskSkills.length > 0) {
      console.log(`📦 Restoring ${diskSkills.length} skills from disk backup into MongoDB...`);
      for (const item of diskSkills) {
        const itemCopy = { ...item };
        delete itemCopy._id; // Let mongoose generate id or preserve if needed
        await SkillModel.create(itemCopy);
      }
      const allDbSkills = await SkillModel.find().sort({ category: 1, order: 1 });
      savePersistentSkills(allDbSkills);
      console.log('✅ Skills successfully restored and synchronized.');
    } else if (dbCount > 0) {
      const allDbSkills = await SkillModel.find().sort({ category: 1, order: 1 });
      savePersistentSkills(allDbSkills);
      console.log(`✅ Skills disk backup updated (${allDbSkills.length} items).`);
    }
  } catch (err) {
    console.error('⚠️  Error initializing skills storage sync:', err.message);
  }
}

module.exports = {
  getPersistentSkills,
  savePersistentSkills,
  syncSkillToDisk,
  removeSkillFromDisk,
  initSkillSync,
};
