const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password, username, age, gender } = req.body;

    // 1. Fixed validation order: Check password before hashing to avoid crashing on undefined
    if (!password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Password is required",
      });
    }

    if (!username) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Username is required",
      });
    }

    const sanitizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({ username: sanitizedUsername });
    if (existingUser) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Username is already taken",
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      username: sanitizedUsername,
      age,
      gender,
    });

    await user.save();
    return res.status(201).json({
      message: "User registered successfully",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      error: "Registration Failed",
      message: err.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    
    // 2. Fixed input validation: Guard against missing credentials
    if (!emailId || !password) {
      return res.status(400).json({
        error: "Login Failed",
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // 3. Schema Methods: Ensure user.validatePassword and user.getJWT are defined in your Mongoose schema
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = await user.getJWT();
    
    // 4. Fixed indentation for cookie setup
    res.cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Cleaned up the math readability
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Note: Lowercase values are standard for sameSite
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      error: "Login Failed",
      message: err.message,
    });
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

authRouter.get("/auth/check-username", async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.length < 3) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Username must be at least 3 characters",
      });
    }

    const sanitizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({ username: sanitizedUsername });
    if (existingUser) {
      return res.status(200).json({
        available: false,
        message: "Username is already taken",
      });
    }

    return res.status(200).json({
      available: true,
      message: "Username is available",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  }
});

module.exports = authRouter;