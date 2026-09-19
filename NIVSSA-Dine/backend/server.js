const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const couponRoutes = require("./routes/coupon");
const reservationRoutes = require("./routes/reservations");
const tableRoutes = require("./routes/tables");
const waitlistRoutes = require("./routes/waitlist");
const paymentRoutes = require("./routes/payment");
const profileRoutes = require("./routes/profile");
const walletRoutes = require("./routes/wallet");
const referralRoutes = require("./routes/referral");

const startReservationCron = require("./jobs/reservationCron");

const app = express();

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(cors());
app.use(express.json());

/* =====================================================
   ROUTES
===================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/coupons", couponRoutes);

/* =====================================================
   ROOT
===================================================== */

app.get("/", (req, res) => {
  res.json({
    message: "NIVSSA Dine Backend is running 🍽️",
  });
});

/* =====================================================
   PORT
===================================================== */

const PORT = process.env.PORT || 5000;

/* =====================================================
   MONGODB + SERVER START
===================================================== */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully ✅");

    startReservationCron();

    app.listen(PORT, () => {
      console.log(
        `NIVSSA Dine Backend running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed ❌");
    console.error(error.message);
  });