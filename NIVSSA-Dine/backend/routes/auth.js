const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "nivssa-dine-development-secret";

// =========================
// GMAIL CONFIGURATION
// =========================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// =========================
// CHECK EMAIL CONFIG
// =========================

transporter.verify((error) => {
  if (error) {
    console.error(
      "Gmail configuration failed ❌:",
      error.message
    );
  } else {
    console.log(
      "Gmail configuration ready ✅"
    );
  }
});

// =========================
// GENERATE OTP
// =========================

const generateOTP = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};

// =========================
// GENERATE UNIQUE REFERRAL CODE
// =========================

const generateReferralCode = async () => {
  let referralCode;
  let exists = true;

  while (exists) {
    referralCode =
      "NVS" +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    exists = await User.findOne({
      referralCode,
    });
  }

  return referralCode;
};

// =========================
// SEND OTP EMAIL
// =========================

const sendOTPEmail = async (
  email,
  otp,
  type
) => {
  const subject =
    type === "signup"
      ? "NIVSSA Dine - Verification OTP"
      : "NIVSSA Dine - Login OTP";

  const title =
    type === "signup"
      ? "Verify Your Account"
      : "Login Verification";

  await transporter.sendMail({
    from: `"NIVSSA Dine 🍽️" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,

    text: `
NIVSSA Dine 🍽️

${title}

Your OTP is: ${otp}

This OTP is valid for 10 minutes.

Please do not share this OTP with anyone.

NIVSSA Dine Team
`,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: 30px auto;
          padding: 25px;
          border: 1px solid #eeeeee;
          border-radius: 15px;
          background: #ffffff;
        "
      >

        <h1
          style="
            text-align: center;
            color: #f97316;
          "
        >
          NIVSSA Dine 🍽️
        </h1>

        <h2
          style="
            text-align: center;
            color: #333333;
          "
        >
          ${title}
        </h2>

        <p
          style="
            color: #555555;
            font-size: 16px;
          "
        >
          Your One-Time Password is:
        </p>

        <div
          style="
            text-align: center;
            background: #fff7ed;
            color: #ea580c;
            padding: 20px;
            border-radius: 12px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
          "
        >
          ${otp}
        </div>

        <p
          style="
            color: #666666;
            font-size: 14px;
          "
        >
          This OTP is valid for <b>10 minutes</b>.
        </p>

        <p
          style="
            color: #666666;
            font-size: 14px;
          "
        >
          Do not share this OTP with anyone.
        </p>

        <hr
          style="
            border: none;
            border-top: 1px solid #eeeeee;
            margin: 25px 0;
          "
        />

        <p
          style="
            text-align: center;
            color: #777777;
            font-size: 13px;
          "
        >
          Thank you,<br />
          <b>NIVSSA Dine Team</b>
        </p>

      </div>
    `,
  });
};

// =========================
// SIGN UP
// =========================

router.post(
  "/signup",
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        referralCode,
      } = req.body;

      if (
        !name ||
        !email ||
        !phone ||
        !password
      ) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const cleanReferralCode =
        referralCode
          ? referralCode.trim().toUpperCase()
          : null;

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          message:
            "An account with this email already exists",
        });
      }

      // =========================
      // FIND REFERRER
      // =========================

      let referringUser = null;

      if (cleanReferralCode) {
        referringUser =
          await User.findOne({
            referralCode: cleanReferralCode,
          });

        if (!referringUser) {
          return res.status(400).json({
            message:
              "Invalid referral code",
          });
        }
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      const otp = generateOTP();

      const newReferralCode =
        await generateReferralCode();

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password: hashedPassword,

        otp,

        otpExpires: new Date(
          Date.now() + 10 * 60 * 1000
        ),

        referralCode:
          newReferralCode,

        referredBy:
          referringUser
            ? referringUser.referralCode
            : null,

        walletBalance: 0,

        referralBonusEarned: 0,
      });

      // =========================
      // SEND OTP
      // =========================

      try {
        await sendOTPEmail(
          normalizedEmail,
          otp,
          "signup"
        );

        console.log(
          `Signup OTP email sent to ${normalizedEmail} ✅`
        );
      } catch (emailError) {
        console.error(
          "Signup email error ❌:",
          emailError.message
        );

        await User.findByIdAndDelete(
          user._id
        );

        return res.status(500).json({
          message:
            "OTP email could not be sent. Please try again.",
        });
      }

      return res.status(201).json({
        message:
          "Account created. OTP sent to your email.",
        userId: user._id,
        otpRequired: true,
      });
    } catch (error) {
      console.error(
        "Signup error:",
        error.message
      );

      return res.status(500).json({
        message: "Signup failed",
      });
    }
  }
);

