/**
 * Interests Controller
 * ───────────────────
 * Full CRUD operations for Interest Categories and their Related Items.
 * Public: GET (list, single)
 * Admin: POST, PUT, DELETE (categories & nested items)
 *
 * All mutations sync immediately to persistent disk storage (backend/data/interests.json)
 * so interests and items survive server restarts and in-memory DB resets.
 */

const Interest = require('../models/Interest');
const {
  syncInterestToDisk,
  removeInterestFromDisk,
  getPersistentInterests,
  savePersistentInterests,
  DEFAULT_INTERESTS,
} = require('../utils/interestStorage');

/**
 * GET /api/interests
 * Public: List all interest categories sorted by order then creation date.
 * Restores from disk backup if DB is empty.
 */
const getInterests = async (req, res, next) => {
  try {
    let interests = await Interest.find().sort({ order: 1, createdAt: 1 });

    // Self-healing: restore from disk if DB is empty
    if (!interests || interests.length === 0) {
      let diskInterests = getPersistentInterests();
      if (!diskInterests || diskInterests.length === 0) {
        diskInterests = DEFAULT_INTERESTS;
      }
      for (const p of diskInterests) {
        try {
          const toInsert = { ...p };
          if (toInsert._id) {
            await Interest.findByIdAndUpdate(toInsert._id, toInsert, {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            });
          } else {
            await Interest.create(toInsert);
          }
        } catch (innerErr) {
          try {
            const fallback = { ...p };
            delete fallback._id;
            await Interest.create(fallback);
          } catch (createErr) {
            console.error('⚠️  Failed to restore interest:', p.title, createErr.message);
          }
        }
      }
      interests = await Interest.find().sort({ order: 1, createdAt: 1 });
    }

    res.json({
      success: true,
      count: interests.length,
      data: interests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interests/:id
 * Public: Get a single interest category by ID
 */
const getInterest = async (req, res, next) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest category not found',
      });
    }

    res.json({
      success: true,
      data: interest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interests
 * Admin: Create a new interest category
 * Gracefully handles partial data.
 */
const createInterest = async (req, res, next) => {
  try {
    const { title, num, image, description, order, items, spotifyPlaylists } = req.body;

    const newInterest = await Interest.create({
      title: (title && title.trim()) || 'NEW INTEREST',
      num: num || '01',
      image: image || '',
      description: description || '',
      order: typeof order === 'number' ? order : 0,
      items: Array.isArray(items) ? items : [],
      spotifyPlaylists: Array.isArray(spotifyPlaylists) ? spotifyPlaylists : [],
    });

    syncInterestToDisk(newInterest);

    res.status(201).json({
      success: true,
      message: 'Interest category created successfully',
      data: newInterest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/interests/:id
 * Admin: Update an existing interest category
 */
const updateInterest = async (req, res, next) => {
  try {
    const { title, num, image, description, order, items, spotifyPlaylists } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim() || 'UNTITLED';
    if (num !== undefined) updateData.num = num;
    if (image !== undefined) updateData.image = image;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = Number(order) || 0;
    if (items !== undefined && Array.isArray(items)) updateData.items = items;
    if (spotifyPlaylists !== undefined && Array.isArray(spotifyPlaylists)) updateData.spotifyPlaylists = spotifyPlaylists;

    const updatedInterest = await Interest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    );

    if (!updatedInterest) {
      return res.status(404).json({
        success: false,
        message: 'Interest category not found',
      });
    }

    syncInterestToDisk(updatedInterest);

    res.json({
      success: true,
      message: 'Interest category updated successfully',
      data: updatedInterest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/interests/:id
 * Admin: Delete an interest category
 */
const deleteInterest = async (req, res, next) => {
  try {
    const interest = await Interest.findByIdAndDelete(req.params.id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest category not found',
      });
    }

    removeInterestFromDisk(req.params.id);

    res.json({
      success: true,
      message: 'Interest category deleted successfully',
      data: interest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interests/:id/items
 * Admin: Add a related item into an interest category
 * Gracefully accepts partial / incomplete data.
 */
const addItem = async (req, res, next) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest category not found',
      });
    }

    const { title, subtitle, description, image, link, tag, order } = req.body;
    const newItem = {
      title: (title && title.trim()) || 'Untitled Item',
      subtitle: subtitle || '',
      description: description || '',
      image: image || '',
      link: link || '',
      tag: tag || '',
      order: typeof order === 'number' ? order : interest.items.length,
    };

    interest.items.push(newItem);
    await interest.save();

    syncInterestToDisk(interest);

    res.status(201).json({
      success: true,
      message: 'Item added successfully',
      data: interest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/interests/:id/items/:itemId
 * Admin: Update a related item inside an interest category
 */
const updateItem = async (req, res, next) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest category not found',
      });
    }

    const item = interest.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in this interest category',
      });
    }

    const { title, subtitle, description, image, link, tag, order } = req.body;
    if (title !== undefined) item.title = title.trim() || 'Untitled Item';
    if (subtitle !== undefined) item.subtitle = subtitle;
    if (description !== undefined) item.description = description;
    if (image !== undefined) item.image = image;
    if (link !== undefined) item.link = link;
    if (tag !== undefined) item.tag = tag;
    if (order !== undefined) item.order = Number(order) || 0;

    await interest.save();
    syncInterestToDisk(interest);

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: interest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/interests/:id/items/:itemId
 * Admin: Remove a related item from an interest category
 */
const deleteItem = async (req, res, next) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest category not found',
      });
    }

    const itemIndex = interest.items.findIndex(
      (it) => String(it._id) === String(req.params.itemId)
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in this interest category',
      });
    }

    interest.items.splice(itemIndex, 1);
    await interest.save();
    syncInterestToDisk(interest);

    res.json({
      success: true,
      message: 'Item deleted successfully',
      data: interest,
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════
   SPOTIFY PLAYLIST CRUD (embedded inside interest)
   ══════════════════════════════════════════════════ */

/**
 * POST /api/interests/:id/playlists
 * Admin: Add a Spotify playlist to an interest category
 */
const addPlaylist = async (req, res, next) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest category not found',
      });
    }

    const { title, url, order } = req.body;
    const newPlaylist = {
      title: (title && title.trim()) || 'Untitled Playlist',
      url: (url && url.trim()) || '',
      order: typeof order === 'number' ? order : interest.spotifyPlaylists.length,
    };

    interest.spotifyPlaylists.push(newPlaylist);
    await interest.save();
    syncInterestToDisk(interest);

    res.status(201).json({
      success: true,
      message: 'Spotify playlist added successfully',
      data: interest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/interests/:id/playlists/:playlistId
 * Admin: Update a Spotify playlist inside an interest category
 */
const updatePlaylist = async (req, res, next) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest category not found',
      });
    }

    const playlist = interest.spotifyPlaylists.id(req.params.playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found in this interest category',
      });
    }

    const { title, url, order } = req.body;
    if (title !== undefined) playlist.title = title.trim() || 'Untitled Playlist';
    if (url !== undefined) playlist.url = url.trim();
    if (order !== undefined) playlist.order = Number(order) || 0;

    await interest.save();
    syncInterestToDisk(interest);

    res.json({
      success: true,
      message: 'Spotify playlist updated successfully',
      data: interest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/interests/:id/playlists/:playlistId
 * Admin: Remove a Spotify playlist from an interest category
 */
const deletePlaylist = async (req, res, next) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest category not found',
      });
    }

    const idx = interest.spotifyPlaylists.findIndex(
      (pl) => String(pl._id) === String(req.params.playlistId)
    );

    if (idx === -1) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found in this interest category',
      });
    }

    interest.spotifyPlaylists.splice(idx, 1);
    await interest.save();
    syncInterestToDisk(interest);

    res.json({
      success: true,
      message: 'Spotify playlist deleted successfully',
      data: interest,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
