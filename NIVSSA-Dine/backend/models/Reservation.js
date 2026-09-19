const mongoose = require("mongoose");
const crypto = require("crypto");

const generateBookingId = () => {
  return (
    "NVS-" +
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
      .slice(0, 6)
  );
};

const reservationSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      default: generateBookingId,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    tables: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Table",
      },
    ],

    date: {
      type: Date,
      required: true,
    },

    partySize: {
      type: Number,
      required: true,
      min: 1,
    },

    seatingPreference: {
      type: String,
      enum: [
        "any",
        "indoor",
        "outdoor",
        "window",
        "private",
      ],
      default: "any",
    },

    status: {
      type: String,
      enum: [
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
        "rescheduled",
      ],
      default: "confirmed",
    },

    arrivalStatus: {
      type: String,
      enum: [
        "pending",
        "arrived",
        "no_show",
      ],
      default: "pending",
    },

    gracePeriodMinutes: {
      type: Number,
      default: 15,
      min: 1,
      max: 60,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       WALLET
    ===================================================== */

    walletAmountUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    walletRefunded: {
      type: Boolean,
      default: false,
    },

    walletRefundReason: {
      type: String,
      default: null,
    },

    /* =====================================================
       RESCHEDULE
    ===================================================== */

    rescheduleCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    rescheduleFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },

    rescheduledTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    rescheduledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Reservation",
  reservationSchema
);