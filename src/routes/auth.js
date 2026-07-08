const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password, username, age, gender } = req.body;

    if (!username) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Username is required"
      });
    }

    const sanitizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({ username: sanitizedUsername });
    if (existingUser) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Username is already taken"
      });
    }

    // Basic password hashing simulation based on common template logic
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      username: sanitizedUsername,
      age,
      gender
    });

    await user.save();
    return res.status(201).json({
      message: "User registered successfully",
      data: user
    });
  } catch (err) {
    return res.status(400).json({
      error: "Registration Failed",
      message: err.message
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = await user.getJWT();
    res.cookie("token", token, { expires: new Date(Date.now() + 7 * 24 * 3600 * 1000), httpOnly: true });
    return res.status(200).json({
      message: "Login successful",
      data: user
    });
  } catch (err) {
    return res.status(400).json({
      error: "Login Failed",
      message: err.message
    });
  }
});

module.exports = authRouter;