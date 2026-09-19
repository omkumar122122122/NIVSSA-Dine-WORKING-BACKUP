const mongoose = require("mongoose");
require("dotenv").config();

const Reservation = require("./models/Reservation");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const reservation = await Reservation.findOneAndUpdate(
    { bookingId: "NVS-9AA56A" },
    { gracePeriodMinutes: 1 },
    { new: true }
  );

  if (!reservation) {
    console.log("Reservation not found ❌");
  } else {
    console.log("Grace period changed to 1 minute ✅");
    console.log("Booking:", reservation.bookingId);
    console.log("Reservation time:", reservation.date);
    console.log(
      "Grace:",
      reservation.gracePeriodMinutes,
      "minute"
    );
  }

  await mongoose.disconnect();
});