const express = require("express");
const requestRouter = express.Router();

const User = require("../models/user");
const ConnectionRequest = require("../models/ConnectionRequest");
const { userAuth } = require("../middlewares/auth");

// =================================================
// SEND CONNECTION REQUEST
// =================================================
requestRouter.post("/request/send/:toUserId", userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;

    if (fromUserId.equals(toUserId)) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const user = await User.findById(toUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await ConnectionRequest.findOne({ fromUserId, toUserId });
    if (existing) {
      return res.status(400).json({ message: "Request already sent" });
    }

    await ConnectionRequest.create({ fromUserId, toUserId });

    res.json({ message: "Connection request sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =================================================
// RECEIVED REQUESTS
// =================================================
requestRouter.get("/requests/received", userAuth, async (req, res) => {
  const requests = await ConnectionRequest.find({
    toUserId: req.user._id,
    status: "pending",
  }).populate("fromUserId", "firstName lastName photoUrl");

  res.json(requests);
});

// =================================================
// ACCEPT / REJECT
// =================================================
requestRouter.post("/request/respond/:requestId", userAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await ConnectionRequest.findOne({
      _id: req.params.requestId,
      toUserId: req.user._id,
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    await request.save();

    res.json({ message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =================================================
// MY CONNECTIONS
// =================================================
requestRouter.get("/connections", userAuth, async (req, res) => {
  const userId = req.user._id;

  const connections = await ConnectionRequest.find({
    status: "accepted",
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  }).populate("fromUserId toUserId", "firstName lastName photoUrl");

  const matches = connections.map((r) =>
    r.fromUserId._id.equals(userId) ? r.toUserId : r.fromUserId
  );

  res.json(matches);
});

module.exports = requestRouter;
