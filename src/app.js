// ==========================
// Environment Variables
// ==========================
require("dotenv").config();

// ==========================
// Imports
// ==========================
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");

const connectDB = require("./config/database");
const initializeSocket = require("./socket/socket");

// Routes
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const paymentRouter = require("./routes/payment");
const notificationRouter = require("./routes/notification");

// ==========================
// App Initialization
// ==========================
const app = express();
const server = http.createServer(app);

// ==========================
// Socket.io
// ==========================
initializeSocket(server);


// ==========================
// CORS Configuration
// ==========================
// Always allow local development + Docker frontend
const allowedOrigins = [
  "http://localhost:5173", // Vite development
  "http://localhost:5175", // Docker frontend
];

// Add production frontend URL(s) from .env
if (process.env.CLIENT_URL) {
  const envOrigins = process.env.CLIENT_URL
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  allowedOrigins.push(...envOrigins);
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, curl and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(`CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


// ==========================
// Middlewares
// ==========================
app.use(express.json());
app.use(cookieParser());

// ==========================
// Health Check
// ==========================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GitTogether Backend is running",
  });
});

// ==========================
// Routes
// ==========================
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", paymentRouter);
app.use("/notifications", notificationRouter);

// ==========================
// 404 Handler
// ==========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 7777;

connectDB()
  .then(() => {
    console.log("Database connected successfully.");

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });