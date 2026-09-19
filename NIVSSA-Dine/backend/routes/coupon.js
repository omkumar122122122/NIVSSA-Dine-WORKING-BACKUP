const router = require("express").Router();
const mongoose = require("mongoose");

const Coupon = require("../models/coupon");
const CouponClaim = require("../models/CouponClaim");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

const authMiddleware =
  require("../middleware/auth");

const roleMiddleware =
  require("../middleware/role");

/*
  ============================================================
  STAFF / ADMIN - CREATE COUPON
  ============================================================
*/

router.post(
  "/",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  async (req, res) => {
    try {
      const {
        code,
        amount,
        maxClaims,
        audience,
        newUserDays,
        startDate,
        expiryDate,
        active,
      } = req.body;

      if (!code) {
        return res.status(400).json({
          message:
            "Coupon code is required.",
        });
      }

      if (!amount || Number(amount) < 1) {
        return res.status(400).json({
          message:
            "Coupon amount must be at least ₹1.",
        });
      }

      if (
        !maxClaims ||
        Number(maxClaims) < 1
      ) {
        return res.status(400).json({
          message:
            "Maximum claims must be at least 1.",
        });
      }

      const normalizedCode =
        String(code)
          .trim()
          .toUpperCase();

      const existingCoupon =
        await Coupon.findOne({
          code: normalizedCode,
        });

      if (existingCoupon) {
        return res.status(409).json({
          message:
            "This coupon code already exists.",
        });
      }

      if (
        audience &&
        ![
          "new_users",
          "all_users",
          "existing_users",
        ].includes(audience)
      ) {
        return res.status(400).json({
          message:
            "Invalid coupon audience.",
        });
      }

      const coupon =
        await Coupon.create({
          code: normalizedCode,
          amount: Number(amount),
          maxClaims: Number(maxClaims),
          claimedCount: 0,
          audience:
            audience || "all_users",
          newUserDays:
            Number(newUserDays ?? 30),
          startDate:
            startDate
              ? new Date(startDate)
              : null,
          expiryDate:
            expiryDate
              ? new Date(expiryDate)
              : null,
          active:
            active !== undefined
              ? Boolean(active)
              : true,
          createdBy:
            req.user.id,
        });

      return res.status(201).json({
        message:
          "Coupon created successfully.",
        coupon,
      });
    } catch (error) {
      console.error(
        "Create coupon error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to create coupon.",
      });
    }
  }
);

/*
  ============================================================
  STAFF / ADMIN - GET ALL COUPONS
  ============================================================
*/

router.get(
  "/staff/all",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  async (req, res) => {
    try {
      const coupons =
        await Coupon.find()
          .sort({
            createdAt: -1,
          })
          .populate(
            "createdBy",
            "name email"
          );

      return res.json({
        coupons,
      });
    } catch (error) {
      console.error(
        "Get staff coupons error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load coupons.",
      });
    }
  }
);

/*
  ============================================================
  STAFF / ADMIN - TOGGLE COUPON ACTIVE / DISABLED
  ============================================================
*/

router.patch(
  "/staff/:id/toggle",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  async (req, res) => {
    try {
      const coupon =
        await Coupon.findById(
          req.params.id
        );

      if (!coupon) {
        return res.status(404).json({
          message:
            "Coupon not found.",
        });
      }

      coupon.active =
        !coupon.active;

      await coupon.save();

      return res.json({
        message:
          coupon.active
            ? "Coupon activated."
            : "Coupon disabled.",
        coupon,
      });
    } catch (error) {
      console.error(
        "Toggle coupon error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update coupon.",
      });
    }
  }
);

/*
  ============================================================
  CUSTOMER - CLAIM COUPON
  ============================================================
*/

