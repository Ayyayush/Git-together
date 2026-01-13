const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = "gittogether_super_secret";   // MUST match app.js

const userAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ message: "Not logged in" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({
            error: "Unauthorized",
            message: err.message
        });
    }
};

module.exports = { userAuth };
