// ==========================
// Imports
// ==========================
const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const ConnectionRequest = require("./models/ConnectionRequest");
const validateSignupData = require("./utils/validation");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { userAuth } = require("./middlewares/auth");

// ==========================
// App Init
// ==========================
const app = express();
app.use(express.json());
app.use(cookieParser());



// =================================================
// SIGNUP
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

        await User.create({
            firstName,
            lastName,
            emailId,
            password: hashedPassword
        });

        res.status(201).json({ message: "User registered successfully" });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});



// =================================================
// LOGIN (CLEAN + MODEL-DRIVEN)
// =================================================
app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        /*
         * ✅ Password validation via schema method
         */
        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        /*
         * ✅ JWT via schema method
         */
        const token = await user.getJWT();

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            message: "Login successful",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// =================================================
// PROFILE
// =================================================
app.get("/profile", userAuth, (req, res) => {
    res.json(req.user);
});


// =================================================
// FEED
// =================================================
app.get("/feed", userAuth, async (req, res) => {
    const users = await User.find().select("-password");
    res.json(users);
});


// =================================================
// UPDATE PROFILE
// =================================================
app.patch("/user/me", userAuth, async (req, res) => {
    try {
        const ALLOWED = ["photoUrl", "gender", "age", "about", "skills"];
        const updates = req.body;

        const isAllowed = Object.keys(updates).every(k => ALLOWED.includes(k));
        if (!isAllowed) {
            return res.status(400).json({ message: "Invalid update fields" });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select("-password");

        res.json({ message: "Updated successfully", user });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// =================================================
// SEND CONNECTION REQUEST
// =================================================
app.post("/request/send/:toUserId", userAuth, async (req, res) => {
    try {
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;

        if (fromUserId.equals(toUserId)) {
            return res.status(400).json({ message: "Cannot send request to yourself" });
        }

        const targetUser = await User.findById(toUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const existing = await ConnectionRequest.findOne({ fromUserId, toUserId });
        if (existing) {
            return res.status(400).json({ message: "Request already sent" });
        }

        await ConnectionRequest.create({ fromUserId, toUserId });

        res.json({ message: "Connection request sent" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// =================================================
// VIEW RECEIVED REQUESTS
// =================================================
app.get("/requests/received", userAuth, async (req, res) => {
    const requests = await ConnectionRequest.find({
        toUserId: req.user._id,
        status: "pending"
    }).populate("fromUserId", "firstName lastName photoUrl");

    res.json(requests);
});


// =================================================
// ACCEPT / REJECT REQUEST
// =================================================
app.post("/request/respond/:requestId", userAuth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const request = await ConnectionRequest.findOne({
            _id: req.params.requestId,
            toUserId: req.user._id
        });

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.status = status;
        await request.save();

        res.json({ message: `Request ${status}` });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// =================================================
// MY CONNECTIONS
// =================================================
app.get("/connections", userAuth, async (req, res) => {
    const userId = req.user._id;

    const connections = await ConnectionRequest.find({
        status: "accepted",
        $or: [{ fromUserId: userId }, { toUserId: userId }]
    }).populate("fromUserId toUserId", "firstName lastName photoUrl");

    const matches = connections.map(r =>
        r.fromUserId._id.equals(userId) ? r.toUserId : r.fromUserId
    );

    res.json(matches);
});


// =================================================
// LOGOUT
// =================================================
app.post("/logout", userAuth, (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
});


// =================================================
// START SERVER
// =================================================
connectDB()
    .then(() => {
        console.log("Database connected");
        app.listen(7777, () =>
            console.log("Server running on port 7777")
        );
    })
    .catch(err => {
        console.error("Database connection failed", err);
        process.exit(1);
    });