router.post(
  "/claim",
  authMiddleware,
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          message:
            "Please enter a coupon code.",
        });
      }

      const normalizedCode =
        String(code)
          .trim()
          .toUpperCase();

      let result = null;

      await session.withTransaction(
        async () => {
          const now =
            new Date();

          const user =
            await User.findById(
              req.user.id
            ).session(session);

          if (!user) {
            throw new Error(
              "User not found."
            );
          }

          const coupon =
            await Coupon.findOne({
              code: normalizedCode,
            }).session(session);

          if (!coupon) {
            throw new Error(
              "Invalid coupon code."
            );
          }

          if (!coupon.active) {
            throw new Error(
              "This coupon is currently disabled."
            );
          }

          if (
            coupon.startDate &&
            now < coupon.startDate
          ) {
            throw new Error(
              "This coupon is not active yet."
            );
          }

          if (
            coupon.expiryDate &&
            now > coupon.expiryDate
          ) {
            throw new Error(
              "This coupon has expired."
            );
          }

          if (
            coupon.claimedCount >=
            coupon.maxClaims
          ) {
            throw new Error(
              "This coupon has reached its maximum claim limit."
            );
          }

          const alreadyClaimed =
            await CouponClaim.findOne({
              coupon: coupon._id,
              user: user._id,
            }).session(session);

          if (alreadyClaimed) {
            throw new Error(
              "You have already claimed this coupon."
            );
          }

          /*
            AUDIENCE CHECK
          */

          if (
            coupon.audience ===
            "new_users"
          ) {
            const newUserDays =
              Number(
                coupon.newUserDays || 0
              );

            const cutoffDate =
              new Date(
                now.getTime() -
                  newUserDays *
                    24 *
                    60 *
                    60 *
                    1000
              );

            if (
              !user.createdAt ||
              user.createdAt <
                cutoffDate
            ) {
              throw new Error(
                `This coupon is only available for users registered within the last ${newUserDays} days.`
              );
            }
          }

          if (
            coupon.audience ===
            "existing_users"
          ) {
            if (
              !user.createdAt ||
              user.createdAt >=
                coupon.createdAt
            ) {
              throw new Error(
                "This coupon is only available for existing users."
              );
            }
          }

          /*
            ATOMIC CLAIM COUNT CHECK
          */

          const updatedCoupon =
            await Coupon.findOneAndUpdate(
              {
                _id: coupon._id,
                active: true,
                $expr: {
                  $lt: [
                    "$claimedCount",
                    "$maxClaims",
                  ],
                },
              },
              {
                $inc: {
                  claimedCount: 1,
                },
              },
              {
                new: true,
                session,
              }
            );

          if (!updatedCoupon) {
            throw new Error(
              "Coupon claim limit has already been reached."
            );
          }

          /*
            CREDIT WALLET
          */

          const walletAmount =
            Number(
              updatedCoupon.amount
            );

          user.walletBalance =
            Math.max(
              0,
              Number(
                user.walletBalance || 0
              )
            ) + walletAmount;

          await user.save({
            session,
          });

          /*
            SAVE COUPON CLAIM
          */

          await CouponClaim.create(
            [
              {
                coupon:
                  updatedCoupon._id,
                user: user._id,
                code:
                  updatedCoupon.code,
                amount:
                  walletAmount,
              },
            ],
            {
              session,
            }
          );

          /*
            WALLET TRANSACTION
          */

          await WalletTransaction.create(
            [
              {
                user: user._id,
                amount:
                  walletAmount,
                type: "credit",
                reason:
                  "Coupon Bonus",
                description:
                  `Coupon ${updatedCoupon.code} claimed successfully.`,
              },
            ],
            {
              session,
            }
          );

          result = {
            code:
              updatedCoupon.code,
            amount:
              walletAmount,
            walletBalance:
              user.walletBalance,
          };
        }
      );

      return res.json({
        message:
          "Coupon claimed successfully.",
        code: result.code,
        amount: result.amount,
        walletBalance:
          result.walletBalance,
      });
    } catch (error) {
      console.error(
        "Claim coupon error:",
        error
      );

      return res.status(400).json({
        message:
          error.message ||
          "Failed to claim coupon.",
      });
    } finally {
      await session.endSession();
    }
  }
);

/*
  ============================================================
  CUSTOMER - MY CLAIMED COUPONS
  ============================================================
*/

router.get(
  "/my-claims",
  authMiddleware,
  async (req, res) => {
    try {
      const claims =
        await CouponClaim.find({
          user: req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .populate(
            "coupon",
            "code amount audience startDate expiryDate"
          );

      return res.json({
        claims,
      });
    } catch (error) {
      console.error(
        "Get coupon claims error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load coupon history.",
      });
    }
  }
);

module.exports = router;