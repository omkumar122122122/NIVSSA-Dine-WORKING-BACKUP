const express = require("express");
const router = express.Router();

const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const WalletTransaction = require("../models/WalletTransaction");

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

const nodemailer = require("nodemailer");

/* =====================================================
   CONSTANTS
===================================================== */

const CUSTOMER_CANCELLATION_CUTOFF_MINUTES = 15;

/* =====================================================
   EMAIL CONFIGURATION
===================================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

/* =====================================================
   SEND EMAIL
===================================================== */

const sendEmail = async (to, subject, html) => {
  try {
    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_APP_PASSWORD
    ) {
      console.log(
        "Email credentials not configured"
      );
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    console.log(
      "Email sent successfully to:",
      to
    );
  } catch (error) {
    console.error(
      "Email sending error:",
      error.message
    );
  }
};

/* =====================================================
   CHECK TABLE AVAILABILITY
===================================================== */

const isTableAvailable = async (
  tableId,
  requestedDate,
  excludeReservationId = null
) => {
  const table =
    await Table.findById(tableId);

  if (!table) {
    return false;
  }

  const requestedTime =
    new Date(requestedDate).getTime();

  const turnTime =
    Number(table.turnTime) || 60;

  const startTime = new Date(
    requestedTime -
      turnTime * 60 * 1000
  );

  const endTime = new Date(
    requestedTime +
      turnTime * 60 * 1000
  );

  const query = {
    $or: [
      {
        table: tableId,
      },
      {
        tables: tableId,
      },
    ],

    status: {
      $in: ["confirmed"],
    },

    date: {
      $gte: startTime,
      $lte: endTime,
    },
  };

  if (excludeReservationId) {
    query._id = {
      $ne: excludeReservationId,
    };
  }

  const existingReservation =
    await Reservation.findOne(
      query
    );

  return !existingReservation;
};

/* =====================================================
   REFUND WALLET
===================================================== */

const refundWalletForReservation = async (
  reservation,
  reason
) => {
  const amount =
    Number(
      reservation.walletAmountUsed || 0
    );

  if (
    amount <= 0 ||
    reservation.walletRefunded
  ) {
    return {
      refunded: false,
      amount: 0,
    };
  }

  const user =
    await User.findById(
      reservation.user
    );

  if (!user) {
    throw new Error(
      "User not found for wallet refund"
    );
  }

  /* -----------------------------------------------
     CREDIT WALLET
  ------------------------------------------------ */

  user.walletBalance =
    Number(user.walletBalance || 0) +
    amount;

  await user.save();

  /* -----------------------------------------------
     MARK RESERVATION REFUNDED
  ------------------------------------------------ */

  reservation.walletRefunded =
    true;

  reservation.walletRefundReason =
    reason;

  await reservation.save();

  /* -----------------------------------------------
     CREATE TRANSACTION
  ------------------------------------------------ */

  try {
    await WalletTransaction.create({
      user: user._id,
      amount,
      type: "credit",
      reason,
      bookingId: reservation._id,
      description:
        `₹${amount} wallet refund for reservation ${reservation.bookingId}.`,
    });
  } catch (error) {
    /* ---------------------------------------------
       ROLLBACK WALLET IF TRANSACTION FAILED
    --------------------------------------------- */

    user.walletBalance =
      Math.max(
        0,
        Number(user.walletBalance || 0) -
          amount
      );

    await user.save();

    reservation.walletRefunded =
      false;

    reservation.walletRefundReason =
      null;

    await reservation.save();

    throw error;
  }

  return {
    refunded: true,
    amount,
  };
};

/* =====================================================
   ROLLBACK WALLET DEBIT
===================================================== */

const rollbackWalletDebit = async (
  userId,
  amount,
  bookingId
) => {
  if (amount <= 0) {
    return;
  }

  try {
    const user =
      await User.findById(userId);

    if (!user) {
      return;
    }

    user.walletBalance =
      Number(user.walletBalance || 0) +
      amount;

    await user.save();

    await WalletTransaction.create({
      user: user._id,
      amount,
      type: "credit",
      reason:
        "Reservation Wallet Debit Reversal",
      description:
        `Wallet debit reversed because reservation ${bookingId || ""} could not be completed.`,
    });
  } catch (error) {
    console.error(
      "Wallet debit rollback error:",
      error.message
    );
  }
};

