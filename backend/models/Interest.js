/**
 * Interest Category & Related Items Model
 * ───────────────────────────────────────
 * Stores Interest categories (e.g. Music, Travel, Reading)
 * and their associated items (e.g. tracks, destinations, books).
 */

const mongoose = require('mongoose');

const interestItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    tag: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

const spotifyPlaylistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    url: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

const interestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'New Interest',
      trim: true,
    },
    num: {
      type: String,
      default: '01',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    items: {
      type: [interestItemSchema],
      default: [],
    },
    spotifyPlaylists: {
      type: [spotifyPlaylistSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Interest', interestSchema);
