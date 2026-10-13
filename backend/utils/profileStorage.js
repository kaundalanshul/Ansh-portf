/**
 * Profile Dual-Persistence Storage Utility
 * ────────────────────────────────────────
 * Guarantees that site settings, bio, education, experience,
 * certifications, achievements, contact, and resume are NEVER lost
 * across server restarts, nodemon reloads, or in-memory DB reboots.
 *
 * Keeps backend/data/profile.json in continuous sync with MongoDB.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');

/** Ensure data directory and file exist */
function ensureStorageExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('⚠️  Failed to create data directory for profile:', err.message);
  }
}

/** Read profile object from disk */
function getPersistentProfile() {
  ensureStorageExists();
  try {
    if (!fs.existsSync(PROFILE_FILE)) return null;
    const raw = fs.readFileSync(PROFILE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch (err) {
    console.error('⚠️  Error reading profile from disk:', err.message);
    return null;
  }
}

/** Save profile object to disk */
function savePersistentProfile(profile) {
  ensureStorageExists();
  try {
    const obj = profile && profile.toObject ? profile.toObject() : { ...profile };
    // Keep clean JSON without mongoose internal properties
    delete obj.__v;
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('⚠️  Error saving profile to disk:', err.message);
    return false;
  }
}

/** Synchronize updated profile to disk backup */
function syncProfileToDisk(profile) {
  savePersistentProfile(profile);
}

/**
 * Startup synchronization between MongoDB and disk storage:
 * - If DB has no profile, restores from profile.json (or creates from schema defaults).
 * - If DB has profile, syncs latest data to profile.json.
 */
async function initProfileSync(ProfileModel) {
  ensureStorageExists();
  try {
    let dbProfile = await ProfileModel.findOne();
    const diskProfile = getPersistentProfile();

    if (!dbProfile) {
      if (diskProfile) {
        dbProfile = await ProfileModel.create(diskProfile);
        console.log('✅ Profile restored from disk backup into MongoDB');
      } else {
        dbProfile = await ProfileModel.create({});
        savePersistentProfile(dbProfile);
        console.log('✅ Initial default profile created and backed up to disk');
      }
    } else {
      // If disk has newer data or DB has data, keep them aligned
      savePersistentProfile(dbProfile);
      console.log('✅ Profile disk backup synced with MongoDB');
    }
  } catch (err) {
    console.error('⚠️  Error initializing profile storage sync:', err.message);
  }
}

module.exports = {
  getPersistentProfile,
  savePersistentProfile,
  syncProfileToDisk,
  initProfileSync,
};
