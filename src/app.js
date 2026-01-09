const express = require("express");                      // Importing Express framework
const connectDB = require("./config/database");          // Importing database connection function
const User = require("./models/user");                   // Importing User mongoose model

const app = express();                                   // Creating Express application instance

app.use(express.json());                                 // Middleware to parse incoming JSON request body

// Signup API – creates and saves a new user
app.post("/signup", async (req, res) => {                // Async handler for DB operation
    try {
        // Creating a new instance of the User model
        const user = new User({                           // Passing user data to model
            firstName: "Ayush",                           // User first name
            lastName: "Pandey",                           // User last name
            emailId: "ayush_new@gmail.com",               // CHANGED email ID
            password: "123456"                            // User password
        });

        await user.save();                                // Saving user document to database

        res.send("User created and saved successfully");  // Success response
    } catch (err) {
        res.status(500).send("Error creating user");      // Error response
    }
});

// First connect to database, then start server
connectDB()
    .then(() => {
        console.log("Database connected");                // DB connection success log

        app.listen(7777, () => {                           // Starting server on port 7777
            console.log("Server listening on port 7777");  // Server started confirmation
        });
    })
    .catch((err) => {
        console.error("Failed to connect to database");    // DB connection failure log
        console.error(err.message);                        // Printing error message
        process.exit(1);                                  // Exiting process on failure
    });
