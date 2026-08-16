const mongoose = require("mongoose");


const connectionRequestSchema = new mongoose.Schema(
  {
    
     // Who sent the request
    
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },


    //  Who received the request
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

   
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


connectionRequestSchema.index(
  { fromUserId: 1, toUserId: 1 },
  { unique: true }
);


module.exports =
  mongoose.models.ConnectionRequest ||
  mongoose.model("ConnectionRequest", connectionRequestSchema);
