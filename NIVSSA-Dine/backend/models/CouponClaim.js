const mongoose = require("mongoose");

const couponClaimSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

couponClaimSchema.index(
  {
    coupon: 1,
    user: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.model(
    "CouponClaim",
    couponClaimSchema
  );