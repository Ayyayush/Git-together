const express = require("express");

const chatRouter = express.Router();

const Chat = require("../models/chat");
const ConnectionRequest = require("../models/ConnectionRequest");

const { userAuth } = require("../middlewares/auth");

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { targetUserId } = req.params;

    const isConnected = await ConnectionRequest.findOne({
      status: "accepted",
      $or: [
        {
          fromUserId: loggedInUserId,
          toUserId: targetUserId,
        },
        {
          fromUserId: targetUserId,
          toUserId: loggedInUserId,
        },
      ],
    });

    if (!isConnected) {
      return res.status(403).json({
        success: false,
        message: "You are not connected with this user.",
      });
    }

    let chat = await Chat.findOne({
      participants: {
        $all: [loggedInUserId, targetUserId],
      },
    })
      .populate(
        "participants",
        "firstName lastName photoUrl"
      )
      .populate(
        "messages.senderId",
        "firstName lastName photoUrl"
      );

    if (!chat) {
      chat = await Chat.create({
        participants: [loggedInUserId, targetUserId],
        messages: [],
      });

      chat = await Chat.findById(chat._id)
        .populate(
          "participants",
          "firstName lastName photoUrl"
        )
        .populate(
          "messages.senderId",
          "firstName lastName photoUrl"
        );
    }

    const targetUser = chat.participants.find(
      (participant) =>
        participant._id.toString() !== loggedInUserId.toString()
    );

    return res.status(200).json({
      success: true,
      data: {
        targetUser,
        chat,
      },
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = chatRouter;