const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password, username, age, gender } = req.body;

    // Basic validation
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

    if (!emailId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Email is required",
      });
    }

    const sanitizedUsername = username.trim().toLowerCase();
    const sanitizedEmail = emailId.trim().toLowerCase();

    // Check username before creating user
    const existingUsername = await User.findOne({
      username: sanitizedUsername,
    });

    if (existingUsername) {
      return res.status(409).json({
        error: "Conflict",
        message: "Username is already taken",
      });
    }

    // Check email before creating user
    const existingEmail = await User.findOne({
      emailId: sanitizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        error: "Conflict",
        message: "An account with this email already exists. Please log in instead.",
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      firstName,
      lastName,
      emailId: sanitizedEmail,
      password: passwordHash,
      username: sanitizedUsername,
      age,
      gender,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (err) {
    // Safety net for duplicate-key race conditions.
    // MongoDB unique indexes remain the final source of truth.
    if (err.code === 11000) {
      if (err.keyPattern?.emailId || err.keyValue?.emailId) {
        return res.status(409).json({
          error: "Conflict",
          message: "An account with this email already exists. Please log in instead.",
        });
      }

      if (err.keyPattern?.username || err.keyValue?.username) {
        return res.status(409).json({
          error: "Conflict",
          message: "Username is already taken",
        });
      }

      return res.status(409).json({
        error: "Conflict",
        message: "An account with these details already exists.",
      });
    }

    return res.status(400).json({
      error: "Registration Failed",
      message: err.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({
        error: "Login Failed",
        message: "Email and password are required",
      });
    }

    const sanitizedEmail = emailId.trim().toLowerCase();

    const user = await User.findOne({
      emailId: sanitizedEmail,
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = await user.getJWT();

    res.cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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

    const existingUser = await User.findOne({
      username: sanitizedUsername,
    });

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