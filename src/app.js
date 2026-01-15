// ==========================
// Imports
// ==========================
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");

// Routes
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");

// ==========================
// App Init
// ==========================
const app = express();
app.use(express.json());
app.use(cookieParser());

// ==========================
// Routes Mounting
// ==========================
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

// ==========================
// Start Server
// ==========================
connectDB()
  .then(() => {
    console.log("Database connected");
    app.listen(7777, () =>
      console.log("Server running on port 7777")
    );
  })
  .catch((err) => {
    console.error("DB connection failed", err);
    process.exit(1);
  });
