/**
 * Message Controller
 * ──────────────────
 * Handles contact form submissions and admin message management.
 * Public: POST (submit message)
 * Admin: GET (list), PATCH (mark read), DELETE
 */

const Message = require('../models/Message');

/**
 * POST /api/messages
 * Public: Submit a contact form message
 */
const createMessage = async (req, res, next) => {
  try {
    const message = await Message.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! I will get back to you soon.',
      data: { id: message._id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/messages
 * Admin: List all messages (unread first, newest first)
 */
const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ read: 1, createdAt: -1 });

    // Count unread messages
    const unreadCount = await Message.countDocuments({ read: false });

    res.json({
      success: true,
      count: messages.length,
      unreadCount,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/messages/:id/read
 * Admin: Toggle the read status of a message
 */
const toggleReadStatus = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Toggle read status
    message.read = !message.read;
    await message.save();

    res.json({
      success: true,
      message: `Message marked as ${message.read ? 'read' : 'unread'}`,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/messages/:id
 * Admin: Delete a message
 */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMessage,
  getMessages,
  toggleReadStatus,
  deleteMessage,
};
