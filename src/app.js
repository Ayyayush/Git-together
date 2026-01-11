// ==========================
// Imports
// ==========================
const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const validateSignupData = require("./utils/validation");
const bcrypt = require("bcrypt");

// ==========================
// App Init
// ==========================
const app = express();
app.use(express.json());



// =================================================
// SIGNUP API
// =================================================
app.post("/signup", async (req, res) => {
    try {
        validateSignupData(req);

        const { firstName, lastName, emailId, password } = req.body;

        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            firstName,
            lastName,
            emailId,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



// =================================================
// LOGIN API
// =================================================
app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ emailId });

        if (!user || !user.password) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        res.json({
            message: "Login successful",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId
            }
        });

    } catch (err) {
        console.error("LOGIN ERROR 👉", err);
        res.status(500).json({ message: "Login failed" });
    }
});


// =================================================
// GET USER BY EMAIL
// =================================================
app.get("/user", async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ emailId: email }).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

    } catch (err) {
        res.status(500).json({ message: "Error fetching user" });
    }
});



// =================================================
// FEED (All users)
// =================================================
app.get("/feed", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users" });
    }
});



// =================================================
// DELETE USER
// =================================================
app.delete("/user/:userId", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Error deleting user" });
    }
});



// =================================================
// UPDATE USER
// =================================================
app.patch("/user/:userId", async (req, res) => {
    try {
        const updates = req.body;
        const ALLOWED = ["photoUrl", "gender", "age", "about", "skills"];

        const isAllowed = Object.keys(updates).every(k => ALLOWED.includes(k));
        if (!isAllowed) {
            return res.status(400).json({ message: "Invalid update fields" });
        }

        if (updates.skills && updates.skills.length > 10) {
            return res.status(400).json({ message: "Max 10 skills allowed" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            updates,
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User updated successfully", data: user });

    } catch (err) {
        res.status(500).json({ message: "Error updating user" });
    }
});



// =================================================
// Start Server After DB Connect
// =================================================
connectDB()
    .then(() => {
        console.log("Database connected");
        app.listen(7777, () => console.log("Server running on port 7777"));
    })
    .catch(err => {
        console.error("Database connection failed", err);
        process.exit(1);
    });
