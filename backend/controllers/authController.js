/**
 * Auth Controller
 * ───────────────
 * Handles admin authentication (login and profile).
 */

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Generate a JWT token for an admin user
 * @param {string} id - Admin user's MongoDB _id
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

/**
 * POST /api/auth/login
 * Authenticate admin and return JWT token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token and respond
    const token = generateToken(admin._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Return the currently authenticated admin's profile
 * (Protected route — requires auth middleware)
 */
const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.admin._id,
      email: req.admin.email,
    },
  });
};

/**
 * PUT /api/auth/profile
 * Update admin profile (email, password)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const adminId = req.admin.id;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found',
      });
    }

    // Check if email is already in use
    if (email && email.toLowerCase() !== admin.email) {
      const emailExists = await Admin.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }
      admin.email = email.toLowerCase();
    }

    // Update password if provided
    if (password) {
      admin.password = password;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getProfile, updateProfile };
