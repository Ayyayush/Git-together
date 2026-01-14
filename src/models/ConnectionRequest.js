const mongoose = require("mongoose");

/*
 * ============================
 * Connection Request Schema
 * ============================
 */
const connectionRequestSchema = new mongoose.Schema(
  {
    /*
     * Who sent the request
     */
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /*
     * Who received the request
     */
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /*
     * Status of request
     */
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "ignored","interested"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

/*
 * Prevent duplicate requests
 */
connectionRequestSchema.index(
  { fromUserId: 1, toUserId: 1 },
  { unique: true }
); 

module.exports = mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema
);
