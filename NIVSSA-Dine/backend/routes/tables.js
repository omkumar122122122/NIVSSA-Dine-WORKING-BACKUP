const express = require("express");

const Table = require("../models/Table");
const Restaurant = require("../models/Restaurant");
const Reservation = require("../models/Reservation");

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

const router = express.Router();

const isTableAvailableAtTime = async (table, requestedDate) => {
  const turnTime = Number(table.turnTime) || 60;

  const requestedTime = new Date(requestedDate).getTime();

  const startTime = new Date(
    requestedTime - turnTime * 60 * 1000
  );

  const endTime = new Date(
    requestedTime + turnTime * 60 * 1000
  );

  const existingReservation = await Reservation.findOne({
    $or: [
      {
        table: table._id,
      },
      {
        tables: table._id,
      },
    ],
    status: "confirmed",
    date: {
      $gte: startTime,
      $lte: endTime,
    },
  });

  return !existingReservation;
};

const matchesSeatingPreference = (
  table,
  seatingPreference
) => {
  if (
    !seatingPreference ||
    seatingPreference === "any"
  ) {
    return true;
  }

  const requestedSeating =
    String(seatingPreference).toLowerCase();

  const section =
    String(table.section || "").toLowerCase();

  const seatingType =
    String(table.seatingType || "").toLowerCase();

  return (
    section === requestedSeating ||
    seatingType === requestedSeating
  );
};

const findTableCombination = (
  tables,
  partySize
) => {
  let bestCombination = null;

  const search = (
    startIndex,
    selectedTables,
    totalCapacity
  ) => {
    if (totalCapacity >= partySize) {
      if (
        !bestCombination ||
        selectedTables.length <
          bestCombination.length ||
        (
          selectedTables.length ===
            bestCombination.length &&
          totalCapacity <
            bestCombination.reduce(
              (sum, table) =>
                sum + Number(table.capacity || 0),
              0
            )
        )
      ) {
        bestCombination = [...selectedTables];
      }

      return;
    }

    for (
      let i = startIndex;
      i < tables.length;
      i++
    ) {
      if (
        bestCombination &&
        selectedTables.length + 1 >
          bestCombination.length
      ) {
        continue;
      }

      const table = tables[i];

      selectedTables.push(table);

      search(
        i + 1,
        selectedTables,
        totalCapacity +
          Number(table.capacity || 0)
      );

      selectedTables.pop();
    }
  };

  search(0, [], 0);

  return bestCombination;
};

router.get(
  "/available",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        restaurantName,
        date,
        time,
        partySize,
        seatingPreference,
      } = req.query;

      if (!restaurantName) {
        return res.status(400).json({
          message: "Restaurant name is required",
        });
      }

      const restaurant =
        await Restaurant.findOne({
          name: restaurantName,
        });

      if (!restaurant) {
        return res.status(404).json({
          message: "Restaurant not found",
        });
      }

      if (!date || !time) {
        return res.status(400).json({
          message: "Date and time are required",
        });
      }

      const requestedDate = new Date(
        `${date}T${time}:00`
      );

      if (
        Number.isNaN(
          requestedDate.getTime()
        )
      ) {
        return res.status(400).json({
          message: "Invalid date or time",
        });
      }

      if (requestedDate <= new Date()) {
        return res.status(400).json({
          message:
            "Reservation time must be in the future",
        });
      }

      const requestedPartySize =
        Number(partySize) || 1;

      if (requestedPartySize < 1) {
        return res.status(400).json({
          message: "Invalid party size",
        });
      }

      const tables =
        await Table.find({
          restaurant: restaurant._id,
          status: "available",
        })
          .populate(
            "restaurant",
            "name address openingTime closingTime openDays"
          )
          .sort({
            tableNumber: 1,
          });

      const availableTables = [];

      for (const table of tables) {
        if (
          !matchesSeatingPreference(
            table,
            seatingPreference
          )
        ) {
          continue;
        }

        const available =
          await isTableAvailableAtTime(
            table,
            requestedDate
          );

        if (!available) {
          continue;
        }

        availableTables.push(table);
      }

      if (requestedPartySize <= 4) {
        const singleTables =
          availableTables.filter(
            (table) =>
              Number(table.capacity) >=
              requestedPartySize
          );

        return res.status(200).json({
          message:
            "Available tables fetched successfully",

          restaurant: {
            _id: restaurant._id,
            name: restaurant.name,
            address: restaurant.address,
            openingTime:
              restaurant.openingTime,
            closingTime:
              restaurant.closingTime,
          },

          requestedDate,

          partySize:
            requestedPartySize,

          seatingPreference:
            seatingPreference || "any",

          tables: singleTables,

          tableOptions:
            singleTables.map(
              (table) => ({
                tables: [table],
                totalCapacity:
                  Number(
                    table.capacity
                  ),
              })
            ),
        });
      }

      const combination =
        findTableCombination(
          availableTables,
          requestedPartySize
        );

      if (!combination) {
        return res.status(200).json({
          message:
            "No table combination available",

          restaurant: {
            _id: restaurant._id,
            name: restaurant.name,
            address: restaurant.address,
            openingTime:
              restaurant.openingTime,
            closingTime:
              restaurant.closingTime,
          },

          requestedDate,

          partySize:
            requestedPartySize,

          seatingPreference:
            seatingPreference || "any",

          tables: [],

          tableOptions: [],

          totalCapacity: 0,
        });
      }

      const totalCapacity =
        combination.reduce(
          (sum, table) =>
            sum +
            Number(table.capacity || 0),
          0
        );

      return res.status(200).json({
        message:
          "Available table combination found",

        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          address: restaurant.address,
          openingTime:
            restaurant.openingTime,
          closingTime:
            restaurant.closingTime,
        },

        requestedDate,

        partySize:
          requestedPartySize,

        seatingPreference:
          seatingPreference || "any",

        tables: combination,

        tableOptions: [
          {
            tables: combination,
            totalCapacity,
          },
        ],

        totalCapacity,
      });
    } catch (error) {
      console.error(
        "Get available tables error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch available tables",
        error: error.message,
      });
    }
  }
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  async (req, res) => {
    try {
      const tables =
        await Table.find()
          .populate(
            "restaurant",
            "name address"
          )
          .sort({
            restaurant: 1,
            tableNumber: 1,
          });

      return res.status(200).json({
        message:
          "Tables fetched successfully",
        tables,
      });
    } catch (error) {
      console.error(
        "Get tables error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch tables",
        error: error.message,
      });
    }
  }
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "available",
        "occupied",
        "maintenance",
      ];

      if (
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          message: "Invalid table status",
        });
      }

      const table =
        await Table.findById(
          req.params.id
        ).populate(
          "restaurant",
          "name address"
        );

      if (!table) {
        return res.status(404).json({
          message: "Table not found",
        });
      }

      table.status = status;

      await table.save();

      return res.status(200).json({
        message:
          "Table status updated successfully",
        table,
      });
    } catch (error) {
      console.error(
        "Update table status error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update table status",
        error: error.message,
      });
    }
  }
);

module.exports = router;