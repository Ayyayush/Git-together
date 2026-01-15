/*
 * ==========================
 * Connection Request Routes
 * ==========================
 */

const express = require("express");
const requestRouter = express.Router();

const User = require("../models/User");
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
       * Allowed statuses
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
       * Prevent duplicate / reverse requests
       */
      const existingRequest =
        await ConnectionRequest.findOne({
          $or: [
            { fromUserId, toUserId },
            { fromUserId: toUserId, toUserId: fromUserId }
          ]
        });

      if (existingRequest) {
        return res.status(400).json({
          message: "Connection request already exists"
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
 * ACCEPT / REJECT REQUEST
 * =================================================
 */
requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const { status, requestId } = req.params;

      /*
       * Allowed review statuses
       */
      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({
          message: "Invalid review status"
        });
      }

      /*
       * Only interested requests can be reviewed
       */
      const request =
        await ConnectionRequest.findOne({
          _id: requestId,
          toUserId: req.user._id,
          status: "interested"
        });

      if (!request) {
        return res.status(404).json({
          message: "Request not found or already reviewed"
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

module.exports = requestRouter;
