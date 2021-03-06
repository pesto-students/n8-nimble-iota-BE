require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const UserModel = mongoose.model("Users");
const { roles } = require("../constants");
const checkIsInRole = require("../utils");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const mailOptions = {
    from: process.env.EMAIL_ID,
    subject: "New Password from Nimble",
};

router.post(
    "/createOrder",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        try {
            const user = await UserModel.findOne({ email: req.user.email });
            if (!user) {
                return res
                    .status(400)
                    .send({
                        success: false,
                        message: "No User with that email",
                    });
            }
            const amount = req.body.amount;
            const instance = new Razorpay({
                key_id: process.env.PAYMENT_ID,
                key_secret: process.env.PAYMENT_KEY,
            });
            //Razorpay accepts money in Paisa--> 1 Rs = 100paisa
            const options = {
                amount: amount*100,
                currency: "INR",
                receipt: "Order Receipt",
            };

            instance.orders.create(options, function (err, order) {
                if (err) throw err;
                return res.status(200).send({ success: true, order: order });
            });
        } catch (err) {
            res.status(500).send({
                success: false,
                message: "Couldn't create order",
            });
        }
    }
);

router.post(
    "/updatePayment",
    passport.authenticate("jwt", { session: false }),
    checkIsInRole(roles.ROLE_SCRUMMASTER),
    async (req, res) => {
        try {
            const user = await UserModel.findOne({ email: req.user.email });
            if (!user) {
                return res.status(400).send({
                    success: false,
                    message: "No User with that email",
                });
            }
            const { transactionid, amount } = req.body;
            user.subscription.push({ transactionid, amount });
            user.save();
            res.status(200).send({
                success: true,
                message:
                    "Subscription Updated ... Thanks for choosing Nimble :)",
            });
        } catch (err) {
            // console.log(err)
            res.status(500).send({
                success: false,
                message: "Couldn't create order",
            });
        }
    }
);

module.exports = router;
