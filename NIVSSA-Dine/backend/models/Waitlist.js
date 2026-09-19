const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema(
  {
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
      default: null,
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

    requestedDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "notified",
        "seated",
        "cancelled",
      ],
      default: "waiting",
    },

    position: {
      type: Number,
      required: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Waitlist", waitlistSchema);