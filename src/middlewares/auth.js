const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token missing"
      });
    }

    // ⚠️ SAME SECRET AS user.js - Use env variable with fallback for local dev
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "DEVtinder$790");

    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not found"
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Unauthorized",
      message: err.message
    });
  }
};

module.exports = { userAuth };