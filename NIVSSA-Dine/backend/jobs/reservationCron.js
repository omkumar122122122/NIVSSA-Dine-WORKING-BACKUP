const cron = require("node-cron");
const nodemailer = require("nodemailer");

const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

/* =========================================================
   EMAIL TRANSPORTER
========================================================= */

const emailUser =
  process.env.EMAIL_USER ||
  process.env.GMAIL_USER ||
  process.env.SMTP_USER;

const emailPass =
  process.env.EMAIL_APP_PASSWORD ||
  process.env.EMAIL_PASS ||
  process.env.GMAIL_PASS ||
  process.env.SMTP_PASS;

const emailHost =
  process.env.SMTP_HOST ||
  "smtp.gmail.com";

const emailPort =
  Number(process.env.SMTP_PORT) || 465;

let transporter = null;

if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  console.log(
    "Reminder email transporter configured ✅"
  );
} else {
  console.warn(
    "Reminder email transporter not configured. Please check email environment variables."
  );
}

/* =========================================================
   REMINDER TRACKING
========================================================= */

const reminderSentBookings =
  new Set();

/* =========================================================
   SEND RESERVATION REMINDER
========================================================= */

const sendReservationReminder =
  async (reservation) => {
    try {
      if (!transporter) {
        console.warn(
          `Reminder skipped for ${reservation.bookingId}: email transporter not configured`
        );
        return;
      }

      if (
        reminderSentBookings.has(
          reservation.bookingId
        )
      ) {
        return;
      }

      const user =
        await User.findById(
          reservation.user
        );

      if (!user || !user.email) {
        console.warn(
          `Reminder skipped for ${reservation.bookingId}: customer email not found`
        );
        return;
      }

      const restaurant =
        await Restaurant.findById(
          reservation.restaurant
        );

      const table =
        await Table.findById(
          reservation.table
        );

      const reservationDate =
        new Date(
          reservation.date
        );

      const formattedDate =
        reservationDate.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }
        );

      const formattedTime =
        reservationDate.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }
        );

      const restaurantName =
        restaurant?.name ||
        "NIVSSA Dine Restaurant";

      const restaurantAddress =
        restaurant?.address ||
        "Restaurant address";

      const tableNumber =
        table?.tableNumber ||
        "Assigned Table";

      const mailOptions = {
        from:
          `"NIVSSA Dine" <${emailUser}>`,

        to: user.email,

        subject:
          "NIVSSA Dine - Reservation Reminder 🍽️",

        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <title>Reservation Reminder</title>
          </head>

          <body
            style="
              margin:0;
              padding:0;
              background:#fff7ed;
              font-family:Arial,Helvetica,sans-serif;
              color:#1f2937;
            "
          >

            <div
              style="
                max-width:650px;
                margin:30px auto;
                background:white;
                border-radius:18px;
                overflow:hidden;
                border:1px solid #fed7aa;
              "
            >

              <div
                style="
                  background:#ea580c;
                  color:white;
                  padding:28px;
                  text-align:center;
                "
              >
                <h1 style="margin:0;font-size:28px;">
                  🍽️ NIVSSA Dine
                </h1>

                <p
                  style="
                    margin:10px 0 0;
                    font-size:16px;
                  "
                >
                  Reservation Reminder
                </p>
              </div>

              <div style="padding:30px;">

                <h2
                  style="
                    margin-top:0;
                    color:#ea580c;
                  "
                >
                  Hello ${user.name || "Customer"} 👋
                </h2>

                <p
                  style="
                    font-size:16px;
                    line-height:1.6;
                  "
                >
                  This is a friendly reminder that your
                  restaurant reservation is scheduled for
                  <strong>tomorrow</strong>.
                </p>

                <div
                  style="
                    background:#fff7ed;
                    border:1px solid #fed7aa;
                    border-radius:14px;
                    padding:20px;
                    margin-top:20px;
                  "
                >

                  <h3
                    style="
                      margin-top:0;
                      color:#ea580c;
                    "
                  >
                    Reservation Details
                  </h3>

                  <p>
                    <strong>Booking ID:</strong>
                    ${reservation.bookingId}
                  </p>

                  <p>
                    <strong>Restaurant:</strong>
                    ${restaurantName}
                  </p>

                  <p>
                    <strong>Address:</strong>
                    ${restaurantAddress}
                  </p>

                  <p>
                    <strong>Date:</strong>
                    ${formattedDate}
                  </p>

                  <p>
                    <strong>Time:</strong>
                    ${formattedTime}
                  </p>

                  <p>
                    <strong>Guests:</strong>
                    ${reservation.partySize}
                  </p>

                  <p>
                    <strong>Table:</strong>
                    ${tableNumber}
                  </p>

                  <p>
                    <strong>Seating:</strong>
                    ${reservation.seatingPreference || "Any"}
                  </p>

                  <p>
                    <strong>Grace Period:</strong>
                    ${
                      Number(
                        reservation.gracePeriodMinutes
                      ) || 15
                    } minutes
                  </p>

                  <p>
                    <strong>Status:</strong>
                    Confirmed
                  </p>

                </div>

                <div
                  style="
                    margin-top:25px;
                    padding:18px;
                    background:#eff6ff;
                    border:1px solid #bfdbfe;
                    border-radius:12px;
                  "
                >
                  <strong style="color:#1d4ed8;">
                    📌 Reminder
                  </strong>

                  <p
                    style="
                      margin:8px 0 0;
                      line-height:1.5;
                      color:#374151;
                    "
                  >
                    Please arrive on time for your reservation.
                    Your allowed grace period is
                    ${
                      Number(
                        reservation.gracePeriodMinutes
                      ) || 15
                    } minutes.
                    After the grace period ends, the reservation
                    may be marked as no-show and the table may be released.
                  </p>
                </div>

                <p
                  style="
                    margin-top:28px;
                    line-height:1.6;
                  "
                >
                  We look forward to welcoming you.
                  <br />
                  Thank you for choosing
                  <strong>NIVSSA Dine</strong> ❤️
                </p>

              </div>

              <div
                style="
                  background:#111827;
                  color:#9ca3af;
                  padding:18px;
                  text-align:center;
                  font-size:13px;
                "
              >
                Smart Restaurant Reservation & Waitlist Management
              </div>

            </div>

          </body>
          </html>
        `,
      };

      await transporter.sendMail(
        mailOptions
      );

      reminderSentBookings.add(
        reservation.bookingId
      );

      console.log(
        `Reservation reminder email sent successfully to ${user.email} | Booking: ${reservation.bookingId}`
      );
    } catch (error) {
      console.error(
        `Reservation reminder email error for ${reservation.bookingId}:`,
        error.message
      );
    }
  };

/* =========================================================
   AUTOMATIC GRACE PERIOD CHECK
========================================================= */

const checkGracePeriods =
  async () => {
    try {
      const now = new Date();

      const reservations =
        await Reservation.find({
          status: "confirmed",
          arrivalStatus: "pending",
        });

      for (
        const reservation of reservations
      ) {
        const reservationTime =
          new Date(
            reservation.date
          ).getTime();

        const gracePeriod =
          Number(
            reservation.gracePeriodMinutes
          ) || 15;

        const graceEndTime =
          reservationTime +
          gracePeriod * 60 * 1000;

        if (
          now.getTime() >=
          graceEndTime
        ) {
          /* ---------------------------------------------
             MARK NO-SHOW
             
             IMPORTANT:
             NO WALLET REFUND HERE.
          --------------------------------------------- */

          reservation.status =
            "no_show";

          reservation.arrivalStatus =
            "no_show";

          if (
            Number(
              reservation.walletAmountUsed || 0
            ) > 0 &&
            !reservation.walletRefunded
          ) {
            reservation.walletRefundReason =
              "No-Show - No Refund";
          }

          await reservation.save();

          /* ---------------------------------------------
             RELEASE ALL RESERVED TABLES
          --------------------------------------------- */

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
            `Automatic no-show: ${reservation.bookingId} | Grace: ${gracePeriod} min | Wallet refund: ₹0 | Tables released`
          );
        }
      }
    } catch (error) {
      console.error(
        "Grace period check error:",
        error.message
      );
    }
  };

/* =========================================================
   AUTOMATIC RESERVATION REMINDER
========================================================= */

const checkReservationReminders =
  async () => {
    try {
      const now = new Date();

      const reminderStart =
        new Date(
          now.getTime() +
            24 * 60 * 60 * 1000
        );

      const reminderEnd =
        new Date(
          reminderStart.getTime() +
            60 * 1000
        );

      const reservations =
        await Reservation.find({
          status: "confirmed",

          date: {
            $gte: reminderStart,
            $lt: reminderEnd,
          },
        });

      for (
        const reservation of reservations
      ) {
        await sendReservationReminder(
          reservation
        );
      }
    } catch (error) {
      console.error(
        "Reservation reminder check error:",
        error.message
      );
    }
  };

/* =========================================================
   START CRON
========================================================= */

const startReservationCron = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      await checkReservationReminders();

      await checkGracePeriods();
    }
  );

  console.log(
    "Reservation grace-period + reminder cron started ✅"
  );
};

module.exports =
  startReservationCron;