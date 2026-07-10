const express = require("express");
const notificationRouter = express.Router();
const Notification = require("../models/Notification");
const { userAuth } = require("../middlewares/auth");

// Fetch structured notifications grouped chronologically with unread aggregate count
// Final Route: GET /notifications
notificationRouter.get("/", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const notifications = await Notification.find({ receiver: loggedInUserId })
      .populate("sender", "firstName lastName photoUrl emailId")
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      receiver: loggedInUserId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Mark all global incoming unread notifications as read
// Final Route: PATCH /notifications/read-all
notificationRouter.patch("/read-all", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    await Notification.updateMany(
      { receiver: loggedInUserId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read smoothly.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Mark single notification item record as read
// Final Route: PATCH /notifications/:id/read
notificationRouter.patch("/:id/read", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, receiver: loggedInUserId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = notificationRouter;