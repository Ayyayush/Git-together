// src/models/user.js
const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

/*
 * ============================
 * Project Sub-schema
 * ============================
 */
const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  github: {
    type: String,
    trim: true,
    validate(value) {
      if (value && !validator.isURL(value)) {
        throw new Error("Invalid GitHub project URL");
      }
    },
  },
  live: {
    type: String,
    trim: true,
    validate(value) {
      if (value && !validator.isURL(value)) {
        throw new Error("Invalid Live project URL");
      }
    },
  },
  techStack: {
    type: [String],
    default: [],
  },
  image: {
    type: String,
    default: "",
    validate(value) {
      if (value && !validator.isURL(value)) {
        throw new Error("Invalid Project image URL");
      }
    },
  },
});

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
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      validate(value) {
        if (!/^[a-z0-9_]+$/.test(value)) {
          throw new Error(
            "Username can contain only lowercase letters, numbers and underscores"
          );
        }
      },
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
      },
    },

    /*
     * 🔐 Hashed Password
     */
    password: {
      type: String,
      required: true,
      minlength: 60,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    age: {
      type: Number,
      min: 18,
      max: 60,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    photoUrl: {
      type: String,
      default:
        "https://tse2.mm.bing.net/th/id/OIP.WLB7NRb9ayKYi7EQ1dAhgAAAAA?pid=Api&P=0&h=180",
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Invalid photo URL");
        }
      },
    },

    about: {
      type: String,
      default: "This is a default bio",
      maxlength: 300,
    },

    skills: {
      type: [String],
      default: [],
      validate(value) {
        if (value.length > 25) {
          throw new Error("You can add a maximum of 25 skills");
        }
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    premiumType: {
      type: String,
      enum: ["Silver", "Gold", "Platinum"],
      default: null,
    },

    premiumExpiry: {
      type: Date,
      default: null,
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    /*
     * ============================
     * Extended Developer Fields (Task 1)
     * ============================
     */
    developerTitle: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    college: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    degree: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    graduationYear: {
      type: Number,
      min: 1970,
      max: 2035,
    },

    company: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    experienceLevel: {
      type: String,
      enum: ["Junior", "Mid", "Senior", "Lead", ""],
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    portfolio: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid portfolio URL");
        }
      },
    },

    resume: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid resume URL");
        }
      },
    },

    github: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid GitHub profile URL");
        }
      },
    },

    linkedin: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid LinkedIn profile URL");
        }
      },
    },

    leetcode: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid LeetCode profile URL");
        }
      },
    },

    codeforces: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid Codeforces profile URL");
        }
      },
    },

    codechef: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid CodeChef profile URL");
        }
      },
    },

    hackerrank: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid HackerRank profile URL");
        }
      },
    },

    twitter: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid Twitter profile URL");
        }
      },
    },

    website: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid personal website URL");
        }
      },
    },

    projects: {
      type: [projectSchema],
      default: [],
    },

    availability: {
      type: String,
      enum: [
        "Open to Internship",
        "Open to Jobs",
        "Open to Freelance",
        "Hackathons",
        "Mentorship",
        "",
      ],
      default: "",
    },

    profileStrength: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * ============================
 * Instance Method: Validate Password
 * ============================
 */
userSchema.methods.validatePassword = async function (passwordInputByUser) {
  return bcrypt.compare(passwordInputByUser, this.password);
};

/*
 * ============================
 * Instance Method: Generate JWT
 * ============================
 */
userSchema.methods.getJWT = async function () {
  return jwt.sign(
    { _id: this._id },
    "DEVtinder$790", // move to env later
    { expiresIn: "7d" },
  );
};

/*
 * ============================
 * Search Indexes
 * ============================
 * NOTE: `username` already has `unique: true` above, which creates
 * its own index. The explicit userSchema.index({ username: 1 }) call
 * was creating a duplicate index and has been removed.
 */
userSchema.index({ firstName: 1 });
userSchema.index({ lastName: 1 });
userSchema.index({ skills: 1 });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);