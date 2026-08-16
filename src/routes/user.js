// now i have to combine atuhentication. mongodb queries , relationshps
// pagination , search filtering , rec logic and aicoach

const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/ConnectionRequest");
const User = require("../models/user");
const mongoose = require("mongoose");
const { recommendDevelopers, calculateRecommendationScore } = require("../utils/recommendationEngine");
const { generateAIExplanation } = require("../services/recommendationAI");

const USER_SAFE_DATA = "firstName lastName username photoUrl about developerTitle company skills isPremium";

// Escapes regex special characters in user-supplied search input to prevent ReDoS / regex injection
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


// GET /user/profile/:userId
userRouter.get("/user/profile/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid Developer ID format." });
    }

    const user = await User.findById(userId).select(
      "_id firstName lastName username photoUrl about developerTitle college degree graduationYear company experienceLevel location skills projects github linkedin portfolio resume website leetcode codeforces codechef hackerrank twitter availability isPremium profileStrength"
    );

    if (!user) {
      return res.status(404).json({ message: "Developer profile not found." });
    }

    res.status(200).json({
      message: "Developer fetched successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ message: "ERROR: " + err.message });
  }
});



// GET /user/requests
userRouter.get("/user/requests", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", "firstName lastName photoUrl about skills developerTitle company");

    const data = connectionRequests.filter((row) => row.fromUserId);

    res.json({
      message: "Requests fetched successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({ message: "ERROR: " + err.message });
  }
});  

  

// GET /user/connections  
userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;  

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
    .populate("fromUserId", "firstName lastName photoUrl about skills developerTitle company")
    .populate("toUserId", "firstName lastName photoUrl about skills developerTitle company");  

    const data = connectionRequests.map((row) => {
      // Use Mongoose's .equals() for ObjectId comparison instead of chained
      // .toString() calls — safer if fromUserId/toUserId ever come through
      // unpopulated (raw ObjectId) or the populated ref was deleted (null).
      if (row.fromUserId?._id && row.fromUserId._id.equals(loggedInUser._id)) {
        return row.toUserId;
      }
      return row.fromUserId;
    }).filter(Boolean);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: "ERROR: " + err.message });
  }
});




// GET /feed
userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(50, Math.max(1, limit));
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((connReq) => {
      if (connReq.fromUserId) hideUsersFromFeed.add(connReq.fromUserId.toString());
      if (connReq.toUserId) hideUsersFromFeed.add(connReq.toUserId.toString());
    });

    const feedFilter = {
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    };

    // Run the page query and the total count in parallel. The count uses the
    // exact same filter, so hasMore/totalPages stay correct as the exclusion
    // set (connections/requests) changes between page fetches.
    const [users, totalCount] = await Promise.all([
      User.find(feedFilter)
        .select("firstName lastName photoUrl about skills developerTitle company isPremium createdAt")
        .sort({ isPremium: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(feedFilter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const hasMore = skip + users.length < totalCount;

    res.json({
      data: users,
      page,
      limit,
      total: totalCount,
      totalPages,
      hasMore,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// GET /user/search
userRouter.get("/user/search", userAuth, async (req, res) => {
  try {
    const queryParam = req.query.q;
    const queryStr = queryParam ? queryParam.trim() : "";

    if (!queryStr || queryStr.length < 2) {
      return res.status(400).json({
        message: "Search query must contain at least 2 characters.",
      });
    }

    const regex = new RegExp(escapeRegex(queryStr), "i");

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
        { skills: regex },
        { developerTitle: regex },
        { company: regex },
        { college: regex },
      ],
    })
    .select(USER_SAFE_DATA)
    .sort({ isPremium: -1, firstName: 1 })
    .limit(10);

    return res.status(200).json({
      message: "Search completed successfully",
      count: users.length,
      data: users,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  }
});





// GET /user/recommendations
userRouter.get("/user/recommendations", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({ message: "Unauthorized access." });
    }


    // Fetch all connection requests related to the current user to build the exclusion list
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).select("fromUserId toUserId status");

    const exclusionSet = new Set();
    exclusionSet.add(loggedInUser._id.toString());

    connectionRequests.forEach((reqObj) => {
      if (reqObj.fromUserId) exclusionSet.add(reqObj.fromUserId.toString());
      if (reqObj.toUserId) exclusionSet.add(reqObj.toUserId.toString());
    });

    // Find discoverable candidate developers who are not in the exclusion list.
    // Include users where isActive is explicitly true, OR where the isActive
    // field does not exist at all (older documents predating that field).
    const candidates = await User.find({
      _id: { $nin: Array.from(exclusionSet) },
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    }).select("_id firstName lastName username photoUrl developerTitle company college location skills availability experienceLevel isPremium");

    // Pass the documents directly into the recommendation engine business logic layer
    const rankedCandidates = recommendDevelopers(loggedInUser, candidates);

    // Only generate AI explanations for the top 5 ranked candidates to reduce
    // unnecessary Groq API calls. Ranking order/logic is unchanged; every
    // candidate is still returned, just without an AI explanation past #5.
    const recommendedData = await Promise.all(
      rankedCandidates.map(async (candidate, index) => {
        if (index < 5) {
          const analysis = calculateRecommendationScore(loggedInUser, candidate);
          const aiReason = await generateAIExplanation(loggedInUser, candidate, analysis);

          return {
            ...candidate,
            aiReason: aiReason
          };
        }

        return {
          ...candidate,
          aiReason: null
        };
      })
    );

    return res.status(200).json({
      message: "Recommendations fetched successfully",
      count: recommendedData.length,
      data: recommendedData
    });
  } catch (err) {
    return res.status(500).json({
      message: "ERROR: " + err.message
    });
  }
});

module.exports = userRouter;