/* =====================================================
   CREATE RESERVATION
===================================================== */

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    let walletDebited = 0;
    let createdReservation = null;
    const changedTables = [];

    try {
      console.log(
        "Create reservation request:",
        req.body
      );

      const {
        restaurant,
        table,
        date,
        partySize,
        seatingPreference,
        notes,
        tables,
        useWallet,
      } = req.body;

      if (!req.user.id) {
        return res.status(401).json({
          message:
            "User authentication information missing",
        });
      }

      if (!restaurant) {
        return res.status(400).json({
          message:
            "Restaurant is required",
        });
      }

      if (!table && !Array.isArray(tables)) {
        return res.status(400).json({
          message:
            "Table is required",
        });
      }

      if (!date) {
        return res.status(400).json({
          message:
            "Reservation date and time are required",
        });
      }

      if (!partySize) {
        return res.status(400).json({
          message:
            "Party size is required",
        });
      }

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const userEmail =
        user.email;

      const requestedDate =
        new Date(date);

      if (
        Number.isNaN(
          requestedDate.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid reservation date",
        });
      }

      if (
        requestedDate.getTime() <=
        Date.now()
      ) {
        return res.status(400).json({
          message:
            "Reservation time must be in the future",
        });
      }

      const requestedPartySize =
        Number(partySize);

      if (
        !Number.isInteger(
          requestedPartySize
        ) ||
        requestedPartySize < 1
      ) {
        return res.status(400).json({
          message:
            "Invalid party size",
        });
      }

      /* -----------------------------------------------
         SELECT TABLE IDS
      ------------------------------------------------ */

      let selectedTableIds = [];

      if (
        Array.isArray(tables) &&
        tables.length > 0
      ) {
        selectedTableIds =
          tables.filter(Boolean);
      }

      if (
        selectedTableIds.length === 0 &&
        table
      ) {
        selectedTableIds = [table];
      }

      if (
        selectedTableIds.length === 0
      ) {
        return res.status(400).json({
          message:
            "At least one table is required",
        });
      }

      /* -----------------------------------------------
         GET SELECTED TABLES
      ------------------------------------------------ */

      const selectedTables = [];

      for (
        const tableId of selectedTableIds
      ) {
        const selectedTable =
          await Table.findById(
            tableId
          );

        if (!selectedTable) {
          return res.status(404).json({
            message:
              "One of the selected tables was not found",
          });
        }

        selectedTables.push(
          selectedTable
        );
      }

      /* -----------------------------------------------
         RESTAURANT CHECK
      ------------------------------------------------ */

      for (
        const selectedTable of
          selectedTables
      ) {
        if (
          String(
            selectedTable.restaurant
          ) !== String(restaurant)
        ) {
          return res.status(400).json({
            message:
              "Selected table does not belong to this restaurant",
          });
        }
      }

      /* -----------------------------------------------
         CAPACITY CHECK
      ------------------------------------------------ */

      const totalCapacity =
        selectedTables.reduce(
          (
            total,
            selectedTable
          ) =>
            total +
            Number(
              selectedTable.capacity
            ),
          0
        );

      if (
        totalCapacity <
        requestedPartySize
      ) {
        return res.status(400).json({
          message:
            "Selected tables cannot accommodate this party size",
        });
      }

      /* -----------------------------------------------
         SEATING PREFERENCE CHECK
      ------------------------------------------------ */

      if (
        seatingPreference &&
        seatingPreference !== "any"
      ) {
        const requestedSeating =
          String(
            seatingPreference
          ).toLowerCase();

        for (
          const selectedTable of
            selectedTables
        ) {
          const sectionMatches =
            String(
              selectedTable.section
            ).toLowerCase() ===
            requestedSeating;

          const seatingTypeMatches =
            String(
              selectedTable.seatingType
            ).toLowerCase() ===
            requestedSeating;

          if (
            !sectionMatches &&
            !seatingTypeMatches
          ) {
            return res.status(400).json({
              message:
                "Selected table does not match your seating preference",
            });
          }
        }
      }

      /* -----------------------------------------------
         TABLE AVAILABILITY
      ------------------------------------------------ */

      for (
        const selectedTable of
          selectedTables
      ) {
        const available =
          await isTableAvailable(
            selectedTable._id,
            requestedDate
          );

        if (!available) {
          return res.status(409).json({
            message:
              `Table ${selectedTable.tableNumber} is already reserved for the selected time`,
          });
        }

        if (
          selectedTable.status !==
            "available" &&
          selectedTable.status !==
            "reserved"
        ) {
          return res.status(400).json({
            message:
              `Table ${selectedTable.tableNumber} is currently unavailable`,
          });
        }
      }

      /* -----------------------------------------------
         WALLET AMOUNT
         
         If customer chooses wallet:
         use the FULL currently available balance.
      ------------------------------------------------ */

      let walletAmountUsed = 0;

      if (useWallet === true) {
        walletAmountUsed =
          Math.max(
            0,
            Number(
              user.walletBalance || 0
            )
          );
      }

      /* -----------------------------------------------
         WALLET DEBIT
      ------------------------------------------------ */

      if (walletAmountUsed > 0) {
        const updatedUser =
          await User.findOneAndUpdate(
            {
              _id: user._id,
              walletBalance: {
                $gte: walletAmountUsed,
              },
            },
            {
              $inc: {
                walletBalance:
                  -walletAmountUsed,
              },
            },
            {
              new: true,
            }
          );

        if (!updatedUser) {
          return res.status(409).json({
            message:
              "Your wallet balance changed. Please refresh and try again.",
          });
        }

        walletDebited =
          walletAmountUsed;

        await WalletTransaction.create({
          user: user._id,
          amount:
            walletAmountUsed,
          type: "debit",
          reason:
            "Reservation Wallet Redemption",
          description:
            `₹${walletAmountUsed} wallet balance redeemed for reservation.`,
        });
      }

      /* -----------------------------------------------
         CREATE RESERVATION
      ------------------------------------------------ */

      const reservation =
        new Reservation({
          user:
            req.user.id,

          restaurant:
            restaurant,

          table:
            selectedTables[0]._id,

          tables:
            selectedTables.map(
              (selectedTable) =>
                selectedTable._id
            ),

          date:
            requestedDate,

          partySize:
            requestedPartySize,

          seatingPreference:
            seatingPreference ||
            "any",

          status:
            "confirmed",

          arrivalStatus:
            "pending",

          gracePeriodMinutes:
            15,

          notes:
            notes || "",

          walletAmountUsed:
            walletAmountUsed,

          walletRefunded:
            false,

          walletRefundReason:
            null,
        });

      await reservation.save();

      createdReservation =
        reservation;

      /* -----------------------------------------------
         MARK TABLES RESERVED
      ------------------------------------------------ */

      for (
        const selectedTable of
          selectedTables
      ) {
        const previousStatus =
          selectedTable.status;

        selectedTable.status =
          "reserved";

        await selectedTable.save();

        changedTables.push({
          table:
            selectedTable,
          previousStatus,
        });
      }

      console.log(
        "Reservation created:",
        reservation.bookingId,
        "| Wallet used:",
        walletAmountUsed
      );

      /* -----------------------------------------------
         POPULATE RESERVATION
      ------------------------------------------------ */

      const populatedReservation =
        await Reservation.findById(
          reservation._id
        )
          .populate(
            "restaurant",
            "name address email phone openingTime closingTime"
          )
          .populate(
            "table",
            "tableNumber capacity section seatingType turnTime"
          )
          .populate(
            "tables",
            "tableNumber capacity section seatingType turnTime"
          );

      /* -----------------------------------------------
         SEND CONFIRMATION EMAIL
      ------------------------------------------------ */

      const tableNumbers =
        selectedTables
          .map(
            (selectedTable) =>
              selectedTable.tableNumber
          )
          .join(", ");

      await sendEmail(
        userEmail,

        "NIVSSA Dine - Reservation Confirmed",

        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">

          <h2>Reservation Confirmed</h2>

          <p>
            Hello ${user.name || "Customer"},
          </p>

          <p>
            Your NIVSSA Dine restaurant reservation has been successfully confirmed.
          </p>

          <div style="background: #f5f5f5; padding: 18px; border-radius: 10px;">

            <p>
              <strong>Booking ID:</strong>
              ${reservation.bookingId}
            </p>

            <p>
              <strong>Restaurant:</strong>
              ${populatedReservation.restaurant.name}
            </p>

            <p>
              <strong>Address:</strong>
              ${populatedReservation.restaurant.address}
            </p>

            <p>
              <strong>Restaurant Phone:</strong>
              ${
                populatedReservation.restaurant.phone ||
                "Not available"
              }
            </p>

            <p>
              <strong>Date:</strong>
              ${requestedDate.toLocaleDateString(
                "en-IN"
              )}
            </p>

            <p>
              <strong>Time:</strong>
              ${requestedDate.toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </p>

            <p>
              <strong>Guests:</strong>
              ${requestedPartySize}
            </p>

            <p>
              <strong>Table:</strong>
              ${tableNumbers}
            </p>

            <p>
              <strong>Seating:</strong>
              ${seatingPreference || "Any"}
            </p>

            ${
              walletAmountUsed > 0
                ? `
                  <p>
                    <strong>Wallet Redeemed:</strong>
                    ₹${walletAmountUsed}
                  </p>

                  <p>
                    Your wallet redemption is held against this reservation.
                    Eligible early cancellation will return it to your NIVSSA wallet.
                    Late cancellation and no-show are not refundable.
                  </p>
                `
                : `
                  <p>
                    <strong>Wallet Redeemed:</strong>
                    ₹0
                  </p>
                `
            }

          </div>

          <p style="margin-top: 20px;">
            Please arrive on time for your reservation.
          </p>

          <p>
            Thank you for choosing NIVSSA Dine.
          </p>

        </div>
        `
      );

      return res.status(201).json({
        message:
          "Reservation created successfully",

        bookingId:
          reservation.bookingId,

        walletAmountUsed:
          walletAmountUsed,

        walletBalanceAfter:
          Math.max(
            0,
            Number(user.walletBalance || 0) -
              walletAmountUsed
          ),

        reservation:
          populatedReservation,
      });
    } catch (error) {
      console.error(
        "Create reservation error:",
        error
      );

      /* -----------------------------------------------
         RESTORE TABLE STATUS
      ------------------------------------------------ */

      for (
        const changed of changedTables
      ) {
        try {
          changed.table.status =
            changed.previousStatus;

          await changed.table.save();
        } catch (tableError) {
          console.error(
            "Table rollback error:",
            tableError.message
          );
        }
      }

      /* -----------------------------------------------
         DELETE CREATED RESERVATION
      ------------------------------------------------ */

      if (createdReservation) {
        try {
          await Reservation.findByIdAndDelete(
            createdReservation._id
          );
        } catch (deleteError) {
          console.error(
            "Reservation rollback error:",
            deleteError.message
          );
        }
      }

      /* -----------------------------------------------
         ROLLBACK WALLET
      ------------------------------------------------ */

      if (walletDebited > 0) {
        await rollbackWalletDebit(
          req.user?.id,
          walletDebited,
          createdReservation?.bookingId ||
            null
        );
      }

      return res.status(500).json({
        message:
          "Failed to create reservation",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   MY BOOKINGS
===================================================== */

router.get(
  "/my",
  authMiddleware,
  async (req, res) => {
    try {
      const reservations =
        await Reservation.find({
          user: req.user.id,
        })
          .populate(
            "restaurant",
            "name address phone email openingTime closingTime"
          )
          .populate(
            "table",
            "tableNumber capacity section seatingType status turnTime"
          )
          .populate(
            "tables",
            "tableNumber capacity section seatingType status turnTime"
          )
          .sort({
            date: -1,
          });

      return res.status(200).json({
        reservations,
      });
    } catch (error) {
      console.error(
        "My bookings error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch bookings",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   STAFF - ALL RESERVATIONS
===================================================== */

router.get(
  "/staff/all",
  authMiddleware,
  roleMiddleware(
    "staff",
    "admin"
  ),
  async (req, res) => {
    try {
      const reservations =
        await Reservation.find({})
          .populate(
            "user",
            "name email phone role"
          )
          .populate(
            "restaurant",
            "name address phone email openingTime closingTime"
          )
          .populate(
            "table",
            "tableNumber capacity section seatingType status turnTime"
          )
          .populate(
            "tables",
            "tableNumber capacity section seatingType status turnTime"
          )
          .sort({
            date: 1,
          });

      return res.status(200).json({
        reservations,
      });
    } catch (error) {
      console.error(
        "Staff reservations error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch staff reservations",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   GET BOOKING BY BOOKING ID
===================================================== */

router.get(
  "/booking/:bookingId",
  authMiddleware,
  async (req, res) => {
    try {
      const reservation =
        await Reservation.findOne({
          bookingId:
            req.params.bookingId,
        })
          .populate(
            "user",
            "name email phone role"
          )
          .populate(
            "restaurant",
            "name address phone email openingTime closingTime"
          )
          .populate(
            "table",
            "tableNumber capacity section seatingType status turnTime"
          )
          .populate(
            "tables",
            "tableNumber capacity section seatingType status turnTime"
          );

      if (!reservation) {
        return res.status(404).json({
          message:
            "Reservation not found",
        });
      }

      if (
        req.user.role ===
          "customer" &&
        String(
          reservation.user._id
        ) !==
          String(req.user.id)
      ) {
        return res.status(403).json({
          message:
            "Access denied",
        });
      }

      return res.status(200).json({
        reservation,
      });
    } catch (error) {
      console.error(
        "Get booking error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch reservation",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   CANCEL RESERVATION
===================================================== */

router.patch(
  "/:id/cancel",
  authMiddleware,
  async (req, res) => {
    try {
      const reservation =
        await Reservation.findById(
          req.params.id
        );

      if (!reservation) {
        return res.status(404).json({
          message:
            "Reservation not found",
        });
      }

      const isStaff =
        req.user.role === "staff" ||
        req.user.role === "admin";

      if (
        !isStaff &&
        String(reservation.user) !==
          String(req.user.id)
      ) {
        return res.status(403).json({
          message:
            "You can cancel only your own reservation",
        });
      }

      if (
        reservation.status !==
        "confirmed"
      ) {
        return res.status(400).json({
          message:
            "Only confirmed reservations can be cancelled",
        });
      }

      /* -----------------------------------------------
         GET USER AND RESTAURANT
      ------------------------------------------------ */

      const user =
        await User.findById(
          reservation.user
        );

      const restaurant =
        await Restaurant.findById(
          reservation.restaurant
        );

      /* -----------------------------------------------
         TABLE IDS
      ------------------------------------------------ */

      const tableIds =
        Array.isArray(
          reservation.tables
        ) &&
        reservation.tables.length > 0
          ? reservation.tables
          : [reservation.table];

      /* -----------------------------------------------
         GET TABLE NUMBERS BEFORE RELEASE
      ------------------------------------------------ */

      const cancelledTables =
        [];

      for (
        const tableId of tableIds
      ) {
        const table =
          await Table.findById(
            tableId
          );

        if (table) {
          cancelledTables.push(
            table.tableNumber
          );
        }
      }

      /* -----------------------------------------------
         CHECK WALLET REFUND ELIGIBILITY
         
         Customer:
         refund when canceling 15+
         minutes before reservation.

         Staff/admin:
         full refund because restaurant
         side cancellation should not punish customer.
      ------------------------------------------------ */

      const now =
        new Date();

      const cancellationDeadline =
        reservation.date.getTime() -
        CUSTOMER_CANCELLATION_CUTOFF_MINUTES *
          60 *
          1000;

      const earlyEnoughForRefund =
        now.getTime() <=
        cancellationDeadline;

      const walletRefundEligible =
        isStaff ||
        earlyEnoughForRefund;

      /* -----------------------------------------------
         CANCEL RESERVATION
      ------------------------------------------------ */

      reservation.status =
        "cancelled";

      reservation.cancelledAt =
        new Date();

      await reservation.save();

      /* -----------------------------------------------
         REFUND WALLET WHEN ELIGIBLE
      ------------------------------------------------ */

      let walletRefundAmount = 0;

      if (
        walletRefundEligible &&
        Number(
          reservation.walletAmountUsed || 0
        ) > 0 &&
        !reservation.walletRefunded
      ) {
        const refundResult =
          await refundWalletForReservation(
            reservation,
            "Reservation Cancellation Refund"
          );

        walletRefundAmount =
          refundResult.amount;
      } else if (
        Number(
          reservation.walletAmountUsed || 0
        ) > 0
      ) {
        reservation.walletRefundReason =
          isStaff
            ? null
            : "Late Cancellation - No Refund";

        await reservation.save();
      }

      /* -----------------------------------------------
         FREE ALL TABLES
      ------------------------------------------------ */

      for (
        const tableId of tableIds
      ) {
        const table =
          await Table.findById(
            tableId
          );

        if (table) {
          table.status =
            "available";

          await table.save();
        }
      }

      /* -----------------------------------------------
         SEND CANCELLATION EMAIL
      ------------------------------------------------ */

      if (
        user &&
        user.email
      ) {
        const walletMessage =
          walletRefundAmount > 0
            ? `
              <p>
                <strong>Wallet Refund:</strong>
                ₹${walletRefundAmount} has been returned to your NIVSSA wallet.
              </p>
            `
            : Number(
                reservation.walletAmountUsed || 0
              ) > 0
            ? `
              <p>
                <strong>Wallet Refund:</strong>
                No refund was issued because the reservation was cancelled
                within the 15-minute cancellation window.
              </p>
            `
            : `
              <p>
                <strong>Wallet Refund:</strong>
                No wallet amount was used for this reservation.
              </p>
            `;

        await sendEmail(
          user.email,

          "NIVSSA Dine - Reservation Cancelled",

          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #222;">

            <h2 style="margin-bottom: 5px;">
              Reservation Cancelled
            </h2>

            <p>
              Hello ${user.name || "Customer"},
            </p>

            <p>
              Your NIVSSA Dine restaurant reservation has been successfully cancelled.
            </p>

            <div style="
              background: #f5f5f5;
              padding: 18px;
              border-radius: 10px;
              margin-top: 20px;
            ">

              <p>
                <strong>Booking ID:</strong>
                ${reservation.bookingId}
              </p>

              <p>
                <strong>Restaurant:</strong>
                ${restaurant?.name || "NIVSSA Dine"}
              </p>

              <p>
                <strong>Address:</strong>
                ${restaurant?.address || "N/A"}
              </p>

              <p>
                <strong>Restaurant Phone:</strong>
                ${restaurant?.phone || "Not available"}
              </p>

              <p>
                <strong>Date:</strong>
                ${reservation.date.toLocaleDateString(
                  "en-IN"
                )}
              </p>

              <p>
                <strong>Time:</strong>
                ${reservation.date.toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>

              <p>
                <strong>Guests:</strong>
                ${reservation.partySize}
              </p>

              <p>
                <strong>Table:</strong>
                ${
                  cancelledTables.length > 0
                    ? cancelledTables.join(", ")
                    : "N/A"
                }
              </p>

              <p>
                <strong>Status:</strong>
                Cancelled
              </p>

              ${walletMessage}

            </div>

            <p style="margin-top: 20px;">
              Your reserved table has been released successfully.
            </p>

            <p>
              Thank you for choosing NIVSSA Dine.
            </p>

          </div>
          `
        );
      }

      return res.status(200).json({
        message:
          "Reservation cancelled successfully",

        walletRefunded:
          walletRefundAmount > 0,

        walletRefundAmount,

        refundEligible:
          walletRefundEligible,

        reservation,
      });
    } catch (error) {
      console.error(
        "Cancel reservation error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to cancel reservation",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   CUSTOMER - RESCHEDULE
===================================================== */

router.patch(
  "/:id/reschedule",
  authMiddleware,
  async (req, res) => {
    try {
      console.log(
        "Reschedule request:",
        req.params.id,
        req.body
      );

      const {
        newDate,
        newTable,
        newTables,
        paymentId,
        paymentOrderId,
        paymentAmount,
      } = req.body;

      const reservation =
        await Reservation.findOne({
          bookingId:
            req.params.id,
        });

      if (!reservation) {
        return res.status(404).json({
          message:
            "Reservation not found",
        });
      }

      if (
        String(reservation.user) !==
        String(req.user.id)
      ) {
        return res.status(403).json({
          message:
            "You can reschedule only your own reservation",
        });
      }

      if (
        reservation.status !==
        "confirmed"
      ) {
        return res.status(400).json({
          message:
            "Only confirmed reservations can be rescheduled",
        });
      }

      /* -----------------------------------------------
         15 MINUTE RULE
      ------------------------------------------------ */

      const now =
        new Date();

      const minimumAllowedTime =
        reservation.date.getTime() -
        15 * 60 * 1000;

      if (
        now.getTime() >=
        minimumAllowedTime
      ) {
        return res.status(400).json({
          message:
            "Rescheduling is allowed only before 15 minutes of the reservation time",
        });
      }

      /* -----------------------------------------------
         NEW DATE
      ------------------------------------------------ */

      if (!newDate) {
        return res.status(400).json({
          message:
            "New reservation date and time are required",
        });
      }

      const requestedNewDate =
        new Date(newDate);

      if (
        Number.isNaN(
          requestedNewDate.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid new reservation time",
        });
      }

      if (
        requestedNewDate.getTime() <=
        Date.now()
      ) {
        return res.status(400).json({
          message:
            "New reservation time must be in the future",
        });
      }

      /* -----------------------------------------------
         TABLE SELECTION
      ------------------------------------------------ */

      let selectedTableIds =
        [];

      if (
        Array.isArray(newTables) &&
        newTables.length > 0
      ) {
        selectedTableIds =
          newTables.filter(Boolean);
      }

      if (
        selectedTableIds.length === 0 &&
        newTable
      ) {
        selectedTableIds = [
          newTable,
        ];
      }

      if (
        selectedTableIds.length === 0
      ) {
        if (
          Array.isArray(
            reservation.tables
          ) &&
          reservation.tables.length > 0
        ) {
          selectedTableIds =
            reservation.tables.map(
              (tableId) =>
                String(tableId)
            );
        } else {
          selectedTableIds = [
            String(
              reservation.table
            ),
          ];
        }
      }

      /* -----------------------------------------------
         FEE
      ------------------------------------------------ */

      const fee =
        reservation.partySize > 4
          ? 10
          : 0;

      /* -----------------------------------------------
         PAYMENT CHECK
      ------------------------------------------------ */

      if (fee > 0) {
        if (
          !paymentId ||
          !paymentOrderId
        ) {
          return res.status(400).json({
            message:
              "₹10 payment is required for rescheduling this booking",
          });
        }

        if (
          Number(paymentAmount) !==
          10
        ) {
          return res.status(400).json({
            message:
              "Invalid reschedule payment amount",
          });
        }
      }

      /* -----------------------------------------------
         GET USER
      ------------------------------------------------ */

      const user =
        await User.findById(
          reservation.user
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      /* -----------------------------------------------
         GET SELECTED TABLES
      ------------------------------------------------ */

      const selectedTables =
        [];

      for (
        const tableId of
          selectedTableIds
      ) {
        const table =
          await Table.findById(
            tableId
          );

        if (!table) {
          return res.status(404).json({
            message:
              "One of the selected tables was not found",
          });
        }

        selectedTables.push(
          table
        );
      }

      /* -----------------------------------------------
         RESTAURANT CHECK
      ------------------------------------------------ */

      for (
        const table of
          selectedTables
      ) {
        if (
          String(
            table.restaurant
          ) !==
          String(
            reservation.restaurant
          )
        ) {
          return res.status(400).json({
            message:
              "Selected table does not belong to the same restaurant",
          });
        }
      }

      /* -----------------------------------------------
         CAPACITY CHECK
      ------------------------------------------------ */

      const totalCapacity =
        selectedTables.reduce(
          (
            total,
            table
          ) =>
            total +
            Number(
              table.capacity
            ),
          0
        );

      if (
        totalCapacity <
        reservation.partySize
      ) {
        return res.status(400).json({
          message:
            "Selected tables cannot accommodate the party size",
        });
      }

      /* -----------------------------------------------
         TABLE AVAILABILITY
      ------------------------------------------------ */

      for (
        const table of
          selectedTables
      ) {
        const available =
          await isTableAvailable(
            table._id,
            requestedNewDate,
            reservation._id
          );

        if (!available) {
          return res.status(409).json({
            message:
              `Table ${table.tableNumber} is not available at the new time`,
          });
        }
      }

      /* -----------------------------------------------
         ORIGINAL TABLES
      ------------------------------------------------ */

      let oldTableIds =
        [];

      if (
        Array.isArray(
          reservation.tables
        ) &&
        reservation.tables.length > 0
      ) {
        oldTableIds =
          reservation.tables.map(
            (tableId) =>
              String(tableId)
          );
      } else {
        oldTableIds = [
          String(
            reservation.table
          ),
        ];
      }

      const oldTables =
        [];

      for (
        const oldTableId of
          oldTableIds
      ) {
        const oldTable =
          await Table.findById(
            oldTableId
          );

        if (oldTable) {
          oldTables.push(
            oldTable
          );
        }
      }

      if (
        oldTables.length === 0
      ) {
        return res.status(404).json({
          message:
            "Original table not found",
        });
      }

      /* -----------------------------------------------
         RESTAURANT INFO
      ------------------------------------------------ */

      const restaurantInfo =
        await Restaurant.findById(
          reservation.restaurant
        );

      if (!restaurantInfo) {
        return res.status(404).json({
          message:
            "Restaurant not found",
        });
      }

      /* -----------------------------------------------
         WALLET AMOUNT CARRIED FORWARD
         
         IMPORTANT:
         Do NOT debit wallet again.
         The original wallet amount stays
         attached to the new reservation.
      ------------------------------------------------ */

      const walletAmountUsed =
        Number(
          reservation.walletAmountUsed || 0
        );

      /* -----------------------------------------------
         CREATE NEW RESERVATION
      ------------------------------------------------ */

      const newReservation =
        new Reservation({
          user:
            reservation.user,

          restaurant:
            reservation.restaurant,

          table:
            selectedTables[0]._id,

          tables:
            selectedTables.map(
              (table) =>
                table._id
            ),

          date:
            requestedNewDate,

          partySize:
            reservation.partySize,

          seatingPreference:
            reservation.seatingPreference,

          status:
            "confirmed",

          arrivalStatus:
            "pending",

          gracePeriodMinutes:
            reservation.gracePeriodMinutes,

          notes:
            reservation.notes,

          walletAmountUsed:
            walletAmountUsed,

          walletRefunded:
            false,

          walletRefundReason:
            null,

          rescheduleCount:
            reservation.rescheduleCount + 1,

          rescheduleFee:
            fee,

          rescheduledFrom:
            reservation._id,
        });

      await newReservation.save();

      /* -----------------------------------------------
         UPDATE OLD RESERVATION
      ------------------------------------------------ */

      reservation.status =
        "rescheduled";

      reservation.rescheduledAt =
        new Date();

      reservation.rescheduledTo =
        newReservation._id;

      await reservation.save();

      /* -----------------------------------------------
         FREE OLD TABLES
      ------------------------------------------------ */

      for (
        const oldTable of
          oldTables
      ) {
        const stillSelected =
          selectedTableIds.some(
            (tableId) =>
              String(tableId) ===
              String(oldTable._id)
          );

        if (!stillSelected) {
          oldTable.status =
            "available";

          await oldTable.save();
        }
      }

      /* -----------------------------------------------
         MARK NEW TABLES RESERVED
      ------------------------------------------------ */

      for (
        const table of
          selectedTables
      ) {
        table.status =
          "reserved";

        await table.save();
      }

      /* -----------------------------------------------
         TABLE NUMBERS
      ------------------------------------------------ */

      const oldTableNumbers =
        oldTables
          .map(
            (table) =>
              table.tableNumber
          )
          .join(", ");

      const newTableNumbers =
        selectedTables
          .map(
            (table) =>
              table.tableNumber
          )
          .join(", ");

      /* -----------------------------------------------
         SEND RESCHEDULE EMAIL
      ------------------------------------------------ */

      await sendEmail(
        user.email,

        "NIVSSA Dine - Reservation Updated",

        `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 20px; color: #222;">

          <h2 style="margin-bottom: 5px;">
            Reservation Updated Successfully
          </h2>

          <p>
            Hello ${user.name || "Customer"},
          </p>

          <p>
            Your NIVSSA Dine reservation has been successfully rescheduled.
          </p>

          ${
            fee > 0
              ? `
                <div style="
                  background: #ecfdf5;
                  border: 1px solid #86efac;
                  padding: 18px;
                  border-radius: 10px;
                  margin: 20px 0;
                ">

                  <h3 style="margin-top: 0;">
                    ₹10 Payment Received
                  </h3>

                  <p>
                    <strong>Payment Status:</strong>
                    Successful
                  </p>

                  <p>
                    <strong>Amount Paid:</strong>
                    ₹10
                  </p>

                  <p>
                    <strong>Payment ID:</strong>
                    ${paymentId}
                  </p>

                  <p>
                    <strong>Order ID:</strong>
                    ${paymentOrderId}
                  </p>

                </div>
              `
              : `
                <div style="
                  background: #ecfdf5;
                  border: 1px solid #86efac;
                  padding: 18px;
                  border-radius: 10px;
                  margin: 20px 0;
                ">

                  <h3 style="margin-top: 0;">
                    Reservation Update Confirmed
                  </h3>

                  <p style="margin-bottom: 0;">
                    No reschedule fee was charged for this booking.
                  </p>

                </div>
              `
          }

          <div style="
            background: #f5f5f5;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
          ">

            <h3>
              Updated Reservation Details
            </h3>

            <p>
              <strong>New Booking ID:</strong>
              ${newReservation.bookingId}
            </p>

            <p>
              <strong>Restaurant:</strong>
              ${restaurantInfo.name}
            </p>

            <p>
              <strong>Address:</strong>
              ${restaurantInfo.address}
            </p>

            <p>
              <strong>Restaurant Phone:</strong>
              ${restaurantInfo.phone || "Not available"}
            </p>

            <p>
              <strong>New Date:</strong>
              ${requestedNewDate.toLocaleDateString(
                "en-IN"
              )}
            </p>

            <p>
              <strong>New Time:</strong>
              ${requestedNewDate.toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </p>

            <p>
              <strong>Guests:</strong>
              ${reservation.partySize}
            </p>

            <p>
              <strong>New Tables:</strong>
              ${newTableNumbers}
            </p>

            <p>
              <strong>Seating:</strong>
              ${
                reservation.seatingPreference ||
                "Any"
              }
            </p>

            ${
              walletAmountUsed > 0
                ? `
                  <p>
                    <strong>Wallet Redeemed:</strong>
                    ₹${walletAmountUsed}
                  </p>

                  <p>
                    The redeemed wallet amount has been transferred
                    to the new reservation and was not charged again.
                  </p>
                `
                : `
                  <p>
                    <strong>Wallet Redeemed:</strong>
                    ₹0
                  </p>
                `
            }

            <p>
              <strong>Status:</strong>
              Confirmed
            </p>

          </div>

          <div style="
            background: #fff7ed;
            border: 1px solid #fed7aa;
            padding: 18px;
            border-radius: 10px;
            margin-top: 20px;
          ">

            <h3>
              Previous Reservation
            </h3>

            <p>
              <strong>Previous Booking ID:</strong>
              ${reservation.bookingId}
            </p>

            <p>
              <strong>Previous Date:</strong>
              ${reservation.date.toLocaleDateString(
                "en-IN"
              )}
            </p>

            <p>
              <strong>Previous Time:</strong>
              ${reservation.date.toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </p>

            <p>
              <strong>Previous Tables:</strong>
              ${oldTableNumbers}
            </p>

            <p style="margin-bottom: 0;">
              This previous reservation has been marked as rescheduled.
            </p>

          </div>

          <p style="margin-top: 25px;">
            Please arrive on time for your updated reservation.
          </p>

          <p>
            Thank you for choosing NIVSSA Dine.
          </p>

        </div>
        `
      );

      console.log(
        `Reservation rescheduled successfully: ${reservation.bookingId} -> ${newReservation.bookingId}`
      );

      return res.status(200).json({
        message:
          fee > 0
            ? "Reservation rescheduled successfully. ₹10 payment received and confirmation email sent."
            : "Reservation rescheduled successfully and confirmation email sent.",

        fee,

        paymentId:
          paymentId || null,

        paymentOrderId:
          paymentOrderId || null,

        walletAmountUsed,

        oldBookingId:
          reservation.bookingId,

        newBookingId:
          newReservation.bookingId,

        oldReservation:
          reservation,

        reservation:
          newReservation,
      });
    } catch (error) {
      console.error(
        "Customer reschedule error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to reschedule reservation",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   STAFF - RESCHEDULE
===================================================== */

router.patch(
  "/staff/:id/reschedule",
  authMiddleware,
  roleMiddleware(
    "staff",
    "admin"
  ),
  async (req, res) => {
    try {
      const {
        date,
        table,
      } = req.body;

      const reservation =
        await Reservation.findById(
          req.params.id
        );

      if (!reservation) {
        return res.status(404).json({
          message:
            "Reservation not found",
        });
      }

      if (
        reservation.status !==
        "confirmed"
      ) {
        return res.status(400).json({
          message:
            "Only confirmed reservations can be rescheduled",
        });
      }

      const newDate =
        new Date(date);

      if (
        Number.isNaN(
          newDate.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid new reservation time",
        });
      }

      if (
        newDate.getTime() <=
        Date.now()
      ) {
        return res.status(400).json({
          message:
            "New reservation time must be in the future",
        });
      }

      const newTableId =
        table ||
        reservation.table;

      const available =
        await isTableAvailable(
          newTableId,
          newDate,
          reservation._id
        );

      if (!available) {
        return res.status(409).json({
          message:
            "Selected table is not available at the new time",
        });
      }

      const newTable =
        await Table.findById(
          newTableId
        );

      if (!newTable) {
        return res.status(404).json({
          message:
            "New table not found",
        });
      }

      if (
        newTable.capacity <
        reservation.partySize
      ) {
        return res.status(400).json({
          message:
            "New table cannot accommodate the party size",
        });
      }

      const newReservation =
        new Reservation({
          user:
            reservation.user,

          restaurant:
            reservation.restaurant,

          table:
            newTableId,

          tables: [
            newTableId,
          ],

          date:
            newDate,

          partySize:
            reservation.partySize,

          seatingPreference:
            reservation.seatingPreference,

          status:
            "confirmed",

          arrivalStatus:
            "pending",

          gracePeriodMinutes:
            reservation.gracePeriodMinutes,

          notes:
            reservation.notes,

          walletAmountUsed:
            Number(
              reservation.walletAmountUsed || 0
            ),

          walletRefunded:
            false,

          walletRefundReason:
            null,

          rescheduleCount:
            reservation.rescheduleCount + 1,

          rescheduleFee:
            0,

          rescheduledFrom:
            reservation._id,
        });

      await newReservation.save();

      reservation.status =
        "rescheduled";

      reservation.rescheduledAt =
        new Date();

      reservation.rescheduledTo =
        newReservation._id;

      await reservation.save();

      const oldTable =
        await Table.findById(
          reservation.table
        );

      if (oldTable) {
        oldTable.status =
          "available";

        await oldTable.save();
      }

      newTable.status =
        "reserved";

      await newTable.save();

      return res.status(200).json({
        message:
          "Reservation rescheduled successfully",

        fee: 0,

        walletAmountUsed:
          Number(
            newReservation.walletAmountUsed || 0
          ),

        reservation:
          newReservation,
      });
    } catch (error) {
      console.error(
        "Staff reschedule error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to reschedule reservation",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   STAFF - UPDATE GRACE PERIOD
===================================================== */

router.patch(
  "/:id/grace-period",
  authMiddleware,
  roleMiddleware(
    "staff",
    "admin"
  ),
  async (req, res) => {
    try {
      const {
        gracePeriodMinutes,
      } = req.body;

      const reservation =
        await Reservation.findOne({
          bookingId:
            req.params.id,
        });

      if (!reservation) {
        return res.status(404).json({
          message:
            "Reservation not found",
        });
      }

      if (
        reservation.status !==
        "confirmed"
      ) {
        return res.status(400).json({
          message:
            "Grace period can only be changed for confirmed reservations",
        });
      }

      const minutes =
        Number(
          gracePeriodMinutes
        );

      if (
        !Number.isInteger(minutes) ||
        minutes < 1 ||
        minutes > 60
      ) {
        return res.status(400).json({
          message:
            "Grace period must be between 1 and 60 minutes",
        });
      }

      reservation.gracePeriodMinutes =
        minutes;

      await reservation.save();

      console.log(
        `Grace period updated: ${reservation.bookingId} -> ${minutes} minutes`
      );

      return res.status(200).json({
        message:
          "Grace period updated successfully",

        gracePeriodMinutes:
          reservation.gracePeriodMinutes,

        reservation,
      });
    } catch (error) {
      console.error(
        "Update grace period error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update grace period",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   STAFF - MARK ARRIVED
===================================================== */

router.patch(
  "/:id/arrive",
  authMiddleware,
  roleMiddleware(
    "staff",
    "admin"
  ),
  async (req, res) => {
    try {
      const reservation =
        await Reservation.findOne({
          bookingId:
            req.params.id,
        });

      if (!reservation) {
        return res.status(404).json({
          message:
            "Reservation not found",
        });
      }

      if (
        reservation.status !==
        "confirmed"
      ) {
        return res.status(400).json({
          message:
            "Only confirmed reservations can be marked as arrived",
        });
      }

      reservation.arrivalStatus =
        "arrived";

      await reservation.save();

      const tableIds =
        Array.isArray(
          reservation.tables
        ) &&
        reservation.tables.length > 0
          ? reservation.tables
          : [reservation.table];

      for (
        const tableId of tableIds
      ) {
        const table =
          await Table.findById(
            tableId
          );

        if (table) {
          table.status =
            "occupied";

          await table.save();
        }
      }

      console.log(
        `Customer arrived: ${reservation.bookingId}`
      );

      return res.status(200).json({
        message:
          "Customer marked as arrived",

        reservation,
      });
    } catch (error) {
      console.error(
        "Mark arrived error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to mark arrival",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   STAFF - MARK NO SHOW
===================================================== */

router.patch(
  "/:id/no-show",
  authMiddleware,
  roleMiddleware(
    "staff",
    "admin"
  ),
  async (req, res) => {
    try {
      const reservation =
        await Reservation.findOne({
          bookingId:
            req.params.id,
        });

      if (!reservation) {
        return res.status(404).json({
          message:
            "Reservation not found",
        });
      }

      if (
        reservation.status !==
        "confirmed"
      ) {
        return res.status(400).json({
          message:
            "Only confirmed reservations can be marked as no-show",
        });
      }

      reservation.status =
        "no_show";

      reservation.arrivalStatus =
        "no_show";

      reservation.walletRefundReason =
        Number(
          reservation.walletAmountUsed || 0
        ) > 0
          ? "No-Show - No Refund"
          : null;

      await reservation.save();

      const tableIds =
        Array.isArray(
          reservation.tables
        ) &&
        reservation.tables.length > 0
          ? reservation.tables
          : [reservation.table];

      for (
        const tableId of tableIds
      ) {
        const table =
          await Table.findById(
            tableId
          );

        if (table) {
          table.status =
            "available";

          await table.save();
        }
      }

      console.log(
        `No-show marked: ${reservation.bookingId}`
      );

      return res.status(200).json({
        message:
          "Reservation marked as no-show. Wallet redemption is not refundable.",

        walletRefunded:
          false,

        walletRefundAmount:
          0,

        reservation,
      });
    } catch (error) {
      console.error(
        "No-show error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to mark no-show",

        error:
          error.message,
      });
    }
  }
);

/* =====================================================
   STAFF - COMPLETE RESERVATION
===================================================== */

router.patch(
  "/:id/complete",
  authMiddleware,
  roleMiddleware(
    "staff",
    "admin"
  ),
  async (req, res) => {
    try {
      const reservation =
        await Reservation.findOne({
          bookingId: req.params.id,
        });

      if (!reservation) {
        return res.status(404).json({
          message:
            "Reservation not found",
        });
      }

      if (
        reservation.status !==
        "confirmed"
      ) {
        return res.status(400).json({
          message:
            "Only confirmed reservations can be completed",
        });
      }

      reservation.status =
        "completed";

      reservation.arrivalStatus =
        "arrived";

      reservation.walletRefundReason =
        Number(
          reservation.walletAmountUsed || 0
        ) > 0
          ? "Reservation Completed - Wallet Used"
          : null;

      await reservation.save();

      /* -----------------------------------------------
         FREE ALL TABLES
      ------------------------------------------------ */

      const tableIds =
        Array.isArray(
          reservation.tables
        ) &&
        reservation.tables.length > 0
          ? reservation.tables
          : [reservation.table];

      for (
        const tableId of tableIds
      ) {
        const table =
          await Table.findById(
            tableId
          );

        if (table) {
          table.status =
            "available";

          await table.save();
        }
      }

      console.log(
        `Reservation completed: ${reservation.bookingId}`
      );

      return res.status(200).json({
        message:
          "Reservation completed successfully",

        reservation,
      });
    } catch (error) {
      console.error(
        "Complete reservation error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to complete reservation",

        error:
          error.message,
      });
    }
  }
);

module.exports = router;