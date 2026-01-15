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
      enum: ["interested", "ignored", "accepted", "rejected"],
      required: true
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

/*
 * SAFE EXPORT (prevents OverwriteModelError)
 */
module.exports =
  mongoose.models.ConnectionRequest ||
  mongoose.model("ConnectionRequest", connectionRequestSchema);
