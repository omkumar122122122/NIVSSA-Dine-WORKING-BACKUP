const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    openingTime: {
      type: String,
      required: true,
    },

    closingTime: {
      type: String,
      required: true,
    },

    openDays: {
      type: [String],
      default: [],
    },

    closedDays: {
      type: [String],
      default: [],
    },

    seatingOptions: {
      type: [String],
      default: [],
    },

    cuisine: {
      type: [String],
      default: [],
    },

    priceForTwo: {
      type: Number,
      default: 0,
    },

    totalTables: {
      type: Number,
      required: true,
    },

    maximumCapacity: {
      type: Number,
      required: true,
    },

    averageTurnTime: {
      type: Number,
      required: true,
    },

    specialInfo: {
      type: [String],
      default: [],
    },

    menu: {
      breakfast: {
        type: [menuItemSchema],
        default: [],
      },

      starters: {
        type: [menuItemSchema],
        default: [],
      },

      sushiAndSpecials: {
        type: [menuItemSchema],
        default: [],
      },

      mainCourse: {
        type: [menuItemSchema],
        default: [],
      },

      breads: {
        type: [menuItemSchema],
        default: [],
      },

      desserts: {
        type: [menuItemSchema],
        default: [],
      },

      beverages: {
        type: [menuItemSchema],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Restaurant",
  restaurantSchema
);