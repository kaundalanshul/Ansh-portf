/**
 * Profile Controller
 * ──────────────────
 * Manages site content and profile settings.
 * Public: GET /api/profile
 * Admin: PUT /api/profile
 */

const Profile = require('../models/Profile');

/**
 * GET /api/profile
 * Public: Get site settings & profile content
 */
const getProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({});
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 * Admin: Update site settings & profile content
 */
const updateProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create(req.body);
    } else {
      Object.assign(profile, req.body);
      await profile.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
