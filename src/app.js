const express = require("express");                      // Importing Express framework
const connectDB = require("./config/database");          // Importing database connection function
const User = require("./models/user");                   // Importing User mongoose model

const app = express();                                   // Creating Express application instance

app.use(express.json());                                 // Middleware to parse incoming JSON into req.body

// Signup API – creates and saves a new user
app.post("/signup", async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.send("User created and saved successfully");
    } catch (err) {
        res.status(500).send("Error creating user");
    }
});

// Get user by email
app.get("/user", async (req, res) => {
    try {
        const user = await User.find({ emailId: req.body.emailId });
        if (user.length === 0) return res.status(404).send("User not found");
        res.send(user);
    } catch (err) {
        res.status(500).send("Error fetching user");
    }
});

// Feed API – get all users
app.get("/feed", async (req, res) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (err) {
        res.status(500).send("Error fetching feed");
    }
});

// Delete user by userId
app.delete("/user", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.body.userId);
        if (!deletedUser) return res.status(404).send("User not found");
        res.send("User deleted successfully");
    } catch (err) {
        res.status(500).send("Error deleting user");
    }
});



// ==========================
// STANDARD PATCH API
// ==========================
app.patch("/user/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;                 // User ID from URL
        const updates = req.body;                        // Fields to update

        // Fields user is allowed to update
        const ALLOWED_UPDATES = ["photoUrl", "gender", "age", "about", "skills"];

        // Validate update fields
        const isUpdateAllowed = Object.keys(updates).every((key) =>
            ALLOWED_UPDATES.includes(key)
        );

        if (!isUpdateAllowed) {
            return res.status(400).json({ message: "Invalid fields in update request" });
        }

        // Validate skills length if provided
        if (updates.skills && updates.skills.length > 10) {
            return res.status(400).json({ message: "You can add a maximum of 10 skills only" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updates,
            {
                new: true,                               // Return updated document
                runValidators: true                     // Run schema validation
            }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User updated successfully",
            data: updatedUser
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating user" });
    }
});



// First connect to database, then start server
connectDB()
    .then(() => {
        console.log("Database connected");
        app.listen(7777, () => console.log("Server listening on port 7777"));
    })
    .catch((err) => {
        console.error("Failed to connect to database");
        process.exit(1);
    });
