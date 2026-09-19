"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Reservation = {
  _id: string;
  bookingId: string;
  date: string;
  partySize: number;
  seatingPreference: string;
  status: string;
  arrivalStatus: string;
  gracePeriodMinutes: number;

  restaurant?: {
    _id: string;
    name: string;
    address: string;
    phone?: string;
    openingTime?: string;
    closingTime?: string;
  };

  table?: {
    _id: string;
    tableNumber: number;
    capacity: number;
    section: string;
    seatingType: string;
  };

  tables?: {
    _id: string;
    tableNumber: number;
    capacity: number;
    section: string;
    seatingType: string;
  }[];
};

type AvailableTable = {
  _id: string;
  tableNumber: number;
  capacity: number;
  section: string;
  seatingType: string;
};

type WaitlistEntry = {
  _id: string;
  partySize: number;
  seatingPreference: string;
  requestedDate: string;
  position: number;
  status: string;
  notes?: string;

  restaurant?: {
    _id: string;
    name: string;
    address: string;
    phone?: string;
  };

  table?: {
    _id: string;
    tableNumber: number;
    capacity: number;
    section: string;
    seatingType: string;
  };
};

type WaitlistStatus = {
  status: string;
  position: number | null;
  peopleAhead: number | null;
  totalWaiting: number | null;
  message: string;
  requestedDate?: string;
  partySize?: number;
  seatingPreference?: string;

  restaurant?: {
    _id: string;
    name: string;
    address: string;
    phone?: string;
  };

  table?: {
    _id: string;
    tableNumber: number;
    capacity: number;
    section: string;
    seatingType: string;
  };

  waitlist?: WaitlistEntry;
};

