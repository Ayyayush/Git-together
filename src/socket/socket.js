const { Server } = require("socket.io");
const Chat = require("../models/chat");
const User = require("../models/User");
const Notification = require("../models/Notification");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://git-together-frontend-nu.vercel.app",
      ],
      credentials: true,
    },
  });

  // Track connected users globally: userId -> set of socketIds
  const userSockets = new Map();
  
  // Attach objects to server global scopes to dynamically resolve cross-router dependencies cleanly
  global.ioInstance = io;
  global.userSocketsMap = userSockets;

  io.on("connection", (socket) => {
    let currentUserId = null;

    socket.on("userConnected", async ({ userId }) => {
      if (!userId) return;
      currentUserId = userId;
      
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("userStatusChanged", { userId, isOnline: true, lastSeen: new Date() });
    });

    socket.on("joinChat", async ({ userId, targetUserId }) => {
      const room = [userId, targetUserId].sort().join("_");
      socket.join(room);

      // Mark messages from target user as seen when joining room
      try {
        const chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] }
        });

        if (chat) {
          let updated = false;
          chat.messages.forEach((msg) => {
            if (msg.senderId.toString() !== userId.toString() && msg.status !== "seen") {
              msg.status = "seen";
              msg.seen = true;
              updated = true;
            }
          });
          if (updated) {
            await chat.save();
            io.to(room).emit("messagesSeen", { roomId: room, seenBy: userId });
            
            // Also notify target user globally to clear badge counters
            const targetSockets = userSockets.get(targetUserId);
            if (targetSockets) {
              targetSockets.forEach(sId => {
                io.to(sId).emit("conversationUpdated");
              });
            }
          }
        }
      } catch (err) {
        console.error("Error updates on joinChat:", err);
      }
    });

    socket.on("sendMessage", async ({ firstName, userId, targetUserId, text }) => {
      try {
        const room = [userId, targetUserId].sort().join("_");
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat) {
          chat = await Chat.create({
            participants: [userId, targetUserId],
            messages: [],
          });
        }

        const targetRoomSockets = io.sockets.adapter.rooms.get(room);
        const isTargetInRoom = targetRoomSockets ? targetRoomSockets.size > 1 : false;
        const initialStatus = isTargetInRoom ? "seen" : (userSockets.has(targetUserId) ? "delivered" : "sent");

        const newMsgObj = {
          senderId: userId,
          text,
          status: initialStatus,
          seen: isTargetInRoom
        };

        chat.messages.push(newMsgObj);
        await chat.save();

        const fullyPopulatedChat = await Chat.findById(chat._id).populate(
          "messages.senderId",
          "firstName lastName photoUrl"
        );

        const latestMessage = fullyPopulatedChat.messages[fullyPopulatedChat.messages.length - 1];

        // Broadcast to specific chat room
        io.to(room).emit("messageReceived", latestMessage);

        // Notify target user globally to update recent conversation item dynamic view
        const targetSockets = userSockets.get(targetUserId);
        if (targetSockets) {
          targetSockets.forEach(sId => {
            io.to(sId).emit("conversationUpdated", { latestMessage });
          });
        }

        // Structural modification: Fire message notifications if and only if target user is absent from chat room
        if (!isTargetInRoom) {
          const senderUserRecord = await User.findById(userId).select("firstName lastName photoUrl");
          const senderFullName = `${senderUserRecord?.firstName || "Someone"} ${senderUserRecord?.lastName || ""}`.trim();
          
          const msgNotification = await Notification.create({
            receiver: targetUserId,
            sender: userId,
            type: "message",
            title: "New Message",
            message: `${senderFullName}: ${text.length > 60 ? text.substring(0, 57) + "..." : text}`,
            link: "/chat",
            isRead: false,
          });

          const fullyPopulatedNotification = await Notification.findById(msgNotification._id)
            .populate("sender", "firstName lastName photoUrl emailId");

          if (targetSockets) {
            targetSockets.forEach(sId => {
              io.to(sId).emit("new-notification", fullyPopulatedNotification);
            });
          }
        }
      } catch (err) {
        console.error("Socket Error:", err);
      }
    });

    socket.on("typing", ({ userId, targetUserId, isTyping }) => {
      const room = [userId, targetUserId].sort().join("_");
      socket.to(room).emit("userTyping", { userId, isTyping });
    });

    socket.on("markAsSeen", async ({ userId, targetUserId }) => {
      try {
        const room = [userId, targetUserId].sort().join("_");
        const chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] }
        });
        if (chat) {
          let modified = false;
          chat.messages.forEach(m => {
            if (m.senderId.toString() !== userId.toString() && m.status !== "seen") {
              m.status = "seen";
              m.seen = true;
              modified = true;
            }
          });
          if (modified) {
            await chat.save();
            io.to(room).emit("messagesSeen", { roomId: room, seenBy: userId });
          }
        }
      } catch (err) {
        console.error("Error setting markAsSeen:", err);
      }
    });

    socket.on("disconnect", async () => {
      if (currentUserId && userSockets.has(currentUserId)) {
        const sockets = userSockets.get(currentUserId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(currentUserId);
          const disconnectTime = new Date();
          await User.findByIdAndUpdate(currentUserId, { isOnline: false, lastSeen: disconnectTime });
          io.emit("userStatusChanged", { userId: currentUserId, isOnline: false, lastSeen: disconnectTime });
        }
      }
    });
  });
};

module.exports = initializeSocket;