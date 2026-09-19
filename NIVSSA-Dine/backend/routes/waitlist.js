const express = require("express");
const Waitlist = require("../models/Waitlist");
const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");
const Table = require("../models/Table");
const nodemailer = require("nodemailer");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   GMAIL EMAIL TRANSPORTER
========================================================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

/* =========================================================
   CHECK TABLE AVAILABILITY
========================================================= */

const isTableAvailable = async (
  tableId,
  requestedDate
) => {
  const requestedTime = new Date(requestedDate);

  const fromTime = new Date(
    requestedTime.getTime() -
      2 * 60 * 60 * 1000
  );

  const toTime = new Date(
    requestedTime.getTime() +
      2 * 60 * 60 * 1000
  );

  const existingReservation =
    await Reservation.findOne({
      status: "confirmed",

      date: {
        $gte: fromTime,
        $lte: toTime,
      },

      $or: [
        {
          table: tableId,
        },
        {
          tables: tableId,
        },
      ],
    });

  return !existingReservation;
};

/* =========================================================
   GET CURRENT WAITLIST POSITION
   REAL-TIME STATUS ENDPOINT
========================================================= */

router.get(
  "/:id/status",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;

      if (!userId) {
        return res.status(401).json({
          message:
            "User authentication information missing",
        });
      }

      const waitlistEntry =
        await Waitlist.findOne({
          _id: req.params.id,
          user: userId,
        })
          .populate(
            "restaurant",
            "name address"
          )
          .populate(
            "table",
            "tableNumber capacity section seatingType"
          );

      if (!waitlistEntry) {
        return res.status(404).json({
          message:
            "Waitlist entry not found",
        });
      }

      /* =====================================================
         CANCELLED
      ===================================================== */

      if (
        waitlistEntry.status ===
        "cancelled"
      ) {
        return res.status(200).json({
          status: "cancelled",
          position: null,
          peopleAhead: null,
          totalWaiting: null,
          message:
            "Your waitlist entry has been cancelled",
          waitlist: waitlistEntry,
        });
      }

      /* =====================================================
         NOTIFIED
      ===================================================== */

      if (
        waitlistEntry.status ===
        "notified"
      ) {
        return res.status(200).json({
          status: "notified",
          position:
            waitlistEntry.position,
          peopleAhead: 0,
          totalWaiting: 0,
          message:
            "Your table is ready",
          table:
            waitlistEntry.table,
          waitlist: waitlistEntry,
        });
      }

      /* =====================================================
         WAITING
      ===================================================== */

      const waitingEntries =
        await Waitlist.find({
          restaurant:
            waitlistEntry.restaurant._id,

          requestedDate:
            waitlistEntry.requestedDate,

          status: "waiting",
        })
          .sort({
            position: 1,
            createdAt: 1,
          });

      const currentIndex =
        waitingEntries.findIndex(
          (entry) =>
            entry._id.toString() ===
            waitlistEntry._id.toString()
        );

      let currentPosition =
        currentIndex >= 0
          ? currentIndex + 1
          : waitlistEntry.position;

      const peopleAhead =
        Math.max(
          currentPosition - 1,
          0
        );

      const totalWaiting =
        waitingEntries.length;

      /* =====================================================
         UPDATE STORED POSITION
      ===================================================== */

      if (
        waitlistEntry.position !==
        currentPosition
      ) {
        waitlistEntry.position =
          currentPosition;

        await waitlistEntry.save();
      }

      return res.status(200).json({
        status: "waiting",

        position:
          currentPosition,

        peopleAhead,

        totalWaiting,

        message:
          peopleAhead === 0
            ? "You are next in line"
            : `${peopleAhead} customer(s) are ahead of you`,

        requestedDate:
          waitlistEntry.requestedDate,

        partySize:
          waitlistEntry.partySize,

        seatingPreference:
          waitlistEntry.seatingPreference,

        restaurant:
          waitlistEntry.restaurant,

        waitlist:
          waitlistEntry,
      });
    } catch (error) {
      console.error(
        "Get real-time waitlist status error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch real-time waitlist status",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   JOIN WAITLIST
========================================================= */

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        partySize,
        seatingPreference = "any",
        requestedDate,
        notes = "",
      } = req.body;

      if (!partySize || !requestedDate) {
        return res.status(400).json({
          message:
            "Party size and requested date are required",
        });
      }

      const requestedDateTime =
        new Date(requestedDate);

      if (
        isNaN(
          requestedDateTime.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid date or time",
        });
      }

      if (
        requestedDateTime <= new Date()
      ) {
        return res.status(400).json({
          message:
            "Requested time must be in the future",
        });
      }

      /* =====================================================
         GET RESTAURANT NAME FROM NOTES
      ===================================================== */

      const restaurantMatch =
        notes.match(
          /Restaurant:\s*(.+)/i
        );

      if (!restaurantMatch) {
        return res.status(400).json({
          message:
            "Restaurant information is required",
        });
      }

      const restaurantName =
        restaurantMatch[1].trim();

      const restaurant =
        await Restaurant.findOne({
          name: restaurantName,
        });

      if (!restaurant) {
        return res.status(404).json({
          message:
            "Restaurant not found",
        });
      }

      /* =====================================================
         CURRENT USER
      ===================================================== */

      const userId = req.user.id;

      if (!userId) {
        return res.status(401).json({
          message:
            "User authentication information missing",
        });
      }

      console.log(
        "Creating waitlist for user:",
        userId
      );

      /* =====================================================
         CALCULATE POSITION
      ===================================================== */

      const existingEntries =
        await Waitlist.countDocuments({
          restaurant:
            restaurant._id,

          requestedDate:
            requestedDateTime,

          status: "waiting",
        });

      const position =
        existingEntries + 1;

      /* =====================================================
         CREATE WAITLIST ENTRY
      ===================================================== */

      const waitlistEntry =
        await Waitlist.create({
          user: userId,

          restaurant:
            restaurant._id,

          partySize:
            Number(partySize),

          seatingPreference,

          requestedDate:
            requestedDateTime,

          position,

          notes,
        });

      const populatedEntry =
        await Waitlist.findById(
          waitlistEntry._id
        )
          .populate(
            "user",
            "name email phone"
          )
          .populate(
            "restaurant",
            "name address phone email"
          );

      console.log(
        "Waitlist created successfully:",
        waitlistEntry._id
      );

      return res.status(201).json({
        message:
          "Added to waitlist successfully",

        waitlist:
          populatedEntry,

        position,

        peopleAhead:
          Math.max(position - 1, 0),

        totalWaiting:
          position,
      });
    } catch (error) {
      console.error(
        "Join waitlist error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to join waitlist",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   GET MY WAITLIST ENTRIES
========================================================= */

router.get(
  "/my",
  authMiddleware,
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      if (!userId) {
        return res.status(401).json({
          message:
            "User authentication information missing",
        });
      }

      const waitlist =
        await Waitlist.find({
          user: userId,

          status: {
            $in: [
              "waiting",
              "notified",
            ],
          },
        })
          .sort({
            requestedDate: 1,
            position: 1,
          })
          .populate(
            "user",
            "name email phone"
          )
          .populate(
            "restaurant",
            "name address phone email"
          )
          .populate(
            "table",
            "tableNumber capacity section seatingType"
          );

      return res.status(200).json({
        message:
          "My waitlist entries fetched successfully",

        waitlist,
      });
    } catch (error) {
      console.error(
        "Get waitlist error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch waitlist",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   CANCEL WAITLIST ENTRY
========================================================= */

router.patch(
  "/:id/cancel",
  authMiddleware,
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      if (!userId) {
        return res.status(401).json({
          message:
            "User authentication information missing",
        });
      }

      const waitlistEntry =
        await Waitlist.findOne({
          _id: req.params.id,

          user: userId,
        });

      if (!waitlistEntry) {
        return res.status(404).json({
          message:
            "Waitlist entry not found",
        });
      }

      if (
        waitlistEntry.status ===
        "cancelled"
      ) {
        return res.status(400).json({
          message:
            "Waitlist entry is already cancelled",
        });
      }

      waitlistEntry.status =
        "cancelled";

      await waitlistEntry.save();

      /* =====================================================
         RE-CALCULATE POSITIONS
      ===================================================== */

      const remainingEntries =
        await Waitlist.find({
          restaurant:
            waitlistEntry.restaurant,

          requestedDate:
            waitlistEntry.requestedDate,

          status: "waiting",
        }).sort({
          position: 1,
          createdAt: 1,
        });

      for (
        let i = 0;
        i < remainingEntries.length;
        i++
      ) {
        const entry =
          remainingEntries[i];

        const newPosition =
          i + 1;

        if (
          entry.position !==
          newPosition
        ) {
          entry.position =
            newPosition;

          await entry.save();
        }
      }

      return res.status(200).json({
        message:
          "Waitlist entry cancelled successfully",

        waitlist:
          waitlistEntry,
      });
    } catch (error) {
      console.error(
        "Cancel waitlist error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to cancel waitlist entry",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   GET ALL WAITLIST ENTRIES - STAFF
========================================================= */

router.get(
  "/staff/all",
  authMiddleware,
  async (req, res) => {
    try {
      const waitlist =
        await Waitlist.find({
          status: {
            $in: [
              "waiting",
              "notified",
            ],
          },
        })
          .populate(
            "user",
            "name email phone"
          )
          .populate(
            "restaurant",
            "name address phone email"
          )
          .populate(
            "table",
            "tableNumber capacity section seatingType"
          )
          .sort({
            requestedDate: 1,
            position: 1,
          });

      return res.status(200).json({
        message:
          "All waitlist entries fetched successfully",

        waitlist,
      });
    } catch (error) {
      console.error(
        "Get all waitlist error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch all waitlist entries",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   NOTIFY WAITLIST CUSTOMER - STAFF
========================================================= */

router.patch(
  "/:id/notify",
  authMiddleware,
  async (req, res) => {
    try {
      const waitlistEntry =
        await Waitlist.findById(
          req.params.id
        )
          .populate(
            "user",
            "name email phone"
          )
          .populate(
            "restaurant",
            "name address phone email"
          );

      if (!waitlistEntry) {
        return res.status(404).json({
          message:
            "Waitlist entry not found",
        });
      }

      if (
        waitlistEntry.status !==
        "waiting"
      ) {
        return res.status(400).json({
          message:
            "Only waiting customers can be notified",
        });
      }

      const user =
        waitlistEntry.user;

      const restaurant =
        waitlistEntry.restaurant;

      if (!user || !user.email) {
        return res.status(400).json({
          message:
            "Customer email not found",
        });
      }

      if (!restaurant) {
        return res.status(400).json({
          message:
            "Restaurant information not found",
        });
      }

      const requestedDate =
        new Date(
          waitlistEntry.requestedDate
        );

      /* =====================================================
         GET AVAILABLE TABLES
      ===================================================== */

      const availableTables =
        await Table.find({
          restaurant:
            restaurant._id,

          status: "available",
        }).sort({
          capacity: 1,
        });

      const suitableTables = [];

      for (
        const table of availableTables
      ) {
        if (
          waitlistEntry.seatingPreference !==
          "any"
        ) {
          if (
            table.section !==
              waitlistEntry.seatingPreference &&
            table.seatingType !==
              waitlistEntry.seatingPreference
          ) {
            continue;
          }
        }

        const available =
          await isTableAvailable(
            table._id,
            requestedDate
          );

        if (!available) {
          continue;
        }

        suitableTables.push(
          table
        );
      }

      /* =====================================================
         FIND BEST TABLE COMBINATION
      ===================================================== */

      const findTableCombination =
        (
          tables,
          requiredCapacity
        ) => {
          let bestCombination =
            null;

          let bestCapacity =
            Infinity;

          let bestTableCount =
            Infinity;

          const search = (
            index,
            selected,
            totalCapacity
          ) => {
            if (
              totalCapacity >=
              requiredCapacity
            ) {
              if (
                totalCapacity <
                  bestCapacity ||
                (
                  totalCapacity ===
                    bestCapacity &&
                  selected.length <
                    bestTableCount
                )
              ) {
                bestCombination = [
                  ...selected,
                ];

                bestCapacity =
                  totalCapacity;

                bestTableCount =
                  selected.length;
              }

              return;
            }

            if (
              index >=
              tables.length
            ) {
              return;
            }

            if (
              totalCapacity >=
              bestCapacity
            ) {
              return;
            }

            search(
              index + 1,

              [
                ...selected,
                tables[index],
              ],

              totalCapacity +
                tables[index].capacity
            );

            search(
              index + 1,

              selected,

              totalCapacity
            );
          };

          search(
            0,
            [],
            0
          );

          return bestCombination;
        };

      const selectedTables =
        findTableCombination(
          suitableTables,

          waitlistEntry.partySize
        );

      if (
        !selectedTables ||
        selectedTables.length === 0
      ) {
        return res.status(400).json({
          message:
            "No suitable combination of tables is currently available for this waitlist request",
        });
      }

      const selectedTableIds =
        selectedTables.map(
          (table) =>
            table._id
        );

      const primaryTable =
        selectedTables[0];

      /* =====================================================
         CREATE RESERVATION
      ===================================================== */

      const reservation =
        await Reservation.create({
          user:
            user._id,

          restaurant:
            restaurant._id,

          table:
            primaryTable._id,

          tables:
            selectedTableIds,

          date:
            requestedDate,

          partySize:
            waitlistEntry.partySize,

          seatingPreference:
            waitlistEntry.seatingPreference,

          status:
            "confirmed",

          arrivalStatus:
            "pending",

          gracePeriodMinutes:
            15,

          notes:
            "Created from waitlist notification",
        });

      /* =====================================================
         UPDATE WAITLIST
      ===================================================== */

      waitlistEntry.table =
        primaryTable._id;

      waitlistEntry.status =
        "notified";

      await waitlistEntry.save();

      /* =====================================================
         RE-CALCULATE REMAINING POSITIONS
      ===================================================== */

      const remainingEntries =
        await Waitlist.find({
          restaurant:
            restaurant._id,

          requestedDate:
            waitlistEntry.requestedDate,

          status: "waiting",
        }).sort({
          position: 1,
          createdAt: 1,
        });

      for (
        let i = 0;
        i < remainingEntries.length;
        i++
      ) {
        const entry =
          remainingEntries[i];

        const newPosition =
          i + 1;

        if (
          entry.position !==
          newPosition
        ) {
          entry.position =
            newPosition;

          await entry.save();
        }
      }

      /* =====================================================
         FORMAT DATE & TIME
      ===================================================== */

      const formattedDate =
        requestedDate.toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        );

      const formattedTime =
        requestedDate.toLocaleTimeString(
          "en-IN",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        );

      const tableNumbers =
        selectedTables
          .map(
            (table) =>
              table.tableNumber
          )
          .join(", ");

      const totalCapacity =
        selectedTables.reduce(
          (
            total,
            table
          ) =>
            total +
            table.capacity,

          0
        );

      /* =====================================================
         EMAIL
      ===================================================== */

      const mailOptions = {
        from:
          process.env.EMAIL_USER,

        to:
          user.email,

        subject:
          "Your Table Is Ready - NIVSSA Dine 🍽️",

        html: `
          <div
            style="
              font-family:Arial,sans-serif;
              line-height:1.6;
              max-width:650px;
              margin:auto;
              padding:25px;
              background:#fff7ed;
            "
          >

            <div
              style="
                background:#ea580c;
                color:white;
                padding:25px;
                border-radius:15px 15px 0 0;
                text-align:center;
              "
            >
              <h1 style="margin:0;">
                🍽️ NIVSSA Dine
              </h1>

              <p style="margin:8px 0 0;">
                Your Table Is Ready 🎉
              </p>
            </div>

            <div
              style="
                background:white;
                padding:25px;
                border-radius:0 0 15px 15px;
              "
            >

              <h2>
                Hello ${
                  user.name ||
                  "Customer"
                } 👋
              </h2>

              <p>
                Good news! Your waitlist request has now
                been converted into a confirmed reservation.
              </p>

              <h3>
                Booking Details
              </h3>

              <p>
                <strong>Booking ID:</strong>
                ${
                  reservation.bookingId
                }
              </p>

              <p>
                <strong>Restaurant:</strong>
                ${
                  restaurant.name
                }
              </p>

              <p>
                <strong>Address:</strong>
                ${
                  restaurant.address
                }
              </p>

              <p>
                <strong>Date:</strong>
                ${
                  formattedDate
                }
              </p>

              <p>
                <strong>Time:</strong>
                ${
                  formattedTime
                }
              </p>

              <p>
                <strong>Guests:</strong>
                ${
                  reservation.partySize
                }
              </p>

              <p>
                <strong>Table(s):</strong>
                ${
                  tableNumbers
                }
              </p>

              <p>
                <strong>Total Table Capacity:</strong>
                ${
                  totalCapacity
                }
              </p>

              <div
                style="
                  margin-top:20px;
                  padding:15px;
                  background:#eff6ff;
                  border:1px solid #bfdbfe;
                  border-radius:10px;
                "
              >
                <strong>
                  📌 Arrival Reminder
                </strong>

                <p style="margin-bottom:0;">
                  Please arrive on time.
                  You have a 15-minute grace period.
                  After that, the reservation may be marked
                  as no-show and the table may be released.
                </p>
              </div>

              <p style="margin-top:25px;">
                Thank you for choosing
                <strong>NIVSSA Dine</strong> ❤️
              </p>

            </div>
          </div>
        `,
      };

      await transporter.sendMail(
        mailOptions
      );

      /* =====================================================
         FINAL WAITLIST DATA
      ===================================================== */

      const finalWaitlist =
        await Waitlist.findById(
          waitlistEntry._id
        )
          .populate(
            "user",
            "name email phone"
          )
          .populate(
            "restaurant",
            "name address phone email"
          )
          .populate(
            "table",
            "tableNumber capacity section seatingType"
          );

      return res.status(200).json({
        message:
          "Customer notified and reservation created successfully",

        emailSentTo:
          user.email,

        bookingId:
          reservation.bookingId,

        reservation,

        assignedTables:
          selectedTables.map(
            (table) => ({
              tableNumber:
                table.tableNumber,

              capacity:
                table.capacity,

              section:
                table.section,

              seatingType:
                table.seatingType,
            })
          ),

        waitlist:
          finalWaitlist,
      });
    } catch (error) {
      console.error(
        "Notify waitlist error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to notify customer and create reservation",

        error:
          error.message,
      });
    }
  }
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;