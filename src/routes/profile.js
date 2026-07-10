// routes/profile.js

const express = require("express");
const profileRouter = express.Router();

const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");
const { generateProfileSuggestions } = require("../services/profileCoach");

// =================================================
// GET PROFILE
// =================================================
profileRouter.get("/profile/view", userAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

// =================================================
// UPDATE PROFILE
// =================================================
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    validateEditProfileData(req);

    // Dynamic field update mapping directly to data model
    const fieldsToUpdate = Object.keys(req.body);
    fieldsToUpdate.forEach((field) => {
      req.user[field] = req.body[field];
    });

    // Automatically recalculate profile strength before saving
    let score = 0;
    const user = req.user;

    if (user.photoUrl && user.photoUrl !== "https://tse2.mm.bing.net/th/id/OIP.WLB7NRb9ayKYi7EQ1dAhgAAAAA?pid=Api&P=0&h=180") score += 10;
    if (user.about && user.about !== "This is a default bio") score += 10;
    if (user.skills && user.skills.length > 0) score += 15;
    if (user.projects && user.projects.length > 0) score += 20;
    if (user.resume) score += 15;
    if (user.college || user.degree) score += 10;
    if (user.company || user.experienceLevel) score += 10;
    if (user.availability) score += 5;
    if (user.github || user.linkedin || user.portfolio) score += 5;

    user.profileStrength = Math.min(score, 100);

    await user.save();

    // Strip password out from payload safely
    const safeUserData = user.toObject();
    delete safeUserData.password;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: safeUserData,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

// =================================================
// ADMIN FEED
// =================================================
profileRouter.get("/admin/feed", userAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =================================================
// POST /profile/coach
// =================================================
profileRouter.post("/profile/coach", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    if (!loggedInUser) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    const suggestions = await generateProfileSuggestions(loggedInUser);

    return res.status(200).json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: "Unable to generate suggestions right now.",
      error: error.message
    });
  }
});

module.exports = profileRouter;