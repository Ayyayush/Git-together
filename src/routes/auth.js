const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      emailId,
      password,
      username,
      age,
      gender,
    } = req.body;

    // BASIC VALIDATION 

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "First name is required",
      });
    }

    if (firstName.trim().length < 2) {
      return res.status(400).json({
        error: "Bad Request",
        message: "First name must be at least 2 characters long",
      });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Username is required",
      });
    }

    if (!emailId || !emailId.trim()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Password is required",
      });
    }

  
    const sanitizedUsername = username.trim().toLowerCase();
    const sanitizedEmail = emailId.trim().toLowerCase();

    
    const usernameRegex = /^[a-z0-9_]+$/;

    if (
      sanitizedUsername.length < 3 ||
      sanitizedUsername.length > 30 ||
      !usernameRegex.test(sanitizedUsername)
    ) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Username must be 3-30 characters and contain only lowercase letters, numbers, and underscores.",
      });
    }

   

    // Intentionally restricted to common signup email characters.
    // Rejects values such as...himanshuvarshney600#@gmail.com
    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please enter a valid email address",
      });
    }

   

    // Validating the RAW password here... before bcrypt hashing.
    if (password.length < 8) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Password must be at least 8 characters long",
      });
    }


    const existingUsername = await User.findOne({
      username: sanitizedUsername,
    });

    if (existingUsername) {
      return res.status(409).json({
        error: "Conflict",
        message: "Username is already taken",
      });
    }


    const existingEmail = await User.findOne({
      emailId: sanitizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        error: "Conflict",
        message:
          "An account with this email already exists. Please log in instead.",
      });
    }



    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);


    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
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
    /*
     * MongoDB duplicate-key safety net.
     * Handles race conditions where two signup requests
     * reach MongoDB at nearly the same time
     */
    if (err.code === 11000) {
      if (err.keyPattern?.emailId || err.keyValue?.emailId) {
        return res.status(409).json({
          error: "Conflict",
          message:
            "An account with this email already exists. Please log in instead.",
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





// login
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
      return res.status(400).json({
        error: "Login Failed",
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({
        error: "Login Failed",
        message: "Invalid credentials",
      });
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

    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Username must be at least 3 characters",
      });
    }

    const sanitizedUsername = username.trim().toLowerCase();

    const usernameRegex = /^[a-z0-9_]+$/;

    if (
      sanitizedUsername.length > 30 ||
      !usernameRegex.test(sanitizedUsername)
    ) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Username can contain only lowercase letters, numbers, and underscores",
      });
    }

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