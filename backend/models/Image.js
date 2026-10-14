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
    },
    data: {
      type: Buffer,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index on createdAt for sorting / cleanup if needed
imageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Image', imageSchema);
