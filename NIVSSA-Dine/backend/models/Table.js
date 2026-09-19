const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    tableNumber: {
      type: Number,
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    section: {
      type: String,
      enum: [
        "indoor",
        "outdoor",
        "window",
        "private",
      ],
      default: "indoor",
    },

    seatingType: {
      type: String,
      enum: [
        "standard",
        "booth",
        "bar",
        "sofa",
      ],
      default: "standard",
    },

    status: {
      type: String,
      enum: [
        "available",
        "reserved",
        "occupied",
        "maintenance",
      ],
      default: "available",
    },

    turnTime: {
      type: Number,
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

tableSchema.index(
  {
    restaurant: 1,
    tableNumber: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Table",
  tableSchema
);