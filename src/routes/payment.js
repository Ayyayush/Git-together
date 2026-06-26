const express = require("express");
const paymentRouter = express.Router();

const razorpayInstance = require("../config/razorpay");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");

const PREMIUM_PLANS = {
    Silver: {
        amount: 19900,
        duration: 30,
    },
    Gold: {
        amount: 49900,
        duration: 365,
    },
};

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
    try {

        const user = req.user;
        const { premiumType } = req.body;

        if (!premiumType) {
            return res.status(400).json({
                success: false,
                message: "Premium plan is required",
            });
        }

        const plan = PREMIUM_PLANS[premiumType];

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: "Invalid Premium Plan",
            });
        }

        const options = {
            amount: plan.amount,
            currency: "INR",
            receipt: `receipt_${user._id}_${Date.now()}`,
            notes: {
                userId: user._id.toString(),
                premiumType,
            },
        };

        const order = await razorpayInstance.orders.create(options);

        await User.findByIdAndUpdate(user._id, {
            razorpayOrderId: order.id,
            premiumType,
        });

        return res.status(200).json({
            success: true,
            data: {
                key: process.env.RAZORPAY_KEY_ID,
                order,
            },
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message,
        });

    }
});

module.exports = paymentRouter;