/**
 * Validation Middleware
 * ────────────────────
 * Input validation rules using express-validator.
 * Exports validation chains and a handler to catch errors.
 */

const { body, validationResult } = require('express-validator');

/**
 * Middleware to check for validation errors and return them
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

/* ── Validation Rules ──────────────────────────── */

/** Login validation */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

/** Project validation */
const validateProject = [
  body('title')
    .trim()
    .customSanitizer((val) => (!val || val === '') ? 'Untitled Project' : val)
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('technologies')
    .optional()
    .custom((val) => {
      if (val === undefined || val === null || val === '') return true;
      if (!Array.isArray(val)) throw new Error('Technologies must be an array');
      return true;
    }),
  body('imageUrl')
    .optional({ values: 'falsy' })
    .custom((val) => {
      if (typeof val !== 'string') return false;
      const trimmed = val.trim();
      if (!trimmed) return true;
      const isHttpUrl = /^(https?:\/\/)/i.test(trimmed);
      const isDataUrl = /^data:image\/[a-zA-Z0-9\+\/\=\-\_\.]+;base64,/i.test(trimmed);
      // Allow relative paths, image filenames with spaces/extensions
      const isPathOrFilename = /^[\w\.\-\/\s\\]+$/i.test(trimmed);
      if (isHttpUrl || isDataUrl || isPathOrFilename) return true;
      return true; // Graceful fallback
    }),
  body('liveUrl')
    .optional({ values: 'falsy' })
    .custom((val) => {
      if (!val || typeof val !== 'string' || !val.trim()) return true;
      return true;
    }),
  body('githubUrl')
    .optional({ values: 'falsy' })
    .custom((val) => {
      if (!val || typeof val !== 'string' || !val.trim()) return true;
      return true;
    }),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  body('order')
    .optional()
    .customSanitizer(val => val === '' || val === null ? 0 : val)
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  handleValidationErrors,
];

/** Skill validation */
const validateSkill = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Skill name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('category')
    .optional({ values: 'falsy' })
    .isIn(['Frontend', 'Backend', 'Tools', 'Other'])
    .withMessage('Category must be Frontend, Backend, Tools, or Other'),
  body('proficiency')
    .optional({ values: 'falsy' })
    .customSanitizer(val => val === '' || val === null ? 50 : val)
    .isInt({ min: 1, max: 100 })
    .withMessage('Proficiency must be between 1 and 100'),
  body('icon')
    .optional({ values: 'falsy' })
    .isString()
    .trim(),
  body('order')
    .optional()
    .customSanitizer(val => val === '' || val === null ? 0 : val)
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  handleValidationErrors,
];

/** Contact message validation */
const validateMessage = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),
  handleValidationErrors,
];

/** Profile update validation */
const validateProfileUpdate = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

module.exports = {
  validateLogin,
  validateProject,
  validateSkill,
  validateMessage,
  validateProfileUpdate,
  handleValidationErrors,
};
