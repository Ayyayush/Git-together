/*
 * ==========================
 * Connection Request Routes
 * ==========================
 */

const express = require("express");
const requestRouter = express.Router();

const User = require("../models/user"); // ✅ FIXED
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
      if (fromUserId.toString() === toUserId) {
        return res.status(400).json({
          message: "You cannot send a request to yourself"
        });
      }

      /*
       * Check if target user exists
       */
      const targetUser = await User.findById(toUserId);
      if (!targetUser) {
        return res.status(404).json({
          message: "Target user not found"
        });
      }

      /*
       * Prevent duplicate OR reverse requests
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
       * Create new request
       */
      await ConnectionRequest.create({
        fromUserId,
        toUserId,
        status
      });

      res.status(201).json({
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
 * ACCEPT / REJECT CONNECTION REQUEST
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
       * Only receiver can review
       * Only 'interested' requests can be reviewed
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
        message: `Connection request ${status} successfully`
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      });
    }
  }
);

module.exports = requestRouter;
