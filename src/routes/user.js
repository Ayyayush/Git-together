/*
 * ==========================
 * User Routes (Read APIs)
 * ==========================
 */

const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/ConnectionRequest");

/*
 * =================================================
 * GET RECEIVED CONNECTION REQUESTS
 * =================================================
 */
userRouter.get(
  "/user/requests",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;

      const connectionRequests =
        await ConnectionRequest.find({
          toUserId: loggedInUser._id,
          status: "interested"
        }).populate(
          "fromUserId",
          "firstName lastName photoUrl"
        );

      res.json({
        message: "Connection requests fetched successfully",
        data: connectionRequests
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);

/*
 * =================================================
 * GET MY CONNECTIONS
 * =================================================
 */
userRouter.get(
  "/user/connections",
  userAuth,
  async (req, res) => {
    try {
      const userId = req.user._id;

      const connections =
        await ConnectionRequest.find({
          status: "accepted",
          $or: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        }).populate(
          "fromUserId toUserId",
          "firstName lastName photoUrl"
        );

      const matches = connections.map((connection) =>
        connection.fromUserId._id.equals(userId)
          ? connection.toUserId
          : connection.fromUserId
      );

      res.json({
        message: "Connections fetched successfully",
        data: matches
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);

module.exports = userRouter;
