const mongoose = require("mongoose");                 // Importing mongoose

const userSchema = new mongoose.Schema({              // Defining user schema
    firstName: {
        type: String                                 // First name of user
    },
    lastName: {
        type: String                                 // Last name of user
    },
    emailId: {
        type: String                                 // Email ID of user
    },
    password: {
        type: String                                 // Password of user
    },
    age: {
        type: Number                                 // Age of user
    },
    gender: {
        type: String                                 // Gender of user
    }
});

module.exports = mongoose.model("User", userSchema);  // Exporting User model
