const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/ConnectionRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Emit structural utility to forward realtime events cleanly if user sockets match
const emitToUser = (userId, event, data) => {
  const globalIo = global.ioInstance;
  const globalUserSockets = global.userSocketsMap;
  if (globalIo && globalUserSockets && globalUserSockets.has(userId.toString())) {
    const targetSockets = globalUserSockets.get(userId.toString());
    targetSockets.forEach((sId) => {
      globalIo.to(sId).emit(event, data);
    });
  }
};

requestRouter.post(
  "/request/send/interested/:userId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.userId;

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingConnectionRequest) {
        return res
          .status(400)
          .json({ message: "Connection Request Already Exists!" });
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status: "interested",
      });

      const data = await connectionRequest.save();

      // Automatically construct structural Connection Request Notification safely
      const titleText = "New Connection Request";
      const messageText = `${req.user.firstName || "Someone"} sent you a connection request`;
      
      const newNotification = await Notification.create({
        receiver: toUserId,
        sender: fromUserId,
        type: "connection_request",
        title: titleText,
        message: messageText,
        link: "/request",
        isRead: false,
      });

      const populatedNotification = await Notification.findById(newNotification._id)
        .populate("sender", "firstName lastName photoUrl emailId");

      // Push real-time network payload frame instantly down the pipe
      emitToUser(toUserId, "new-notification", populatedNotification);

      res.json({
        message: req.user.firstName + " is interested in " + toUser.firstName,
        data,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

module.exports = requestRouter;