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
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('technologies')
    .isArray({ min: 1 })
    .withMessage('At least one technology is required'),
  body('technologies.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Technology names cannot be empty'),
  body('imageUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('liveUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Live URL must be a valid URL'),
  body('githubUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('GitHub URL must be a valid URL'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  body('order')
    .optional()
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
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Frontend', 'Backend', 'Tools', 'Other'])
    .withMessage('Category must be Frontend, Backend, Tools, or Other'),
  body('proficiency')
    .isInt({ min: 1, max: 100 })
    .withMessage('Proficiency must be between 1 and 100'),
  body('icon')
    .optional({ values: 'falsy' })
    .isString()
    .trim(),
  body('order')
    .optional()
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