// =========================
// LOGIN
// =========================

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      const otp = generateOTP();

      user.otp = otp;

      user.otpExpires = new Date(
        Date.now() + 10 * 60 * 1000
      );

      await user.save();

      try {
        await sendOTPEmail(
          normalizedEmail,
          otp,
          "login"
        );

        console.log(
          `Login OTP email sent to ${normalizedEmail} ✅`
        );
      } catch (emailError) {
        console.error(
          "Login email error ❌:",
          emailError.message
        );

        return res.status(500).json({
          message:
            "OTP email could not be sent. Please check Gmail configuration.",
        });
      }

      return res.status(200).json({
        message:
          "OTP sent successfully to your email.",
        userId: user._id,
        otpRequired: true,
      });
    } catch (error) {
      console.error(
        "Login error:",
        error.message
      );

      return res.status(500).json({
        message: "Login failed",
      });
    }
  }
);

// =========================
// VERIFY OTP
// =========================

router.post(
  "/verify-otp",
  async (req, res) => {
    try {
      const {
        userId,
        otp,
      } = req.body;

      if (!userId || !otp) {
        return res.status(400).json({
          message:
            "User ID and OTP are required",
        });
      }

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (!user.otp) {
        return res.status(400).json({
          message:
            "No OTP found. Please login again.",
        });
      }

      if (
        user.otpExpires &&
        new Date() > user.otpExpires
      ) {
        return res.status(400).json({
          message:
            "OTP has expired. Please login again.",
        });
      }

      if (user.otp !== otp) {
        return res.status(400).json({
          message: "Invalid OTP",
        });
      }

      user.otp = null;
      user.otpExpires = null;

      // =========================
      // REFERRAL REWARDS
      // =========================

      if (
        user.referredBy &&
        Number(user.referralBonusEarned || 0) === 0
      ) {
        // -------------------------
        // NEW CUSTOMER → ₹20
        // -------------------------

        user.walletBalance =
          Number(user.walletBalance || 0) + 20;

        user.referralBonusEarned = 20;

        await WalletTransaction.create({
          user: user._id,
          amount: 20,
          type: "credit",
          reason: "Referral Welcome Bonus",
          description:
            "₹20 bonus for joining NIVSSA Dine using a referral code.",
        });

        // -------------------------
        // REFERRER → ₹50
        // -------------------------

        const referrer =
          await User.findOne({
            referralCode: user.referredBy,
          });

        if (referrer) {
          referrer.walletBalance =
            Number(referrer.walletBalance || 0) + 50;

          await referrer.save();

          await WalletTransaction.create({
            user: referrer._id,
            amount: 50,
            type: "credit",
            reason: "Referral Reward",
            description:
              "₹50 earned for successfully referring a new NIVSSA Dine customer.",
          });

          console.log(
            `Referral reward: ₹20 to ${user.email} + ₹50 to ${referrer.email} ✅`
          );
        }
      }

      await user.save();

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          role: user.role,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.status(200).json({
        message:
          "OTP verified successfully",

        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          referralCode:
            user.referralCode,
          walletBalance:
            user.walletBalance,
          referredBy:
            user.referredBy,
          referralBonusEarned:
            user.referralBonusEarned,
        },
      });
    } catch (error) {
      console.error(
        "OTP verification error:",
        error.message
      );

      return res.status(500).json({
        message:
          "OTP verification failed",
      });
    }
  }
);

module.exports = router;