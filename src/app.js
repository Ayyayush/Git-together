const express = require("express");                      // Importing Express framework
const connectDB = require("./config/database");          // Importing database connection function
const User = require("./models/user");                   // Importing User mongoose model

const app = express();                                   // Creating Express application instance

app.use(express.json());                                 // Middleware to parse incoming JSON into req.body

// Signup API – creates and saves a new user
app.post("/signup", async (req, res) => {                // Async handler because DB operations are async
    try {
        const user = new User(req.body);                 // Creating new User document from request body
        await user.save();                               // Saving user document into database
        res.send("User created and saved successfully"); // Success response
    } catch (err) {
        res.status(500).send("Error creating user");     // Error response
    }
});

// Get user by email
app.get("/user", async (req, res) => {                   // Async handler for DB query
    try {
        const userEmail = req.body.emailId;              // Extracting emailId from request body

        const user = await User.find({                   // Finding user document by emailId
            emailId: userEmail
        });

        if (user.length === 0) {                         // If no user found
            return res.status(404).send("User not found");
        }

        res.send(user);                                  // Sending found user(s) as response
    } catch (err) {
        res.status(500).send("Error fetching user");     // Error response
    }
});

// Feed API – get all users
app.get("/feed", async (req, res) => {                   // Feed API
    try {
        const users = await User.find();                 // Fetching all users from database
        res.send(users);                                 // Sending users as feed
    } catch (err) {
        res.status(500).send("Error fetching feed");     // Error response
    }
});

// Delete user by userId
app.delete("/user", async (req, res) => {                // Delete API
    try {
        const userId = req.body.userId;                  // Extracting userId from request body

        const deletedUser = await User.findByIdAndDelete(userId); // Deleting user by ID

        if (!deletedUser) {                              // If user not found
            return res.status(404).send("User not found");
        }

        res.send("User deleted successfully");           // Success response
    } catch (err) {
        res.status(500).send("Error deleting user");     // Error response
    }
});

// Update user data
app.patch("/user", async (req, res) => {                 // Update API
    try {
        const userId = req.body.userId;                  // Extracting userId from request body

        const updatedUser = await User.findByIdAndUpdate(
            userId,                                      // User ID to update
            req.body,                                    // Fields to update
            { new: true }                                // Return updated document
        );

        if (!updatedUser) {                              // If user not found
            return res.status(404).send("User not found");
        }

        res.send("User updated successfully");           // Success response
    } catch (err) {
        res.status(500).send("Error updating user");     // Error response
    }
});

// First connect to database, then start server
connectDB()
    .then(() => {
        console.log("Database connected");               // DB connection success log

        app.listen(7777, () => {                          // Starting server on port 7777
            console.log("Server listening on port 7777"); // Server started confirmation
        });
    })
    .catch((err) => {
        console.error("Failed to connect to database");   // DB connection failure log
        console.error(err.message);                       // Printing error message
        process.exit(1);                                 // Exiting process on failure
    });
