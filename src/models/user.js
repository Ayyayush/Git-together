const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

/*
 * ============================
 * User Schema
 * ============================
 */
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

    /*
     * 🔐 Hashed Password
     */
    password: {
        type: String,
        required: true,
        minlength: 60
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
        default:
            "https://tse2.mm.bing.net/th/id/OIP.WLB7NRb9ayKYi7EQ1dAhgAAAAA?pid=Api&P=0&h=180",
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
}
);

/*
 * ============================
 * Instance Method: Validate Password
 * ============================
 */
userSchema.methods.validatePassword = async function (passwordInputByUser) {

    const user = this;
    const passwordHash = user.password;

    const isPasswordValid = await bcrypt.compare(
        passwordInputByUser,
        passwordHash
    );

    return isPasswordValid;
};

/*
 * ============================
 * Instance Method: Generate JWT
 * ============================
 */
userSchema.methods.getJWT = async function () {

    const user = this;

    const token = jwt.sign(
        { _id: user._id },
        "DEVtinder$790", // move to env later
        { expiresIn: "7d" }
    );

    return token;
};

module.exports = mongoose.model("User", userSchema);
