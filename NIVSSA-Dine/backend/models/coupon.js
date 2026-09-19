const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    maxClaims: {
      type: Number,
      required: true,
      min: 1,
    },

    claimedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    audience: {
      type: String,
      enum: [
        "new_users",
        "all_users",
        "existing_users",
      ],
      default: "all_users",
    },

    newUserDays: {
      type: Number,
      default: 30,
      min: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    active: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Coupon",
    couponSchema
  );