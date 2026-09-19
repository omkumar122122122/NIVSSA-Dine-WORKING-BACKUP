const express = require("express");

const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// =========================
// GET REFERRAL DETAILS
// =========================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await User.findById(
        userId
      ).select(
        "name email referralCode referredBy referralBonusEarned walletBalance createdAt"
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // =========================
      // WHO REFERRED ME?
      // =========================

      let referredByUser = null;

      if (user.referredBy) {
        const referrer =
          await User.findOne({
            referralCode:
              user.referredBy,
          }).select(
            "name email referralCode"
          );

        if (referrer) {
          referredByUser = {
            name: referrer.name,
            email: referrer.email,
            referralCode:
              referrer.referralCode,
          };
        }
      }

      // =========================
      // MY REFERRALS
      // =========================

      const referredUsers =
        await User.find({
          referredBy:
            user.referralCode,
        })
          .select(
            "name email createdAt referralBonusEarned"
          )
          .sort({
            createdAt: -1,
          });

      const referrals =
        referredUsers.map(
          (person) => ({
            id: person._id,
            name: person.name,
            email: person.email,
            joinedAt:
              person.createdAt,
            reward: 50,
            status:
              Number(
                person.referralBonusEarned ||
                  0
              ) >= 20
                ? "completed"
                : "pending",
          })
        );

      // =========================
      // REFERRAL TRANSACTIONS
      // =========================

      const transactions =
        await WalletTransaction.find({
          user: user._id,
          reason: {
            $in: [
              "Referral Reward",
              "Referral Welcome Bonus",
            ],
          },
        }).sort({
          createdAt: -1,
        });

      return res.status(200).json({
        referralCode:
          user.referralCode ||
          null,

        walletBalance:
          Number(
            user.walletBalance || 0
          ),

        totalReferrals:
          referrals.length,

        totalEarned:
          referrals.length * 50,

        referredBy:
          referredByUser,

        welcomeBonus:
          user.referredBy &&
          Number(
            user.referralBonusEarned ||
              0
          ) >= 20
            ? 20
            : 0,

        referrals,

        transactions,
      });
    } catch (error) {
      console.error(
        "Referral details error:",
        error.message
      );

      return res.status(500).json({
        message:
          "Failed to load referral details",
      });
    }
  }
);

module.exports = router;