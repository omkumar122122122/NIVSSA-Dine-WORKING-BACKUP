const mongoose = require("mongoose");
require("dotenv").config();

const Table = require("./models/Table");

const tables = [
  {
    tableNumber: 1,
    capacity: 2,
    section: "indoor",
    seatingType: "standard",
    status: "available",
    turnTime: 60,
  },
  {
    tableNumber: 2,
    capacity: 4,
    section: "window",
    seatingType: "booth",
    status: "available",
    turnTime: 60,
  },
  {
    tableNumber: 3,
    capacity: 6,
    section: "outdoor",
    seatingType: "standard",
    status: "available",
    turnTime: 90,
  },
  {
    tableNumber: 4,
    capacity: 4,
    section: "private",
    seatingType: "sofa",
    status: "available",
    turnTime: 90,
  },
  {
    tableNumber: 5,
    capacity: 2,
    section: "indoor",
    seatingType: "bar",
    status: "available",
    turnTime: 60,
  },
];

const seedTables = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected ✅");

    await Table.deleteMany({});

    await Table.insertMany(tables);

    console.log("5 tables added successfully 🎉");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error.message);
  }
};

seedTables();