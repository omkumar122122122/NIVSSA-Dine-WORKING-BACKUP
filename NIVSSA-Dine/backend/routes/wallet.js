const express = require("express");

const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET /api/wallet
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email walletBalance referralCode referralBonusEarned"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      walletBalance: Number(user.walletBalance || 0),
      referralCode: user.referralCode || null,
      referralBonusEarned: Number(
        user.referralBonusEarned || 0
      ),
    });
  } catch (error) {
    console.error("Get wallet error:", error.message);

    return res.status(500).json({
      message: "Failed to load wallet",
    });
  }
});

// GET /api/wallet/transactions
router.get(
  "/transactions",
  authMiddleware,
  async (req, res) => {
    try {
      const transactions = await WalletTransaction.find({
        user: req.user.id,
      }).sort({
        createdAt: -1,
      });

      return res.status(200).json({
        transactions,
      });
    } catch (error) {
      console.error(
        "Get wallet transactions error:",
        error.message
      );

      return res.status(500).json({
        message: "Failed to load wallet transactions",
      });
    }
  }
);

module.exports = router;