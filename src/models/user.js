const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
{
    firstName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
        trim: true
    },

    lastName: {
        type: String,
        trim: true
    },

    emailId: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email address");
            }
        }
    },

    // 🔐 Password (bcrypt hash)
    password: {
        type: String,
        required: true,
        minlength: 60
        // ❌ DO NOT use select:false here
    },

    age: {
        type: Number,
        min: 18,
        max: 60
    },

    gender: {
        type: String,
        enum: ["Male", "Female", "Other"]
    },

    photoUrl: {
        type: String,
        default: "https://tse2.mm.bing.net/th/id/OIP.WLB7NRb9ayKYi7EQ1dAhgAAAAA?pid=Api&P=0&h=180",
        validate(value) {
            if (!validator.isURL(value)) {
                throw new Error("Invalid photo URL");
            }
        }
    },

    about: {
        type: String,
        default: "This is a default bio",
        maxlength: 300
    },

    skills: {
        type: [String],
        default: [],
        validate(value) {
            if (value.length > 10) {
                throw new Error("You can add a maximum of 10 skills");
            }
        }
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);
