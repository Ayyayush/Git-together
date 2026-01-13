const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
{
    // Who sent the request
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Who received the request
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Current status of request
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
},
{
    timestamps: true
});

// Prevent duplicate connection requests
connectionRequestSchema.index(
    { fromUserId: 1, toUserId: 1 },
    { unique: true }
);

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);
