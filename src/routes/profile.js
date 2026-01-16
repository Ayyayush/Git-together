const express = require("express");
const profileRouter = express.Router();

const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const {
  validateEditProfileData
} = require("../utils/validation");

// =================================================
// GET PROFILE
// =================================================
profileRouter.get("/profile/view", userAuth, (req, res) => {
  res.json(req.user);
});

// =================================================
// UPDATE PROFILE
// =================================================
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    /*
     * ✅ Validate allowed fields
     */
    validateEditProfileData(req);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
});


// =================================================
// FEED to see users in database just to chek my data while i am building my site 
// changing it's name to something ele to avoid confusio 
// ye ai sabo nhi avaible oni chaiye ye toh bas mi build kr ra toh mujhe avaible h 
// =================================================
profileRouter.get("/admin/feed", userAuth, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

module.exports = profileRouter;
