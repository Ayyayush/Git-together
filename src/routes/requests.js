const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/ConnectionRequest");
const User = require("../models/user");
const Notification = require("../models/Notification");

// Emit structural utility to forward realtime events cleanly if user sockets match
const emitToUser = (userId, event, data) => {
  const globalIo = global.ioInstance;
  const globalUserSockets = global.userSocketsMap;
  if (
    globalIo &&
    globalUserSockets &&
    globalUserSockets.has(userId.toString())
  ) {
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

      const populatedNotification = await Notification.findById(
        newNotification._id,
      ).populate("sender", "firstName lastName photoUrl emailId");

      // Push real-time network payload frame instantly down the pipe
      emitToUser(toUserId, "new-notification", populatedNotification);

      res.json({
        message: req.user.firstName + " is interested in " + toUser.firstName,
        data,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  },
);

requestRouter.post(
  "/request/accept/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const { requestId } = req.params;

      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUserId,
        status: "interested",
      });

      if (!connectionRequest) {
        return res
          .status(404)
          .json({ message: "Connection Request not found or access denied" });
      }

      connectionRequest.status = "accepted";
      await connectionRequest.save();

      // Create notification for the requester
      const titleText = "Connection Accepted";
      const messageText = `${req.user.firstName || "Someone"} accepted your connection request`;

      const newNotification = await Notification.create({
        receiver: connectionRequest.fromUserId,
        sender: loggedInUserId,
        type: "connection_accepted",
        title: titleText,
        message: messageText,
        link: "/connection",
        isRead: false,
      });

      const populatedNotification = await Notification.findById(
        newNotification._id
      ).populate("sender", "firstName lastName photoUrl emailId");

      emitToUser(connectionRequest.fromUserId, "new-notification", populatedNotification);

      res.json({
        message: "Connection Request Accepted",
        data: connectionRequest,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

requestRouter.post(
  "/request/reject/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const { requestId } = req.params;

      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUserId,
        status: "interested",
      });

      if (!connectionRequest) {
        return res
          .status(404)
          .json({ message: "Connection Request not found or access denied" });
      }

      await ConnectionRequest.deleteOne({ _id: requestId });

      res.json({
        message: "Connection Request Rejected",
        data: { _id: requestId },
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

requestRouter.post(
  "/request/send/collaborate/:userId",
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

      // Create notification for collaborate action
      const titleText = "Collaboration Request";
      const messageText = `${req.user.firstName || "Someone"} wants to collaborate with you`;

      const newNotification = await Notification.create({
        receiver: toUserId,
        sender: fromUserId,
        type: "collaboration_request",
        title: titleText,
        message: messageText,
        link: "/request",
        isRead: false,
      });

      const populatedNotification = await Notification.findById(
        newNotification._id
      ).populate("sender", "firstName lastName photoUrl emailId");

      emitToUser(toUserId, "new-notification", populatedNotification);

      res.json({
        message: req.user.firstName + " wants to collaborate with " + toUser.firstName,
        data,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

module.exports = requestRouter;
