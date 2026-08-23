/**
 * Skill Model
 * ───────────
 * Stores skills with category grouping and proficiency levels.
 */

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      maxlength: [50, 'Skill name cannot exceed 50 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Frontend', 'Backend', 'Tools', 'Other'],
        message: 'Category must be Frontend, Backend, Tools, or Other',
      },
    },
    proficiency: {
      type: Number,
      required: [true, 'Proficiency level is required'],
      min: [1, 'Proficiency must be at least 1'],
      max: [100, 'Proficiency cannot exceed 100'],
    },
    icon: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for sorting by category and order
skillSchema.index({ category: 1, order: 1 });

module.exports = mongoose.model('Skill', skillSchema);
