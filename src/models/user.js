const mongoose = require("mongoose");                 // Importing mongoose
const validator = require("validator");              // External validation library

const userSchema = new mongoose.Schema(
{
    firstName: {
        type: String,                                // First name of user
        required: true,                              // Mandatory
        minlength: 2,                                // At least 2 characters
        maxlength: 50,                               // Max 50 characters
        trim: true                                   // Remove extra spaces
    },

    lastName: {
        type: String,
        trim: true
    },

    emailId: {
        type: String,
        required: true,                              // Email is mandatory
        lowercase: true,                             // Always store lowercase
        unique: true,                                // Must be unique
        trim: true,
        validate(value) {                            // Email format validation
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email address");
            }
        }
    },

    password: {
        type: String,
        required: true,                              // Password is mandatory
        minlength: 6,                                // Minimum password length
        select: false,                               // Hide password from queries
        validate(value) {                            // Strong password check
            if (!validator.isStrongPassword(value)) {
                throw new Error("Password must be strong (uppercase, lowercase, number & symbol required)");
            }
        }
    },

    age: {
        type: Number,
        min: 18,                                     // Minimum age
        max: 60                                      // Maximum age
    },

    gender: {
        type: String,
        required: true,
        enum: ["Male", "Female", "Other"]             // Only these values allowed
    },

    photoUrl: {
        type: String,
        default: "https://tse2.mm.bing.net/th/id/OIP.WLB7NRb9ayKYi7EQ1dAhgAAAAA?pid=Api&P=0&h=180",
        validate(value) {                            // Validate URL
            if (!validator.isURL(value)) {
                throw new Error("Invalid photo URL");
            }
        }
    },

    about: {
        type: String,
        default: "This is a default bio",
        maxlength: 300                               // Limit about section size
    },

    skills: {
        type: [String],
        validate(value) {                            // At least one skill required
            if (value.length === 0) {
                throw new Error("User must have at least one skill");
            }
            if (value.length > 10) {
                throw new Error("You can add a maximum of 10 skills");
            }
        }
    },

    isActive: {
        type: Boolean,                               // Soft delete / active status
        default: true
    }
},
{
    timestamps: true                                // Automatically add createdAt & updatedAt
}
);

module.exports = mongoose.model("User", userSchema);  // Exporting User model
