/*
 * ==========================
 * User Routes
 * ==========================
 */

const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const User = require("../models/user"); // ✅ small u
const ConnectionRequest = require("../models/ConnectionRequest");

/*
 * =================================================
 * GET RECEIVED CONNECTION REQUESTS
 * =================================================
 */
userRouter.get("/user/requests", userAuth, async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({
      toUserId: req.user._id,
      status: "interested",
    }).populate("fromUserId", "firstName lastName photoUrl");

    res.json({
      message: "Connection requests fetched successfully",
      data: requests,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
 * =================================================
 * GET MY CONNECTIONS
 * =================================================
 */
userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const connections = await ConnectionRequest.find({
      status: "accepted",
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    }).populate("fromUserId toUserId", "firstName lastName photoUrl");

    const result = connections.map((conn) =>
      conn.fromUserId._id.equals(userId)
        ? conn.toUserId
        : conn.fromUserId
    );

    res.json({
      message: "Connections fetched successfully",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
 * =================================================
 * FEED API (WITH PAGINATION)
 * =================================================
 */
userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    /*
     * Pagination params
     */
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    /*
     * Find all interactions of logged-in user
     */
    const interactions = await ConnectionRequest.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    }).select("fromUserId toUserId");

    /*
     * Build ignored users list
     */
    const ignoredUsers = new Set();
    ignoredUsers.add(userId.toString());

    interactions.forEach((req) => {
      ignoredUsers.add(req.fromUserId.toString());
      ignoredUsers.add(req.toUserId.toString());
    });

    /*
     * Fetch feed users
     */
    const feedUsers = await User.find({
      _id: { $nin: Array.from(ignoredUsers) },
    })
      .select("firstName lastName photoUrl about skills")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      message: "Feed fetched successfully",
      page,
      limit,
      count: feedUsers.length,
      data: feedUsers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = userRouter;
