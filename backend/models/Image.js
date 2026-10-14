const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      required: true,
      default: 'image/jpeg',
    },
    size: {
      type: Number,
      required: true,
      default: 0,
    },
    data: {
      type: Buffer,
      required: false,
    },
    cloudinaryUrl: {
      type: String,
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index on createdAt for fast sorting / queries
imageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Image', imageSchema);
