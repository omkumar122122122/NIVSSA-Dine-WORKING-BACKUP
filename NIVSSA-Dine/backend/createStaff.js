const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
require("dotenv").config();

const User = require("./models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createStaff() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected ✅");

    const name = await ask("Enter staff name: ");
    const email = await ask("Enter staff email: ");
    const phone = await ask("Enter staff phone: ");
    const password = await ask("Enter staff password: ");

    if (!name || !email || !phone || !password) {
      console.log("All fields are required ❌");
      rl.close();
      await mongoose.disconnect();
      return;
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      existingUser.name = name;
      existingUser.phone = phone;
      existingUser.password = await bcrypt.hash(password, 10);
      existingUser.role = "staff";
      existingUser.emailVerified = true;

      await existingUser.save();

      console.log("\nExisting account converted to STAFF ✅");
    } else {
      const hashedPassword = await bcrypt.hash(
        password,
        10
      );

      await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role: "staff",
        emailVerified: true,
        phoneVerified: false,
      });

      console.log("\nStaff account created successfully ✅");
    }

    console.log("Role: staff");

    rl.close();
    await mongoose.disconnect();
  } catch (error) {
    console.error("\nStaff creation failed ❌");
    console.error(error.message);

    rl.close();
    await mongoose.disconnect();
  }
}

createStaff();