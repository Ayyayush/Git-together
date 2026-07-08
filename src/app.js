// ==========================
// Environment Variables
// ==========================
require("dotenv").config();

// ==========================
// Imports
// ==========================
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const cors = require("cors");
const http = require("http");

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
// App Init
// ==========================
const app = express();

const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// ==========================
// CORS Configuration
// ==========================
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://git-together-frontend-nu.vercel.app"
    ],
    credentials: true
}));

// ==========================
// Middlewares
// ==========================
app.use(express.json());
app.use(cookieParser());

// ==========================
// Routes Mounting
// ==========================
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", paymentRouter);
app.use("/", notificationRouter);

// ==========================
// Start Server
// ==========================
connectDB()
  .then(() => {
    console.log("Database connected");

    server.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed", err);
    process.exit(1);
  });