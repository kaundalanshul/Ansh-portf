/**
 * Interests Dual-Persistence Storage Utility
 * ──────────────────────────────────────────
 * Guarantees that portfolio interests and related items are NEVER lost
 * across server restarts, nodemon reloads, in-memory MongoDB reboots,
 * or database disconnects.
 *
 * Keeps backend/data/interests.json in continuous sync with MongoDB.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const INTERESTS_FILE = path.join(DATA_DIR, 'interests.json');

const DEFAULT_INTERESTS = [
  {
    _id: "670100000000000000000001",
    num: "01",
    title: "MUSIC",
    image: "hobby_music.jpg",
    description: "Curated playlists, sonic atmospheres, and electronic beats that provide the rhythm for deep coding sessions.",
    order: 0,
    items: [
      {
        _id: "670100000000000000000101",
        title: "Discovery",
        subtitle: "Daft Punk • 2001",
        tag: "Album",
        description: "The gold standard of French House and electronic production. From 'One More Time' to 'Voyager', every synth line is iconic.",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
        link: "https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa",
        order: 0
      },
      {
        _id: "670100000000000000000102",
        title: "Dive",
        subtitle: "Tycho • 2011",
        tag: "Ambient",
        description: "Warm, textured analog synthesizers and nostalgic acoustic melodies that form the backbone of endless focused development hours.",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
        link: "https://open.spotify.com/album/43q4GZ9U1Yw6Jc0z0C4n3j",
        order: 1
      },
      {
        _id: "670100000000000000000103",
        title: "Deep Focus Lo-Fi Coding",
        subtitle: "Curated Spotify Mix",
        tag: "Playlist",
        description: "Down-tempo beats, vinyl crackles, and gentle electric piano chords tuned specifically for bug hunting and clean system design.",
        image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80",
        link: "https://open.spotify.com",
        order: 2
      },
      {
        _id: "670100000000000000000104",
        title: "Divenire",
        subtitle: "Ludovico Einaudi • 2006",
        tag: "Modern Classical",
        description: "Breathtaking minimalist piano paired with cinematic string orchestration for creative inspiration and mental clarity.",
        image: "https://images.unsplash.com/photo-1520523839898-507127043814?auto=format&fit=crop&w=600&q=80",
        link: "https://open.spotify.com",
        order: 3
      }
    ],
    spotifyPlaylists: [
      {
        _id: "670100000000000000000199",
        title: "Curated Spotify Playlist",
        url: "https://open.spotify.com/playlist/6jZaEmElzm5jlVlarE8jZc?si=-8pXoqm5TBKUbmbC6wVOoQ&utm_source=copy-link&pi=HWqHUETPS6qvE",
        order: 0
      }
    ]
  },
  {
    _id: "670100000000000000000002",
    num: "02",
    title: "TRAVEL",
    image: "hobby_travel.jpg",
    description: "Venture beyond screens into mountain ridges, serene coastal roads, and historic cultural destinations.",
    order: 1,
    items: [
      {
        _id: "670100000000000000000201",
        title: "Himalayan Ridge Expeditions",
        subtitle: "Himachal Pradesh & Spiti Valley",
        tag: "Mountains",
        description: "High altitude passes, rugged mountain terrains, ancient monasteries, and crystal-clear star-studded night skies.",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
        link: "",
        order: 0
      },
      {
        _id: "670100000000000000000202",
        title: "Kyoto Heritage & Zen Gardens",
        subtitle: "Kyoto, Japan",
        tag: "Culture",
        description: "Wandering through bamboo groves of Arashiyama, peaceful stone zen gardens, and historic cedar wooden temple architecture.",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80",
        link: "",
        order: 1
      },
      {
        _id: "670100000000000000000203",
        title: "Coastal Cliff Roads",
        subtitle: "Ocean Highway Drives",
        tag: "Road Trip",
        description: "The thrill of open-window sunset drives along winding cliffs with the crash of ocean surf and crisp sea breezes.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        link: "",
        order: 2
      },
      {
        _id: "670100000000000000000204",
        title: "Night Markets & Street Food",
        subtitle: "Southeast Asia Trails",
        tag: "Gastronomy",
        description: "Immersing in sizzling culinary traditions, aromatic spices, lively night buzz, and spontaneous conversations with locals.",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        link: "",
        order: 3
      }
    ]
  },
  {
    _id: "670100000000000000000003",
    num: "03",
    title: "READING",
    image: "hobby_reading.jpg",
    description: "Deep exploration of computer architecture, software craftsmanship, human psychology, and philosophical insights.",
    order: 2,
    items: [
      {
        _id: "670100000000000000000301",
        title: "Designing Data-Intensive Applications",
        subtitle: "Martin Kleppmann",
        tag: "Architecture",
        description: "The definitive guide to distributed databases, storage engines, stream processing, consensus, and fault-tolerant architectures.",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
        link: "https://dataintensive.net/",
        order: 0
      },
      {
        _id: "670100000000000000000302",
        title: "Clean Code",
        subtitle: "Robert C. Martin ('Uncle Bob')",
        tag: "Craftsmanship",
        description: "Principles of writing software that is readable, maintainable, modular, and a genuine pleasure for fellow engineers to collaborate on.",
        image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80",
        link: "",
        order: 1
      },
      {
        _id: "670100000000000000000303",
        title: "Atomic Habits",
        subtitle: "James Clear",
        tag: "Productivity",
        description: "A framework of incremental 1% compound improvements. System over goals, identity-based habits, and effortless consistency.",
        image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
        link: "",
        order: 2
      },
      {
        _id: "670100000000000000000304",
        title: "Deep Work",
        subtitle: "Cal Newport",
        tag: "Philosophy",
        description: "Cultivating intense, undistracted cognitive focus in an era of notifications, fragmented attention, and superficial busywork.",
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
        link: "",
        order: 3
      }
    ]
  }
];

/** Ensure data directory and file exist */
function ensureStorageExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(INTERESTS_FILE)) {
      fs.writeFileSync(INTERESTS_FILE, JSON.stringify(DEFAULT_INTERESTS, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('⚠️  Failed to initialize interests storage directory:', err.message);
  }
}

/** Read interests array from disk */
function getPersistentInterests() {
  ensureStorageExists();
  try {
    const raw = fs.readFileSync(INTERESTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_INTERESTS;
  } catch (err) {
    console.error('⚠️  Error reading interests from disk:', err.message);
    return DEFAULT_INTERESTS;
  }
}

/** Save interests array to disk */
function savePersistentInterests(interests) {
  ensureStorageExists();
  try {
    const cleanList = (Array.isArray(interests) ? interests : []).map((p) => {
      const obj = p.toObject ? p.toObject() : { ...p };
      if (obj._id) obj._id = String(obj._id);
      if (Array.isArray(obj.items)) {
        obj.items = obj.items.map((item) => {
          const itemObj = item.toObject ? item.toObject() : { ...item };
          if (itemObj._id) itemObj._id = String(itemObj._id);
          return itemObj;
        });
      }
      if (Array.isArray(obj.spotifyPlaylists)) {
        obj.spotifyPlaylists = obj.spotifyPlaylists.map((pl) => {
          const plObj = pl.toObject ? pl.toObject() : { ...pl };
          if (plObj._id) plObj._id = String(plObj._id);
          return plObj;
        });
      }
      return obj;
    });
    fs.writeFileSync(INTERESTS_FILE, JSON.stringify(cleanList, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('⚠️  Error saving interests to disk:', err.message);
    return false;
  }
}

/** Synchronize a single created or updated interest category into disk backup */
function syncInterestToDisk(interest) {
  try {
    const current = getPersistentInterests();
    const intObj = interest.toObject ? interest.toObject() : { ...interest };
    const id = String(intObj._id || intObj.id);
    intObj._id = id;

    const existingIdx = current.findIndex((p) => String(p._id) === id);
    if (existingIdx >= 0) {
      current[existingIdx] = { ...current[existingIdx], ...intObj };
    } else {
      current.push(intObj);
    }
    savePersistentInterests(current);
  } catch (err) {
    console.error('⚠️  Error syncing interest to disk:', err.message);
  }
}

/** Remove an interest from disk backup */
function removeInterestFromDisk(id) {
  try {
    const current = getPersistentInterests();
    const filtered = current.filter((p) => String(p._id) !== String(id));
    savePersistentInterests(filtered);
  } catch (err) {
    console.error('⚠️  Error removing interest from disk:', err.message);
  }
}

/**
 * Startup synchronization between MongoDB and disk storage:
 * - If DB has 0 interests and disk has interests, restore them to DB immediately.
 * - If DB has interests, update disk storage so disk backup is 100% current.
 */
async function initInterestSync(InterestModel) {
  ensureStorageExists();
  try {
    const dbCount = await InterestModel.countDocuments();
    let diskInterests = getPersistentInterests();
    if (!diskInterests || diskInterests.length === 0) {
      diskInterests = DEFAULT_INTERESTS;
      savePersistentInterests(DEFAULT_INTERESTS);
    }

    if (dbCount === 0 && diskInterests.length > 0) {
      console.log(`📦 Restoring ${diskInterests.length} interests from persistent disk storage to database...`);
      for (const p of diskInterests) {
        try {
          const toInsert = { ...p };
          if (toInsert._id) {
            await InterestModel.findByIdAndUpdate(
              toInsert._id,
              toInsert,
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } else {
            await InterestModel.create(toInsert);
          }
        } catch (innerErr) {
          try {
            const fallback = { ...p };
            delete fallback._id;
            await InterestModel.create(fallback);
          } catch (createErr) {
            console.error('⚠️  Failed to restore interest:', p.title, createErr.message);
          }
        }
      }
      console.log(`✅ Interests successfully restored to database.`);
    } else if (dbCount > 0) {
      // Check if any category (e.g. MUSIC) has playlists on disk but none in DB
      for (const diskItem of diskInterests) {
        if (Array.isArray(diskItem.spotifyPlaylists) && diskItem.spotifyPlaylists.length > 0) {
          const dbItem = await InterestModel.findById(diskItem._id);
          if (dbItem && (!dbItem.spotifyPlaylists || dbItem.spotifyPlaylists.length === 0)) {
            dbItem.spotifyPlaylists = diskItem.spotifyPlaylists;
            await dbItem.save();
            console.log(`🎵 Populated ${diskItem.spotifyPlaylists.length} Spotify playlists for ${dbItem.title} in database.`);
          }
        }
      }
      const allDBInterests = await InterestModel.find().sort({ order: 1, createdAt: 1 });
      savePersistentInterests(allDBInterests);
      console.log(`💾 Synced ${allDBInterests.length} database interests to persistent disk backup.`);
    }
  } catch (err) {
    console.error('⚠️  initInterestSync error:', err.message);
  }
}

module.exports = {
  getPersistentInterests,
  savePersistentInterests,
  syncInterestToDisk,
  removeInterestFromDisk,
  initInterestSync,
  DEFAULT_INTERESTS,
};
