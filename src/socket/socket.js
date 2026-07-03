const { Server } = require("socket.io");
const Chat = require("../models/chat");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User Connected :", socket.id);

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const room = [userId, targetUserId].sort().join("_");

      socket.join(room);

      console.log(`${firstName} joined room ${room}`);
    });

    socket.on(
      "sendMessage",
      async ({ firstName, userId, targetUserId, text }) => {
        try {
          const room = [userId, targetUserId].sort().join("_");

          let chat = await Chat.findOne({
            participants: {
              $all: [userId, targetUserId],
            },
          });

          if (!chat) {
            chat = await Chat.create({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          chat.messages.push({
            senderId: userId,
            text,
          });

          await chat.save();

          // Populate latest message
          chat = await Chat.findById(chat._id).populate(
            "messages.senderId",
            "firstName lastName photoUrl"
          );

          const latestMessage = chat.messages[chat.messages.length - 1];

          io.to(room).emit("messageReceived", latestMessage);
        } catch (err) {
          console.error("Socket Error:", err);
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("User Disconnected :", socket.id);
    });
  });
};

module.exports = initializeSocket;