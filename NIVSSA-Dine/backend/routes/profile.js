const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const router = express.Router();

const authMiddleware = require("../middleware/auth");

/* =====================================================
   HELPERS
===================================================== */

const getUsersCollection = () => {
  return mongoose.connection.collection("users");
};

const generateReferralCode = () => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "NVS";

  for (let i = 0; i < 7; i++) {
    code += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return code;
};

const ensureCustomerAccountFields = async (
  user
) => {
  const users = getUsersCollection();

  let referralCode =
    user.referralCode || "";

  if (!referralCode) {
    let unique = false;

    while (!unique) {
      const candidate =
        generateReferralCode();

      const existing =
        await users.findOne({
          referralCode: candidate,
        });

      if (!existing) {
        referralCode = candidate;
        unique = true;
      }
    }
  }

  const walletBalance =
    typeof user.walletBalance === "number"
      ? user.walletBalance
      : 0;

  const updateData = {
    walletBalance,
    referralCode,
  };

  await users.updateOne(
    {
      _id: user._id,
    },
    {
      $set: updateData,
    }
  );

  return {
    referralCode,
    walletBalance,
  };
};

/* =====================================================
   GET CUSTOMER PROFILE
===================================================== */

router.get(
  "/me",
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message:
            "User authentication information missing",
        });
      }

      const users =
        getUsersCollection();

      const user =
        await users.findOne({
          _id: new mongoose.Types.ObjectId(
            req.user.id
          ),
        });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const accountFields =
        await ensureCustomerAccountFields(
          user
        );

      return res.status(200).json({
        user: {
          id: String(user._id),
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "customer",
          referralCode:
            accountFields.referralCode,
          walletBalance:
            accountFields.walletBalance,
        },
      });
    } catch (error) {
      console.error(
        "Get profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load customer profile",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   UPDATE CUSTOMER PROFILE
===================================================== */

router.patch(
  "/me",
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message:
            "User authentication information missing",
        });
      }

      const {
        name,
        phone,
        currentPassword,
        newPassword,
      } = req.body;

      const users =
        getUsersCollection();

      const user =
        await users.findOne({
          _id: new mongoose.Types.ObjectId(
            req.user.id
          ),
        });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const updateData = {};

      /* -------------------------------
         NAME
      -------------------------------- */

      if (
        typeof name === "string"
      ) {
        const cleanName =
          name.trim();

        if (!cleanName) {
          return res.status(400).json({
            message:
              "Name cannot be empty",
          });
        }

        if (
          cleanName.length > 100
        ) {
          return res.status(400).json({
            message:
              "Name is too long",
          });
        }

        updateData.name =
          cleanName;
      }

      /* -------------------------------
         PHONE
      -------------------------------- */

      if (
        typeof phone === "string"
      ) {
        const cleanPhone =
          phone.trim();

        if (
          cleanPhone &&
          !/^[0-9+\-\s()]{7,20}$/.test(
            cleanPhone
          )
        ) {
          return res.status(400).json({
            message:
              "Please enter a valid phone number",
          });
        }

        updateData.phone =
          cleanPhone;
      }

      /* -------------------------------
         PASSWORD CHANGE
      -------------------------------- */

      const wantsPasswordChange =
        currentPassword ||
        newPassword;

      if (wantsPasswordChange) {
        if (
          typeof currentPassword !==
            "string" ||
          !currentPassword
        ) {
          return res.status(400).json({
            message:
              "Current password is required",
          });
        }

        if (
          typeof newPassword !==
            "string" ||
          newPassword.length < 6
        ) {
          return res.status(400).json({
            message:
              "New password must be at least 6 characters",
          });
        }

        const passwordMatches =
          await bcrypt.compare(
            currentPassword,
            user.password
          );

        if (!passwordMatches) {
          return res.status(400).json({
            message:
              "Current password is incorrect",
          });
        }

        updateData.password =
          await bcrypt.hash(
            newPassword,
            10
          );
      }

      /* -------------------------------
         ENSURE ACCOUNT FIELDS
      -------------------------------- */

      let referralCode =
        user.referralCode ||
        "";

      if (!referralCode) {
        let unique = false;

        while (!unique) {
          const candidate =
            generateReferralCode();

          const existing =
            await users.findOne({
              referralCode:
                candidate,
            });

          if (!existing) {
            referralCode =
              candidate;
            unique = true;
          }
        }
      }

      updateData.referralCode =
        referralCode;

      if (
        typeof user.walletBalance !==
        "number"
      ) {
        updateData.walletBalance = 0;
      }

      /* -------------------------------
         SAVE
      -------------------------------- */

      await users.updateOne(
        {
          _id: new mongoose.Types.ObjectId(
            req.user.id
          ),
        },
        {
          $set: updateData,
        }
      );

      const updatedUser =
        await users.findOne({
          _id: new mongoose.Types.ObjectId(
            req.user.id
          ),
        });

      return res.status(200).json({
        message:
          "Profile updated successfully",
        user: {
          id: String(
            updatedUser._id
          ),
          name:
            updatedUser.name || "",
          email:
            updatedUser.email || "",
          phone:
            updatedUser.phone || "",
          role:
            updatedUser.role ||
            "customer",
          referralCode:
            updatedUser.referralCode ||
            referralCode,
          walletBalance:
            typeof updatedUser.walletBalance ===
            "number"
              ? updatedUser.walletBalance
              : 0,
        },
      });
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update profile",
        error: error.message,
      });
    }
  }
);

module.exports = router;