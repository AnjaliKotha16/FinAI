const { Notification } = require('../models/Notification');
const notificationService = require('../services/notificationService');
const { errorResponse } = require('../utils/apiResponse');
const { isValidObjectId } = require('../middleware/securityMiddleware');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for authenticated user
 * @access  Private (Authenticated User only)
 */
const getNotifications = async (req, res, next) => {
  try {
    // Proactively evaluate financial conditions to generate any new notifications
    await notificationService.evaluateAndGenerateUserNotifications(req.user._id);

    const { unreadOnly, limit } = req.query;
    const query = { user: req.user._id };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    let q = Notification.find(query).sort({ createdAt: -1 });

    if (limit && !isNaN(Number(limit))) {
      q = q.limit(Number(limit));
    }

    const notifications = await q;
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications for authenticated user
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    return res.status(200).json({
      success: true,
      count: unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Notification not found or unauthorized.');
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return errorResponse(res, 404, 'Notification not found or unauthorized.');
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications for authenticated user as read
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a single notification
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return errorResponse(res, 404, 'Notification not found or unauthorized.');
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return errorResponse(res, 404, 'Notification not found or unauthorized.');
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
