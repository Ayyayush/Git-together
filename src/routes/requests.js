const express = require("express");
const requestRouter = express.Router();

const User = require("../models/user");
const ConnectionRequest = require("../models/ConnectionRequest");
const { userAuth } = require("../middlewares/auth");

/*
 * =================================================
 * SEND CONNECTION REQUEST (interested / ignored)
 * =================================================
 */
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const { toUserId, status } = req.params;

      /*
       * Allowed statuses while sending request
       */
      if (!["interested", "ignored"].includes(status)) {
        return res.status(400).json({
          message: "Invalid request status"
        });
      }

      /*
       * Cannot send request to yourself
       */
      if (fromUserId.equals(toUserId)) {
        return res.status(400).json({
          message: "Cannot send request to yourself"
        });
      }

      /*
       * Check if target user exists
       */
      const user = await User.findById(toUserId);
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      /*
       * Prevent duplicate requests
       */
      const existingRequest =
        await ConnectionRequest.findOne({
          fromUserId,
          toUserId
        });

      if (existingRequest) {
        return res.status(400).json({
          message: "Request already sent"
        });
      }

      /*
       * Create request
       */
      await ConnectionRequest.create({
        fromUserId,
        toUserId,
        status
      });

      res.json({
        message: `Connection request ${status} successfully`
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
 * GET RECEIVED REQUESTS
 * =================================================
 */
requestRouter.get(
  "/requests/received",
  userAuth,
  async (req, res) => {
    const requests =
      await ConnectionRequest.find({
        toUserId: req.user._id,
        status: "interested"
      }).populate(
        "fromUserId",
        "firstName lastName photoUrl"
      );

    res.json(requests);
  }
);

/*
 * =================================================
 * ACCEPT / REJECT REQUEST
 * =================================================
 */
requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const { status, requestId } = req.params;

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({
          message: "Invalid review status"
        });
      }

      const request =
        await ConnectionRequest.findOne({
          _id: requestId,
          toUserId: req.user._id
        });

      if (!request) {
        return res.status(404).json({
          message: "Request not found"
        });
      }

      request.status = status;
      await request.save();

      res.json({
        message: `Request ${status}`
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
requestRouter.get(
  "/connections",
  userAuth,
  async (req, res) => {
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

    const matches = connections.map((req) =>
      req.fromUserId._id.equals(userId)
        ? req.toUserId
        : req.fromUserId
    );

    res.json(matches);
  }
);

module.exports = requestRouter;
