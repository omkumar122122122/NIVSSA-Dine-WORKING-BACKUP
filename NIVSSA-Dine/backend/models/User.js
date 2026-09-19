const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["customer", "staff", "admin"],
      default: "customer",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpiresAt: {
      type: Date,
      default: null,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    isStudent: {
      type: Boolean,
      default: false,
    },

    studentEmail: {
      type: String,
      default: null,
      trim: true,
    },

    studentVerificationStatus: {
      type: String,
      enum: [
        "not_submitted",
        "pending",
        "verified",
        "rejected",
      ],
      default: "not_submitted",
    },

    studentIdVerified: {
      type: Boolean,
      default: false,
    },

    /* =====================================================
       CUSTOMER WALLET
       New customers start with ₹0.
       Referral rewards will be added later.
    ===================================================== */

    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       REFERRAL SYSTEM
    ===================================================== */

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    referredBy: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },

    referralBonusEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    firstTwentyOffer: {
      type: Boolean,
      default: false,
    },

    /* =====================================================
       DEVICE / LOGIN
    ===================================================== */

    deviceIds: {
      type: [String],
      default: [],
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "User",
    userSchema
  );