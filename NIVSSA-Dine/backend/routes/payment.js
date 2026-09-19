const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const authMiddleware = require("../middleware/auth");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post(
  "/create-order",
  authMiddleware,
  async (req, res) => {
    try {
      const amount = 10;

      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: `nvs_${Date.now()}`,
      });

      return res.status(200).json({
        message: "Payment order created successfully",
        order,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error(
        "Create Razorpay order error:",
        error
      );

      return res.status(500).json({
        message: "Failed to create payment order",
        error: error.message,
      });
    }
  }
);

router.post(
  "/verify",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          message: "Payment details are required",
        });
      }

      const generatedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env.RAZORPAY_KEY_SECRET
          )
          .update(
            razorpay_order_id +
              "|" +
              razorpay_payment_id
          )
          .digest("hex");

      if (
        generatedSignature !==
        razorpay_signature
      ) {
        return res.status(400).json({
          message: "Payment verification failed",
        });
      }

      return res.status(200).json({
        message: "Payment verified successfully",
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } catch (error) {
      console.error(
        "Razorpay payment verification error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to verify payment",
        error: error.message,
      });
    }
  }
);

module.exports = router;