
const express = require("express");
const profileRouter = express.Router();

const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");


// WHITELIST OF EDITABLE FIELDS
const EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "photoUrl",
  "age",
  "gender",
  "about",
  "developerTitle",
  "college",
  "degree",
  "graduationYear",
  "company",
  "experienceLevel",
  "location",
  "portfolio",
  "resume",
  "github",
  "linkedin",
  "leetcode",
  "codeforces",
  "codechef",
  "hackerrank",
  "twitter",
  "website",
  "availability",
  "skills",
  "projects",
];


const NUMERIC_FIELDS = ["age", "graduationYear"];


profileRouter.get("/profile/view", userAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});


profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    // Step 1: Validate no protected fields are being edited
    const protectedFields = [
      "password",
      "emailId",
      "username",
      "_id",
      "isActive",
      "isPremium",
      "premiumType",
      "premiumExpiry",
      "razorpayOrderId",
      "razorpayPaymentId",
      "isOnline",
      "lastSeen",
      "resetPasswordToken",
      "resetPasswordExpires",
      "profileStrength", // Computed on backend only
      "createdAt",
      "updatedAt",
    ];

    const requestedFields = Object.keys(req.body);
    const attemptedProtectedFields = requestedFields.filter((field) =>
      protectedFields.includes(field)
    );

    if (attemptedProtectedFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit protected fields: ${attemptedProtectedFields.join(
          ", "
        )}`,
      });
    }

    // Step 2: Filter to only editable fields and cast types
    const fieldsToUpdate = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in req.body) {
        let value = req.body[field];

        // Type cast numeric fields
        if (NUMERIC_FIELDS.includes(field)) {
          if (value === null || value === "" || value === undefined) {
            value = undefined; // Allow clearing numeric fields
          } else {
            value = Number(value);
            if (isNaN(value)) {
              return res.status(400).json({
                success: false,
                message: `Invalid value for ${field}: must be a valid number`,
              });
            }
          }
        }

        fieldsToUpdate[field] = value;
      }
    }

    // Step 3: Validate skills and projects arrays
    if (fieldsToUpdate.skills !== undefined) {
      if (!Array.isArray(fieldsToUpdate.skills)) {
        return res.status(400).json({
          success: false,
          message: "skills must be an array",
        });
      }
      if (fieldsToUpdate.skills.length > 25) {
        return res.status(400).json({
          success: false,
          message: "Maximum 25 skills allowed",
        });
      }
      fieldsToUpdate.skills = fieldsToUpdate.skills.filter(
        (skill) => typeof skill === "string" && skill.trim().length > 0
      );
    }

    if (fieldsToUpdate.projects !== undefined) {
      if (!Array.isArray(fieldsToUpdate.projects)) {
        return res.status(400).json({
          success: false,
          message: "projects must be an array",
        });
      }
      // Ensure each project has techStack as array
      fieldsToUpdate.projects = fieldsToUpdate.projects.map((project) => ({
        ...project,
        techStack: Array.isArray(project.techStack)
          ? project.techStack
          : [],
      }));
    }

    // Step 4: Apply updates to user document
    Object.keys(fieldsToUpdate).forEach((field) => {
      req.user[field] = fieldsToUpdate[field];
    });

    // Step 5: Automatically recalculate profile strength before saving
    let score = 0;
    const user = req.user;

    if (
      user.photoUrl &&
      user.photoUrl !==
        "https://tse2.mm.bing.net/th/id/OIP.WLB7NRb9ayKYi7EQ1dAhgAAAAA?pid=Api&P=0&h=180"
    )
      score += 10;
    if (user.about && user.about !== "This is a default bio") score += 10;
    if (user.skills && user.skills.length > 0) score += 15;
    if (user.projects && user.projects.length > 0) score += 20;
    if (user.resume) score += 15;
    if (user.college || user.degree) score += 10;
    if (user.company || user.experienceLevel) score += 10;
    if (user.availability) score += 5;
    if (user.github || user.linkedin || user.portfolio) score += 5;

    user.profileStrength = Math.min(score, 100);

    // Step 6: Save to MongoDB (will trigger Mongoose validation)
    await user.save();

    // Step 7: Strip password and return updated user
    const safeUserData = user.toObject();
    delete safeUserData.password;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: safeUserData,
    });
  } catch (err) {
    // Return meaningful error message (Mongoose validation errors, etc)
    const message = err.message || "Profile update failed";
    res.status(400).json({
      success: false,
      message: message,
    });
  }
});

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


profileRouter.post("/profile/coach", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    if (!loggedInUser) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    const suggestions = await generateProfileSuggestions(loggedInUser);

    if (!suggestions) {
      return res.status(200).json({
        success: false,
        message: "Unable to generate suggestions right now.",
      });
    }

    return res.status(200).json({
      success: true,
      suggestions: suggestions,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: "Unable to generate suggestions right now.",
      error: error.message,
    });
  }
});


profileRouter.post("/profile/coach/chat", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    if (!loggedInUser) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    const { message, history, suggestions } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "A message is required." });
    }

    const safeHistory = Array.isArray(history) ? history.slice(-16) : [];

    const reply = await generateCoachChatReply(loggedInUser, suggestions, safeHistory, message.trim());

    if (reply === null) {
      return res.status(200).json({
        success: false,
        message: "Unable to reach the AI Coach right now.",
      });
    }

    return res.status(200).json({
      success: true,
      reply: reply,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: "Unable to reach the AI Coach right now.",
      error: error.message,
    });
  }
});

module.exports = profileRouter;