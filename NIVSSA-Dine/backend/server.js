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

const normalizeOrigin = (origin) =>
  origin.replace(/\/+$/, "").toLowerCase();

const configuredOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "https://nivssa-dine-working-backup-1.onrender.com",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : []),
].map(normalizeOrigin);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const norm = normalizeOrigin(origin);
  if (configuredOrigins.includes(norm)) return true;
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
    if (url.hostname.endsWith(".vercel.app")) return true;
  } catch {
    // Malformed origin URL
  }
  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
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
   ROOT & HEALTH CHECK
===================================================== */

app.get("/", (req, res) => {
  res.json({
    message: "NIVSSA Dine Backend is running 🍽️",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "nivssa-dine-backend",
    timestamp: new Date().toISOString(),
  });
});

/* =====================================================
   PORT
===================================================== */

const PORT = process.env.PORT || 3000;

/* =====================================================
   MONGODB + SERVER START
===================================================== */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully ✅");

    startReservationCron();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `NIVSSA Dine Backend running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed ❌");
    console.error(error.message);
  });
