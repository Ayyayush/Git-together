const express = require("express");
const chatRouter = express.Router();
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/ConnectionRequest");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");

// Fetching single direct conversation .....context profile metadata and records
chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { targetUserId } = req.params;

    const isConnected = await ConnectionRequest.findOne({
      status: "accepted",
      $or: [
        { fromUserId: loggedInUserId, toUserId: targetUserId },
        { fromUserId: targetUserId, toUserId: loggedInUserId },
      ],
    });

    if (!isConnected) {
      return res.status(403).json({
        success: false,
        message: "You are not connected with this user.",
      });
    }

    let chat = await Chat.findOne({
      participants: { $all: [loggedInUserId, targetUserId] },
    })
      .populate(
        "participants",
        "firstName lastName photoUrl emailId isOnline lastSeen",
      )
      .populate("messages.senderId", "firstName lastName photoUrl");

    if (!chat) {
      chat = await Chat.create({
        participants: [loggedInUserId, targetUserId],
        messages: [],
      });

      chat = await Chat.findById(chat._id)
        .populate(
          "participants",
          "firstName lastName photoUrl emailId isOnline lastSeen",
        )
        .populate("messages.senderId", "firstName lastName photoUrl");
    }

    const targetUser = chat.participants.find(
      (participant) => participant._id.toString() !== loggedInUserId.toString(),
    );

    return res.status(200).json({
      success: true,
      data: {
        targetUser,
        chat,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Fetch complete master list of conversations for logged-in structural user layout view
chatRouter.get("/chats/conversations", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const chats = await Chat.find({
      participants: loggedInUserId,
    })
      .populate(
        "participants",
        "firstName lastName photoUrl emailId isOnline lastSeen",
      )
      .populate("messages.senderId", "firstName lastName photoUrl")
      .sort({ updatedAt: -1 });


      // converting the chat docuemtns into frontend friendly structure
    const formattedConversations = chats
      .map((chat) => {
        const targetUser = chat.participants.find(
          (p) => p._id.toString() !== loggedInUserId.toString(),
        );

        if (!targetUser) return null;

        const unreadCount = chat.messages.reduce((acc, msg) => {
          if (
            msg.senderId._id.toString() !== loggedInUserId.toString() &&
            msg.status !== "seen"
          ) {
            return acc + 1;
          }
          return acc;
        }, 0);

        const lastMessage = chat.messages[chat.messages.length - 1] || null;

        return {
          chatId: chat._id,
          targetUser,
          lastMessage,
          unreadCount,
          updatedAt: chat.updatedAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: formattedConversations,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = chatRouter;