export default function MyBookingsPage() {
  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [cancelLoading, setCancelLoading] =
    useState<string | null>(null);

  const [rescheduleBooking, setRescheduleBooking] =
    useState<Reservation | null>(null);

  const [newDate, setNewDate] =
    useState("");

  const [newTime, setNewTime] =
    useState("");

  const [newTableId, setNewTableId] =
    useState("");

  const [selectedTableIds, setSelectedTableIds] =
    useState<string[]>([]);

  const [availableTables, setAvailableTables] =
    useState<AvailableTable[]>([]);

  const [loadingTables, setLoadingTables] =
    useState(false);

  const [rescheduleLoading, setRescheduleLoading] =
    useState(false);

  /* =========================================================
     WAITLIST STATES
  ========================================================= */

  const [waitlistEntries, setWaitlistEntries] =
    useState<WaitlistEntry[]>([]);

  const [waitlistLoading, setWaitlistLoading] =
    useState(true);

  const [waitlistError, setWaitlistError] =
    useState("");

  const [waitlistStatuses, setWaitlistStatuses] =
    useState<
      Record<string, WaitlistStatus>
    >({});

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchBookings();
    fetchWaitlist();
  }, []);

  /* =========================================================
     REAL-TIME WAITLIST POLLING
  ========================================================= */

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        fetchWaitlist();
      }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* =========================================================
     RAZORPAY SCRIPT
  ========================================================= */

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  /* =========================================================
     FETCH BOOKINGS
  ========================================================= */

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "nivssaToken"
        );

      if (!token) {
        window.location.href = "/auth";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/reservations/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch bookings"
        );
      }

      const bookings = Array.isArray(data)
        ? data
        : data.reservations || [];

      setReservations(bookings);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load bookings"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FETCH WAITLIST
  ========================================================= */

  const fetchWaitlist = async () => {
    try {
      const token =
        localStorage.getItem(
          "nivssaToken"
        );

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/waitlist/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch waitlist"
        );
      }

      const entries: WaitlistEntry[] =
        Array.isArray(data)
          ? data
          : data.waitlist || [];

      setWaitlistEntries(entries);
      setWaitlistError("");

      await Promise.all(
        entries.map(
          async (entry) => {
            await fetchWaitlistStatus(
              entry._id
            );
          }
        )
      );
    } catch (err) {
      console.error(
        "Fetch waitlist error:",
        err
      );

      setWaitlistError(
        err instanceof Error
          ? err.message
          : "Failed to load waitlist"
      );
    } finally {
      setWaitlistLoading(false);
    }
  };

  /* =========================================================
     FETCH LIVE WAITLIST STATUS
  ========================================================= */

  const fetchWaitlistStatus =
    async (
      waitlistId: string
    ) => {
      try {
        const token =
          localStorage.getItem(
            "nivssaToken"
          );

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API_BASE_URL}/waitlist/${waitlistId}/status`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch waitlist status"
          );
        }

        setWaitlistStatuses(
          (previous) => ({
            ...previous,
            [waitlistId]:
              data,
          })
        );
      } catch (err) {
        console.error(
          `Waitlist status error for ${waitlistId}:`,
          err
        );
      }
    };

  /* =========================================================
     CANCEL BOOKING
  ========================================================= */

  const handleCancel = async (
    reservationId: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this booking?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancelLoading(
        reservationId
      );

      setError("");

      const token =
        localStorage.getItem(
          "nivssaToken"
        );

      if (!token) {
        window.location.href = "/auth";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/reservations/${reservationId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to cancel booking"
        );
      }

      await fetchBookings();

      alert(
        "Booking cancelled successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to cancel booking"
      );
    } finally {
      setCancelLoading(null);
    }
  };

  /* =========================================================
     OPEN RESCHEDULE
  ========================================================= */

  const openReschedule = (
    reservation: Reservation
  ) => {
    setRescheduleBooking(
      reservation
    );

    setNewDate("");
    setNewTime("");
    setNewTableId("");
    setSelectedTableIds([]);
    setAvailableTables([]);
    setError("");
  };

  /* =========================================================
     CLOSE RESCHEDULE
  ========================================================= */

  const closeReschedule = () => {
    setRescheduleBooking(null);

    setNewDate("");
    setNewTime("");
    setNewTableId("");
    setSelectedTableIds([]);
    setAvailableTables([]);
    setError("");
  };

  /* =========================================================
     TODAY DATE
  ========================================================= */

  const getTodayDate = () => {
    const today = new Date();

    const year =
      today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* =========================================================
     TIME TO MINUTES
  ========================================================= */

  const timeToMinutes = (
    time: string
  ) => {
    if (!time) {
      return NaN;
    }

    const cleanTime =
      time.trim().toUpperCase();

    const match =
      cleanTime.match(
        /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/
      );

    if (!match) {
      return NaN;
    }

    let hours =
      Number(match[1]);

    const minutes =
      Number(match[2]);

    const period =
      match[3];

    if (
      minutes < 0 ||
      minutes > 59
    ) {
      return NaN;
    }

    if (period) {
      if (
        hours < 1 ||
        hours > 12
      ) {
        return NaN;
      }

      if (period === "AM") {
        if (hours === 12) {
          hours = 0;
        }
      } else {
        if (hours !== 12) {
          hours += 12;
        }
      }
    } else {
      if (
        hours < 0 ||
        hours > 23
      ) {
        return NaN;
      }
    }

    return (
      hours * 60 + minutes
    );
  };

  /* =========================================================
     GET TIME SLOTS
  ========================================================= */

  const getTimeSlots = (
    openingTime?: string,
    closingTime?: string
  ) => {
    if (
      !openingTime ||
      !closingTime
    ) {
      return [];
    }

    const start =
      timeToMinutes(
        openingTime
      );

    let close =
      timeToMinutes(
        closingTime
      );

    if (
      Number.isNaN(start) ||
      Number.isNaN(close)
    ) {
      return [];
    }

    if (close <= start) {
      close +=
        24 * 60;
    }

    const lastBooking =
      close - 60;

    const slots: string[] =
      [];

    for (
      let minutes = start;
      minutes <= lastBooking;
      minutes += 15
    ) {
      const actualMinutes =
        minutes %
        (24 * 60);

      const hours =
        Math.floor(
          actualMinutes / 60
        );

      const mins =
        actualMinutes % 60;

      slots.push(
        `${String(
          hours
        ).padStart(
          2,
          "0"
        )}:${String(
          mins
        ).padStart(
          2,
          "0"
        )}`
      );
    }

    return slots;
  };

  /* =========================================================
     FORMAT TIME SLOT
  ========================================================= */

  const formatSlot = (
    slot: string
  ) => {
    const [
      hours,
      minutes,
    ] = slot
      .split(":")
      .map(Number);

    const date =
      new Date();

    date.setHours(
      hours
    );

    date.setMinutes(
      minutes
    );

    date.setSeconds(0);
    date.setMilliseconds(0);

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /* =========================================================
     FIND AVAILABLE TABLES
  ========================================================= */

  const findAvailableTables =
    async () => {
      if (!rescheduleBooking) {
        return;
      }

      if (
        !newDate ||
        !newTime
      ) {
        setError(
          "Please select date and time."
        );

        return;
      }

      try {
        setLoadingTables(true);
        setError("");
        setAvailableTables([]);
        setNewTableId("");
        setSelectedTableIds([]);

        const token =
          localStorage.getItem(
            "nivssaToken"
          );

        if (!token) {
          window.location.href =
            "/auth";

          return;
        }

        const restaurantName =
          rescheduleBooking
            .restaurant
            ?.name;

        if (!restaurantName) {
          throw new Error(
            "Restaurant information not found."
          );
        }

        const url =
          `${API_BASE_URL}/tables/available` +
          `?restaurantName=${encodeURIComponent(
            restaurantName
          )}` +
          `&date=${newDate}` +
          `&time=${newTime}` +
          `&partySize=${rescheduleBooking.partySize}` +
          `&seatingPreference=${encodeURIComponent(
            rescheduleBooking
              .seatingPreference ||
              "any"
          )}`;

        const response =
          await fetch(url, {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          });

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to find available tables"
          );
        }

        const tables =
          data.tables || [];

        setAvailableTables(
          tables
        );

        if (
          tables.length === 0
        ) {
          setError(
            `No available table found for ${rescheduleBooking.partySize} guests at the selected time.`
          );

          return;
        }

        if (
          rescheduleBooking.partySize >
          4
        ) {
          setSelectedTableIds(
            tables.map(
              (
                table: AvailableTable
              ) =>
                table._id
            )
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to find available tables"
        );
      } finally {
        setLoadingTables(false);
      }
    };

  /* =========================================================
     VERIFY PAYMENT
  ========================================================= */

  const verifyPayment =
    async (
      orderId: string,
      paymentId: string,
      signature: string
    ) => {
      const token =
        localStorage.getItem(
          "nivssaToken"
        );

      if (!token) {
        window.location.href =
          "/auth";

        return false;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/payment/verify`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              razorpay_order_id:
                orderId,

              razorpay_payment_id:
                paymentId,

              razorpay_signature:
                signature,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Payment verification failed"
        );
      }

      return true;
    };

  /* =========================================================
     PERFORM RESCHEDULE
  ========================================================= */

  const performReschedule =
    async (
      paymentId?: string,
      orderId?: string
    ) => {
      if (!rescheduleBooking) {
        return;
      }

      const token =
        localStorage.getItem(
          "nivssaToken"
        );

      if (!token) {
        window.location.href =
          "/auth";

        return;
      }

      const newDateTime =
        new Date(
          `${newDate}T${newTime}:00`
        );

      const tablesForRequest =
        rescheduleBooking.partySize >
        4
          ? selectedTableIds
          : [newTableId];

      const response =
        await fetch(
          `${API_BASE_URL}/reservations/${rescheduleBooking.bookingId}/reschedule`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              newDate:
                newDateTime.toISOString(),

              newTable:
                tablesForRequest[0],

              newTables:
                tablesForRequest,

              paymentId:
                paymentId || null,

              paymentOrderId:
                orderId || null,

              paymentAmount:
                rescheduleBooking.partySize >
                4
                  ? 10
                  : 0,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to reschedule booking"
        );
      }

      closeReschedule();

      await fetchBookings();

      alert(
        `Booking rescheduled successfully.\n\nNew Booking ID: ${
          data.newBookingId ||
          "Created successfully"
        }`
      );
    };

  /* =========================================================
     START RAZORPAY PAYMENT
  ========================================================= */

  const startRazorpayPayment =
    async () => {
      if (!rescheduleBooking) {
        return;
      }

      try {
        setRescheduleLoading(
          true
        );

        setError("");

        const loaded =
          await loadRazorpayScript();

        if (!loaded) {
          throw new Error(
            "Razorpay payment system could not be loaded."
          );
        }

        const token =
          localStorage.getItem(
            "nivssaToken"
          );

        if (!token) {
          window.location.href =
            "/auth";

          return;
        }

        const orderResponse =
          await fetch(
            `${API_BASE_URL}/payment/create-order`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const orderData =
          await orderResponse.json();

        if (!orderResponse.ok) {
          throw new Error(
            orderData.message ||
              "Failed to create payment order"
          );
        }

        const order =
          orderData.order;

        const razorpay =
          new window.Razorpay({
            key:
              orderData.keyId,

            amount:
              order.amount,

            currency:
              order.currency,

            name:
              "NIVSSA Dine",

            description:
              "Restaurant reservation reschedule fee",

            order_id:
              order.id,

            prefill: {
              name:
                "NIVSSA Customer",
            },

            theme: {
              color:
                "#ea580c",
            },

            handler:
              async function (
                response: any
              ) {
                try {
                  setRescheduleLoading(
                    true
                  );

                  setError("");

                  await verifyPayment(
                    response.razorpay_order_id,
                    response.razorpay_payment_id,
                    response.razorpay_signature
                  );

                  await performReschedule(
                    response.razorpay_payment_id,
                    response.razorpay_order_id
                  );
                } catch (err) {
                  console.error(
                    err
                  );

                  setError(
                    err instanceof Error
                      ? err.message
                      : "Payment verification failed"
                  );
                } finally {
                  setRescheduleLoading(
                    false
                  );
                }
              },

            modal: {
              ondismiss:
                function () {
                  setRescheduleLoading(
                    false
                  );
                },
            },
          });

        razorpay.open();
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to start payment"
        );

        setRescheduleLoading(
          false
        );
      }
    };

  /* =========================================================
     HANDLE RESCHEDULE
  ========================================================= */

  const handleReschedule =
    async () => {
      if (!rescheduleBooking) {
        return;
      }

      if (
        !newDate ||
        !newTime
      ) {
        setError(
          "Please select date and time."
        );

        return;
      }

      if (
        rescheduleBooking.partySize >
        4
      ) {
        if (
          selectedTableIds.length ===
          0
        ) {
          setError(
            "Please select the available table combination."
          );

          return;
        }
      } else {
        if (!newTableId) {
          setError(
            "Please select an available table."
          );

          return;
        }
      }

      const fee =
        rescheduleBooking.partySize >
        4
          ? 10
          : 0;

      const confirmed =
        window.confirm(
          fee > 0
            ? "₹10 reschedule fee applies for this booking.\n\nContinue to payment?"
            : "Are you sure you want to reschedule this booking?"
        );

      if (!confirmed) {
        return;
      }

      if (fee > 0) {
        await startRazorpayPayment();

        return;
      }

      try {
        setRescheduleLoading(
          true
        );

        setError("");

        await performReschedule();
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to reschedule booking"
        );
      } finally {
        setRescheduleLoading(
          false
        );
      }
    };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     FORMAT TIME
  ========================================================= */

  const formatTime = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /* =========================================================
     WAITLIST DATE
  ========================================================= */

  const formatWaitlistDate = (
    dateString: string
  ) => {
    return formatDate(
      dateString
    );
  };

  /* =========================================================
     WAITLIST TIME
  ========================================================= */

  const formatWaitlistTime = (
    dateString: string
  ) => {
    return formatTime(
      dateString
    );
  };

  /* =========================================================
     BOOKING STATUS CLASS
  ========================================================= */

  const getStatusClass = (
    status: string
  ) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      case "completed":
        return "bg-blue-100 text-blue-700";

      case "no_show":
        return "bg-gray-100 text-gray-700";

      case "rescheduled":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /* =========================================================
     WAITLIST STATUS CLASS
  ========================================================= */

  const getWaitlistStatusClass = (
    status: string
  ) => {
    switch (status) {
      case "notified":
        return "bg-green-100 text-green-700 border-green-200";

      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";

      default:
        return "bg-orange-100 text-orange-700 border-orange-200";
    }
  };

  return (
    <main className="min-h-screen bg-[#fffaf5] text-gray-900">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="sticky top-0 z-50 bg-white border-b px-5 md:px-12 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="text-2xl font-bold"
          >
            <span className="text-orange-600">
              NIVSSA
            </span>{" "}
            Dine 🍽️
          </button>

          <div className="flex items-center gap-4">

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Home
            </button>

            <button
              onClick={() => {
                localStorage.removeItem(
                  "nivssaToken"
                );

                localStorage.removeItem(
                  "nivssaUser"
                );

                window.location.href =
                  "/auth";
              }}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
            >
              Logout
            </button>

          </div>
        </div>
      </nav>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="max-w-6xl mx-auto px-5 md:px-12 py-12">

        <div className="mb-10">

          <p className="text-orange-600 font-semibold">
            NIVSSA DINE
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mt-2">
            My Bookings
          </h1>

          <p className="text-gray-600 mt-3">
            View and manage your restaurant reservations.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* ===================================================
            WAITLIST SECTION
        =================================================== */}

        <div className="mb-10">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">

            <div>

              <p className="text-orange-600 font-semibold">
                LIVE WAITLIST
              </p>

              <h2 className="text-3xl font-bold mt-1">
                My Waitlist
              </h2>

              <p className="text-gray-600 mt-2">
                Your waitlist position updates automatically.
              </p>

            </div>

            <button
              onClick={() => {
                fetchWaitlist();
              }}
              disabled={waitlistLoading}
              className="w-fit px-5 py-2.5 rounded-xl border border-gray-300 bg-white font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              {waitlistLoading
                ? "Updating..."
                : "↻ Refresh"}
            </button>

          </div>

          {waitlistError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
              {waitlistError}
            </div>
          )}

          {waitlistLoading ? (
            <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">

              <div className="text-4xl">
                ⏳
              </div>

              <p className="mt-3 text-gray-600">
                Loading your waitlist...
              </p>

            </div>
          ) : waitlistEntries.length === 0 ? (
            <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">

              <div className="text-5xl">
                🪑
              </div>

              <h3 className="text-xl font-bold mt-4">
                No Active Waitlist
              </h3>

              <p className="text-gray-600 mt-2">
                You are not currently on a restaurant waitlist.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {waitlistEntries.map(
                (entry) => {
                  const liveStatus =
                    waitlistStatuses[
                      entry._id
                    ];

                  const currentStatus =
                    liveStatus?.status ||
                    entry.status;

                  const currentPosition =
                    liveStatus?.position ??
                    entry.position;

                  const peopleAhead =
                    liveStatus?.peopleAhead;

                  const totalWaiting =
                    liveStatus?.totalWaiting;

                  const isReady =
                    currentStatus ===
                    "notified";

                  const isCancelled =
                    currentStatus ===
                    "cancelled";

                  const restaurantPhone =
                    liveStatus?.restaurant?.phone ||
                    entry.restaurant?.phone;

                  return (
                    <div
                      key={
                        entry._id
                      }
                      className={`bg-white rounded-2xl border shadow-sm p-6 md:p-8 ${
                        isReady
                          ? "border-green-300 ring-2 ring-green-100"
                          : ""
                      }`}
                    >

                      {/* Header */}

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                        <div>

                          <p className="text-sm text-gray-500">
                            Restaurant
                          </p>

                          <h3 className="text-2xl font-bold mt-1">
                            {entry.restaurant
                              ?.name ||
                              liveStatus?.restaurant?.name ||
                              "Restaurant"}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            {entry.restaurant
                              ?.address ||
                              liveStatus?.restaurant?.address ||
                              ""}
                          </p>

                          <p className="text-sm text-gray-700 mt-2 font-medium">
                            📞{" "}
                            {restaurantPhone ||
                              "Phone not available"}
                          </p>

                        </div>

                        <span
                          className={`px-4 py-2 rounded-full border text-sm font-semibold capitalize w-fit ${getWaitlistStatusClass(
                            currentStatus
                          )}`}
                        >
                          {isReady
                            ? "Table Ready 🎉"
                            : isCancelled
                            ? "Cancelled"
                            : "Waiting"}
                        </span>

                      </div>

                      <div className="border-t my-6" />

                      {/* READY MESSAGE */}

                      {isReady && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-6">

                          <div className="flex items-start gap-4">

                            <div className="text-4xl">
                              🎉
                            </div>

                            <div>

                              <h3 className="text-xl font-bold text-green-800">
                                Your Table Is Ready!
                              </h3>

                              <p className="text-green-700 mt-2">
                                Good news! Your waitlist request has been converted into a confirmed reservation.
                              </p>

                              {liveStatus.table && (
                                <p className="font-semibold text-green-800 mt-3">
                                  Table{" "}
                                  {
                                    liveStatus
                                      .table
                                      .tableNumber
                                  }{" "}
                                  is assigned to you.
                                </p>
                              )}

                            </div>

                          </div>

                        </div>
                      )}

                      {/* WAITING POSITION */}

                      {!isReady &&
                        !isCancelled && (
                          <div className="grid md:grid-cols-3 gap-4 mb-6">

                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center">

                              <p className="text-sm text-gray-500">
                                Current Position
                              </p>

                              <p className="text-4xl font-bold text-orange-600 mt-2">
                                {currentPosition ??
                                  "-"}
                              </p>

                              <p className="text-sm text-gray-500 mt-1">
                                in queue
                              </p>

                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">

                              <p className="text-sm text-gray-500">
                                People Ahead
                              </p>

                              <p className="text-4xl font-bold text-blue-600 mt-2">
                                {peopleAhead ??
                                  "-"}
                              </p>

                              <p className="text-sm text-gray-500 mt-1">
                                customers
                              </p>

                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">

                              <p className="text-sm text-gray-500">
                                Total Waiting
                              </p>

                              <p className="text-4xl font-bold text-gray-800 mt-2">
                                {totalWaiting ??
                                  "-"}
                              </p>

                              <p className="text-sm text-gray-500 mt-1">
                                customers
                              </p>

                            </div>

                          </div>
                        )}

                      {/* LIVE MESSAGE */}

                      {!isReady &&
                        !isCancelled &&
                        liveStatus?.message && (
                          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">

                            <p className="text-blue-800 font-semibold">
                              🔄 Live Update
                            </p>

                            <p className="text-blue-700 mt-1">
                              {
                                liveStatus.message
                              }
                            </p>

                          </div>
                        )}

                      {/* DETAILS */}

                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

                        <div>

                          <p className="text-sm text-gray-500">
                            Requested Date
                          </p>

                          <p className="font-semibold mt-1">
                            {formatWaitlistDate(
                              entry.requestedDate
                            )}
                          </p>

                        </div>

                        <div>

                          <p className="text-sm text-gray-500">
                            Requested Time
                          </p>

                          <p className="font-semibold mt-1">
                            {formatWaitlistTime(
                              entry.requestedDate
                            )}
                          </p>

                        </div>

                        <div>

                          <p className="text-sm text-gray-500">
                            Guests
                          </p>

                          <p className="font-semibold mt-1">
                            {
                              entry.partySize
                            }
                          </p>

                        </div>

                        <div>

                          <p className="text-sm text-gray-500">
                            Seating
                          </p>

                          <p className="font-semibold mt-1 capitalize">
                            {
                              entry.seatingPreference
                            }
                          </p>

                        </div>

                      </div>

                      {/* LIVE INDICATOR */}

                      {!isCancelled && (
                        <div className="border-t mt-6 pt-5 flex items-center gap-2 text-sm text-gray-500">

                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />

                          <span>
                            Live waitlist updates every 10 seconds
                          </span>

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* ===================================================
            BOOKINGS
        =================================================== */}

        {loading && (
          <div className="bg-white rounded-2xl border shadow-sm p-10 text-center">

            <div className="text-4xl">
              ⏳
            </div>

            <p className="mt-3 text-gray-600">
              Loading your bookings...
            </p>

          </div>
        )}

        {!loading &&
          reservations.length === 0 && (
            <div className="bg-white rounded-2xl border shadow-sm p-10 text-center">

              <div className="text-6xl">
                🍽️
              </div>

              <h2 className="text-2xl font-bold mt-5">
                No Bookings Found
              </h2>

              <p className="text-gray-600 mt-2">
                You don't have any restaurant bookings yet.
              </p>

              <button
                onClick={() => {
                  window.location.href =
                    "/";
                }}
                className="mt-6 px-6 py-3 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700"
              >
                Book a Table
              </button>

            </div>
          )}

        {!loading &&
          reservations.length > 0 && (
            <div className="space-y-6">

              {reservations.map(
                (reservation) => (
                  <div
                    key={
                      reservation._id
                    }
                    className="bg-white rounded-2xl border shadow-sm p-6 md:p-8"
                  >

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">

                      <div>

                        <p className="text-sm text-gray-500">
                          Booking ID
                        </p>

                        <h2 className="text-xl font-bold text-orange-600 mt-1">
                          {
                            reservation.bookingId
                          }
                        </h2>

                      </div>

                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold capitalize w-fit ${getStatusClass(
                          reservation.status
                        )}`}
                      >
                        {reservation.status.replace(
                          "_",
                          " "
                        )}
                      </span>

                    </div>

                    <div className="border-t my-6" />

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

                      {/* RESTAURANT */}

                      <div>

                        <p className="text-sm text-gray-500">
                          Restaurant
                        </p>

                        <p className="font-semibold mt-1">
                          {reservation.restaurant?.name ||
                            "Restaurant"}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          {reservation.restaurant?.address ||
                            ""}
                        </p>

                        <p className="text-sm text-gray-700 mt-2 font-medium">
                          📞{" "}
                          {reservation.restaurant?.phone ||
                            "Phone not available"}
                        </p>

                      </div>

                      {/* DATE */}

                      <div>

                        <p className="text-sm text-gray-500">
                          Date
                        </p>

                        <p className="font-semibold mt-1">
                          {formatDate(
                            reservation.date
                          )}
                        </p>

                      </div>

                      {/* TIME */}

                      <div>

                        <p className="text-sm text-gray-500">
                          Time
                        </p>

                        <p className="font-semibold mt-1">
                          {formatTime(
                            reservation.date
                          )}
                        </p>

                      </div>

                      {/* GUESTS */}

                      <div>

                        <p className="text-sm text-gray-500">
                          Guests
                        </p>

                        <p className="font-semibold mt-1">
                          {
                            reservation.partySize
                          }
                        </p>

                      </div>

                      {/* TABLE */}

                      <div>

                        <p className="text-sm text-gray-500">
                          Table
                        </p>

                        <p className="font-semibold mt-1">
                          {reservation.tables &&
                          reservation.tables.length >
                            1
                            ? reservation.tables
                                .map(
                                  (table) =>
                                    `Table ${table.tableNumber}`
                                )
                                .join(
                                  ", "
                                )
                            : reservation.table?.tableNumber
                            ? `Table ${reservation.table.tableNumber}`
                            : "Table"}
                        </p>

                      </div>

                      {/* SEATING */}

                      <div>

                        <p className="text-sm text-gray-500">
                          Seating Preference
                        </p>

                        <p className="font-semibold mt-1 capitalize">
                          {
                            reservation.seatingPreference
                          }
                        </p>

                      </div>

                      {/* ARRIVAL STATUS */}

                      <div>

                        <p className="text-sm text-gray-500">
                          Arrival Status
                        </p>

                        <p className="font-semibold mt-1 capitalize">
                          {reservation.arrivalStatus.replace(
                            "_",
                            " "
                          )}
                        </p>

                      </div>

                      {/* GRACE PERIOD */}

                      <div>

                        <p className="text-sm text-gray-500">
                          Grace Period
                        </p>

                        <p className="font-semibold mt-1">
                          {
                            reservation.gracePeriodMinutes
                          }{" "}
                          minutes
                        </p>

                      </div>

                    </div>

                    {reservation.status ===
                      "confirmed" && (
                      <div className="border-t mt-7 pt-6 flex flex-col sm:flex-row gap-3">

                        <button
                          onClick={() =>
                            handleCancel(
                              reservation._id
                            )
                          }
                          disabled={
                            cancelLoading ===
                            reservation._id
                          }
                          className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelLoading ===
                          reservation._id
                            ? "Cancelling..."
                            : "Cancel Booking"}
                        </button>

                        <button
                          onClick={() =>
                            openReschedule(
                              reservation
                            )
                          }
                          className="px-6 py-3 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700"
                        >
                          Reschedule Booking
                        </button>

                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}

      </section>

      {/* =====================================================
          RESCHEDULE MODAL
      ===================================================== */}

      {rescheduleBooking && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-5">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="p-6 md:p-8">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-orange-600 font-semibold">
                    RESCHEDULE BOOKING
                  </p>

                  <h2 className="text-2xl md:text-3xl font-bold mt-1">
                    {
                      rescheduleBooking.bookingId
                    }
                  </h2>

                  <p className="text-gray-600 mt-2">
                    Select a new date, time and table.
                  </p>

                </div>

                <button
                  onClick={
                    closeReschedule
                  }
                  className="text-gray-500 hover:text-gray-900 text-3xl"
                >
                  ×
                </button>

              </div>

              <div className="border-t my-6" />

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">

                <p className="text-sm text-gray-500">
                  Current Booking
                </p>

                <p className="font-semibold mt-1">
                  {
                    formatDate(
                      rescheduleBooking.date
                    )
                  }{" "}
                  at{" "}
                  {
                    formatTime(
                      rescheduleBooking.date
                    )
                  }
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  {
                    rescheduleBooking.partySize
                  }{" "}
                  guests • Table{" "}
                  {
                    rescheduleBooking
                      .table?.tableNumber ||
                    ""
                  }
                </p>

              </div>

              <div className="grid md:grid-cols-2 gap-5">

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    New Date
                  </label>

                  <input
                    type="date"
                    min={getTodayDate()}
                    value={newDate}
                    onChange={(e) => {
                      setNewDate(
                        e.target.value
                      );

                      setNewTime("");
                      setNewTableId("");
                      setSelectedTableIds([]);
                      setAvailableTables([]);
                      setError("");
                    }}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    New Time
                  </label>

                  <select
                    value={newTime}
                    onChange={(e) => {
                      setNewTime(
                        e.target.value
                      );

                      setNewTableId("");
                      setSelectedTableIds([]);
                      setAvailableTables([]);
                      setError("");
                    }}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                  >

                    <option value="">
                      Select time
                    </option>

                    {getTimeSlots(
                      rescheduleBooking
                        .restaurant
                        ?.openingTime,
                      rescheduleBooking
                        .restaurant
                        ?.closingTime
                    ).map(
                      (slot) => (
                        <option
                          key={slot}
                          value={slot}
                        >
                          {formatSlot(
                            slot
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              <button
                onClick={
                  findAvailableTables
                }
                disabled={
                  loadingTables ||
                  !newDate ||
                  !newTime
                }
                className="w-full mt-5 px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingTables
                  ? "Finding Available Tables..."
                  : "Find Available Tables"}
              </button>

              <div className="mt-7">

                <h3 className="text-lg font-bold">
                  Available Tables
                </h3>

                {rescheduleBooking.partySize >
                4 ? (
                  <p className="text-sm text-gray-500 mt-1">
                    A table combination will be used for{" "}
                    {
                      rescheduleBooking.partySize
                    }{" "}
                    guests.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    Choose an available table.
                  </p>
                )}

                {availableTables.length >
                0 ? (
                  <div className="mt-4">

                    {rescheduleBooking.partySize >
                    4 ? (
                      <div className="border-2 border-orange-600 bg-orange-50 rounded-xl p-5">

                        <div className="flex items-center justify-between">

                          <p className="font-bold text-lg">
                            Recommended Table Combination
                          </p>

                          <span className="text-orange-600 font-bold">
                            ✓ Selected
                          </span>

                        </div>

                        <div className="mt-4 space-y-3">

                          {availableTables.map(
                            (table) => (
                              <div
                                key={
                                  table._id
                                }
                                className="bg-white border rounded-lg p-3"
                              >

                                <div className="flex justify-between">

                                  <p className="font-semibold">
                                    Table{" "}
                                    {
                                      table.tableNumber
                                    }
                                  </p>

                                  <p className="text-sm text-gray-600">
                                    Capacity{" "}
                                    {
                                      table.capacity
                                    }
                                  </p>

                                </div>

                                <p className="text-sm text-gray-500 capitalize mt-1">
                                  {
                                    table.section
                                  }{" "}
                                  •{" "}
                                  {
                                    table.seatingType
                                  }
                                </p>

                              </div>
                            )
                          )}

                        </div>

                        <div className="border-t mt-4 pt-4 flex justify-between">

                          <p className="font-semibold">
                            Total Capacity
                          </p>

                          <p className="font-bold text-orange-600">
                            {
                              availableTables.reduce(
                                (
                                  total,
                                  table
                                ) =>
                                  total +
                                  table.capacity,
                                0
                              )
                            }{" "}
                            guests
                          </p>

                        </div>

                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">

                        {availableTables.map(
                          (table) => (
                            <button
                              key={
                                table._id
                              }
                              type="button"
                              onClick={() =>
                                setNewTableId(
                                  table._id
                                )
                              }
                              className={`text-left border-2 rounded-xl p-4 transition ${
                                newTableId ===
                                table._id
                                  ? "border-orange-600 bg-orange-50 shadow-md"
                                  : "border-gray-200 hover:border-orange-300"
                              }`}
                            >

                              <div className="flex items-center justify-between">

                                <p className="font-bold text-lg">
                                  Table{" "}
                                  {
                                    table.tableNumber
                                  }
                                </p>

                                {newTableId ===
                                  table._id && (
                                  <span className="text-orange-600 font-bold">
                                    ✓ Selected
                                  </span>
                                )}

                              </div>

                              <p className="text-sm text-gray-600 mt-2">
                                Capacity:{" "}
                                {
                                  table.capacity
                                }{" "}
                                guests
                              </p>

                              <p className="text-sm text-gray-600 capitalize">
                                Section:{" "}
                                {
                                  table.section
                                }
                              </p>

                              <p className="text-sm text-gray-600 capitalize">
                                Type:{" "}
                                {
                                  table.seatingType
                                }
                              </p>

                            </button>
                          )
                        )}

                      </div>
                    )}

                  </div>
                ) : (
                  <div className="mt-4 border border-dashed border-gray-300 rounded-xl p-5 text-center text-gray-500">
                    Select date and time, then click{" "}
                    <strong>
                      Find Available Tables
                    </strong>
                    .
                  </div>
                )}

              </div>

              <div className="mt-6 bg-gray-50 rounded-xl p-5">

                <div className="flex items-center justify-between">

                  <p className="font-semibold">
                    Reschedule Fee
                  </p>

                  <p className="text-xl font-bold text-orange-600">
                    ₹
                    {rescheduleBooking.partySize >
                    4
                      ? "10"
                      : "0"}
                  </p>

                </div>

                {rescheduleBooking.partySize >
                4 ? (
                  <p className="text-gray-600 text-sm mt-2">
                    ₹10 payment is required before rescheduling this booking.
                  </p>
                ) : (
                  <p className="text-gray-600 text-sm mt-2">
                    No reschedule fee for 4 or fewer guests.
                  </p>
                )}

              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-7">

                <button
                  onClick={
                    closeReschedule
                  }
                  disabled={
                    rescheduleLoading
                  }
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  onClick={
                    handleReschedule
                  }
                  disabled={
                    rescheduleLoading ||
                    (rescheduleBooking.partySize >
                    4
                      ? selectedTableIds.length ===
                        0
                      : !newTableId)
                  }
                  className="flex-1 px-6 py-3 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rescheduleLoading
                    ? "Processing..."
                    : rescheduleBooking.partySize >
                      4
                    ? "Pay ₹10 & Reschedule"
                    : "Confirm Reschedule"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-gray-950 text-white px-6 py-10 mt-12">

        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-2xl font-bold">
            NIVSSA Dine 🍽️
          </h2>

          <p className="text-gray-400 mt-2">
            Book. Dine. Relax.
          </p>

          <p className="text-gray-500 text-sm mt-3">
            Smart restaurant reservation & waitlist management.
          </p>

        </div>

      </footer>

    </main>
  );
}