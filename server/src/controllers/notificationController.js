import Notification from "../models/Notification.js";

// Get all notifications for the current user (most recent 50)
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// Mark a single notification as read
export const markRead = async (req, res, next) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Mark ALL as read
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Internal helper — create a notification and emit it via socket if io is available
export const createNotification = async ({ userId, type, title, message, priority = "medium", projectId, taskId, workspaceId, actorId, actorName, io }) => {
  try {
    const notif = await Notification.create({ user: userId, type, title, message, priority, projectId, taskId, workspaceId, actorId, actorName });
    // Push to user's personal socket room if io is provided
    if (io) {
      io.to(`user:${userId}`).emit("notification:new", notif);
    }
    return notif;
  } catch (err) {
    console.error("[notification] Failed to create notification:", err.message);
    return null;
  }
};
