"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_BASE_URL =
  "http://localhost:5000/api";

type Restaurant = {
  name: string;
  phone: string;
  email: string;
  address: string;
  openingTime: string;
  closingTime: string;
  openDays: string[];
  seatingOptions: string[];
  cuisine: string[];
  priceForTwo: number;
  totalTables: number;
  maximumCapacity: number;
  averageTurnTime: number;
  specialInfo: string[];
};

type TableRestaurant = {
  _id: string;
  name: string;
  address: string;
  openingTime: string;
  closingTime: string;
  openDays: string[];
};

type Table = {
  _id: string;
  tableNumber: number;
  capacity: number;
  section: string;
  seatingType: string;
  status: string;
  turnTime: number;
  restaurant:
    | string
    | TableRestaurant;
};

type ReservationResponse = {
  bookingId?: string;
  walletAmountUsed?: number;
  walletBalanceAfter?: number;
  reservation?: {
    bookingId?: string;
    walletAmountUsed?: number;
  };
  message?: string;
};

type WalletResponse = {
  walletBalance?: number;
  referralCode?: string | null;
  referralBonusEarned?: number;
  message?: string;
};

type WaitlistResponse = {
  message?: string;
  waitlist?: {
    _id?: string;
    position?: number;
    status?: string;
  };
};

const restaurants: Restaurant[] = [
  {
    name: "The Royal Crown",
    phone: "8240690093",
    email: "royalcrown17@gmail.com",
    address: "Salt Lake Sector 5",
    openingTime: "12:00",
    closingTime: "02:00",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    seatingOptions: [
      "Indoor",
      "Outdoor",
      "Window",
      "Private",
    ],
    cuisine: [
      "North Indian",
      "Mughlai",
      "Indian",
    ],
    priceForTwo: 1500,
    totalTables: 25,
    maximumCapacity: 100,
    averageTurnTime: 90,
    specialInfo: [
      "Live Music",
      "Private Dining Area",
      "Valet Parking",
      "Premium Customer Service",
    ],
  },

  {
    name: "The Imperial Palace",
    phone: "7061767570",
    email:
      "imperialpalace17@gmail.com",
    address: "RDC CINEMA, Sector 5",
    openingTime: "10:00",
    closingTime: "02:00",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    seatingOptions: [
      "Indoor",
      "Outdoor",
      "Window",
      "Private",
    ],
    cuisine: [
      "North Indian",
      "Mughlai",
      "Chinese",
      "Continental",
    ],
    priceForTwo: 2200,
    totalTables: 30,
    maximumCapacity: 120,
    averageTurnTime: 90,
    specialInfo: [
      "Live Music",
      "Private Dining Area",
      "Valet Parking",
      "Birthday and Party Booking",
      "Premium Royal Ambience",
      "Free Wi-Fi",
    ],
  },

  {
    name: "The Grand Maharaja",
    phone: "7371936941",
    email:
      "grandmaharaja17@gmail.com",
    address: "City Center, Kolkata",
    openingTime: "11:00",
    closingTime: "03:00",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    seatingOptions: [
      "Indoor",
      "Outdoor",
      "Window",
      "Private",
    ],
    cuisine: [
      "North Indian",
      "Mughlai",
      "Bengali",
      "Tandoori",
    ],
    priceForTwo: 2500,
    totalTables: 35,
    maximumCapacity: 150,
    averageTurnTime: 100,
    specialInfo: [
      "Live Ghazal Music",
      "Private Maharaja Dining Room",
      "Large Party Hall",
      "Valet Parking",
      "Birthday and Wedding Celebration Booking",
    ],
  },

  {
    name: "Royal Dynasty",
    phone: "8250473619",
    email:
      "royaldynasty17@gmail.com",
    address:
      "EM Bypass, Ruby, Kolkata",
    openingTime: "12:00",
    closingTime: "04:00",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    seatingOptions: [
      "Indoor",
      "Outdoor",
      "Window",
      "Private",
    ],
    cuisine: [
      "Chinese",
      "Thai",
      "Japanese",
      "Continental",
    ],
    priceForTwo: 2800,
    totalTables: 40,
    maximumCapacity: 180,
    averageTurnTime: 110,
    specialInfo: [
      "Rooftop Dining",
      "DJ Night on Weekends",
      "Private VIP Lounge",
      "Romantic Window Seating",
      "Corporate Party Booking",
      "Free Wi-Fi",
    ],
  },

  {
    name: "The Golden Table",
    phone: "9831125476",
    email:
      "goldentable17@gmail.com",
    address: "VIP Bazar, Kolkata",
    openingTime: "05:00",
    closingTime: "22:00",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    seatingOptions: [
      "Indoor",
      "Outdoor",
      "Window",
      "Private",
    ],
    cuisine: [
      "Breakfast",
      "Cafe",
      "Continental",
      "Italian",
      "Indian",
    ],
    priceForTwo: 1600,
    totalTables: 28,
    maximumCapacity: 100,
    averageTurnTime: 75,
    specialInfo: [
      "Early Morning Breakfast Service",
      "Coffee Lounge",
      "Work-Friendly Seating",
      "Free Wi-Fi",
      "Outdoor Brunch Area",
      "Special Weekend Breakfast Menu",
    ],
  },
];

const formatTime = (
  time: string
) => {
  const [
    hourString,
    minuteString,
  ] = time.split(":");

  const hour = Number(
    hourString
  );

  const minute = Number(
    minuteString
  );

  const hour12 =
    hour % 12 || 12;

  const period =
    hour >= 12 ? "PM" : "AM";

  return `${String(
    hour12
  ).padStart(
    2,
    "0"
  )}:${String(
    minute
  ).padStart(
    2,
    "0"
  )} ${period}`;
};

const timeToMinutes = (
  time: string
) => {
  const [
    hour,
    minute,
  ] = time
    .split(":")
    .map(Number);

  return (
    hour * 60 + minute
  );
};

const getTodayString = () => {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      today.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createLocalDateTime = (
  dateString: string,
  timeString: string
) => {
  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  const [
    hour,
    minute,
  ] = timeString
    .split(":")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );
};

const getTimeSlots = (
  openingTime: string,
  closingTime: string,
  selectedDate: string
) => {
  const slots: string[] =
    [];

  const openingMinutes =
    timeToMinutes(
      openingTime
    );

  let closingMinutes =
    timeToMinutes(
      closingTime
    );

  const crossesMidnight =
    closingMinutes <=
    openingMinutes;

  if (crossesMidnight) {
    closingMinutes +=
      24 * 60;
  }

  const lastBookingMinutes =
    closingMinutes - 60;

  const todayString =
    getTodayString();

  const isToday =
    selectedDate ===
    todayString;

  const now =
    new Date();

  for (
    let minutes =
      openingMinutes;
    minutes <=
    lastBookingMinutes;
    minutes += 15
  ) {
    const normalizedMinutes =
      minutes %
      (24 * 60);

    const hour24 =
      Math.floor(
        normalizedMinutes / 60
      );

    const minute =
      normalizedMinutes % 60;

    let slotDate =
      selectedDate;

    if (
      crossesMidnight &&
      hour24 * 60 +
          minute <
        openingMinutes
    ) {
      const selected =
        new Date(
          `${selectedDate}T00:00:00`
        );

      selected.setDate(
        selected.getDate() + 1
      );

      const year =
        selected.getFullYear();

      const month =
        String(
          selected.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          selected.getDate()
        ).padStart(2, "0");

      slotDate = `${year}-${month}-${day}`;
    }

    const actualTime =
      `${String(
        hour24
      ).padStart(
        2,
        "0"
      )}:${String(
        minute
      ).padStart(
        2,
        "0"
      )}`;

    const slotDateTime =
      createLocalDateTime(
        slotDate,
        actualTime
      );

    if (
      isToday &&
      slotDateTime.getTime() <=
        now.getTime() +
          2 * 60 * 1000
    ) {
      continue;
    }

    const hour12 =
      hour24 % 12 ||
      12;

    const period =
      hour24 >= 12
        ? "PM"
        : "AM";

    const displayTime =
      `${String(
        hour12
      ).padStart(
        2,
        "0"
      )}:${String(
        minute
      ).padStart(
        2,
        "0"
      )} ${period}`;

    slots.push(
      `${actualTime}|${displayTime}`
    );
  }

  return slots;
};

export default function Home() {
  const [restaurant, setRestaurant] =
    useState<Restaurant>(
      restaurants[0]
    );

  const [
    reservationDate,
    setReservationDate,
  ] = useState("");

  const [time, setTime] =
    useState("");

  const [guests, setGuests] =
    useState("2");

  const [
    seatingPreference,
    setSeatingPreference,
  ] = useState("any");

  const [tables, setTables] =
    useState<Table[]>([]);

  const [
    loadingTables,
    setLoadingTables,
  ] = useState(false);

  const [searched, setSearched] =
    useState(false);

  const [
    selectedTable,
    setSelectedTable,
  ] = useState<Table | null>(
    null
  );

  const [
    showCustomerForm,
    setShowCustomerForm,
  ] = useState(false);

  const [
    showSuccessPopup,
    setShowSuccessPopup,
  ] = useState(false);

  const [
    bookingLoading,
    setBookingLoading,
  ] = useState(false);

  const [
    bookingError,
    setBookingError,
  ] = useState("");

  const [bookingId, setBookingId] =
    useState("");

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    waitlistLoading,
    setWaitlistLoading,
  ] = useState(false);

  const [
    waitlistSuccess,
    setWaitlistSuccess,
  ] = useState(false);

  const [
    waitlistPosition,
    setWaitlistPosition,
  ] = useState<number | null>(
    null
  );

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    showComingSoon,
    setShowComingSoon,
  ] = useState(false);

  const [
    comingSoonName,
    setComingSoonName,
  ] = useState("");

  /* =====================================================
     WALLET STATE
  ===================================================== */

  const [
    walletBalance,
    setWalletBalance,
  ] = useState(0);

  const [
    walletLoading,
    setWalletLoading,
  ] = useState(true);

  const [
    useWallet,
    setUseWallet,
  ] = useState(false);

  const [
    walletAmountUsed,
    setWalletAmountUsed,
  ] = useState(0);

  /* =====================================================
     LOAD USER + WALLET
  ===================================================== */

  useEffect(() => {
    setReservationDate(
      getTodayString()
    );

    const savedUser =
      localStorage.getItem(
        "nivssaUser"
      );

    if (savedUser) {
      try {
        const user =
          JSON.parse(
            savedUser
          );

        setName(
          user.name || ""
        );

        setEmail(
          user.email || ""
        );

        setPhone(
          user.phone || ""
        );
      } catch {
        console.log(
          "Could not load saved user"
        );
      }
    }

    const loadWallet =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "nivssaToken"
            );

          if (!token) {
            setWalletBalance(0);
            setUseWallet(false);
            return;
          }

          const response =
            await fetch(
              `${API_BASE_URL}/wallet`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const data: WalletResponse =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to load wallet"
            );
          }

          const balance =
            Number(
              data.walletBalance ||
                0
            );

          setWalletBalance(
            Math.max(
              0,
              balance
            )
          );

          setUseWallet(
            balance > 0
          );
        } catch (error) {
          console.error(
            "Load wallet error:",
            error
          );

          setWalletBalance(
            0
          );

          setUseWallet(
            false
          );
        } finally {
          setWalletLoading(
            false
          );
        }
      };

    loadWallet();
  }, []);

  const timeSlots = useMemo(() => {
    return getTimeSlots(
      restaurant.openingTime,
      restaurant.closingTime,
      reservationDate
    );
  }, [
    restaurant,
    reservationDate,
  ]);

  useEffect(() => {
    if (
      time &&
      !timeSlots.some(
        (slot) =>
          slot.split("|")[0] ===
          time
      )
    ) {
      setTime("");
    }
  }, [
    time,
    timeSlots,
  ]);

  const filteredTables =
    useMemo(() => {
      return tables.filter(
        (table) => {
          if (
            table.status !==
            "available"
          ) {
            return false;
          }

          if (
            table.capacity <
            Number(guests)
          ) {
            return false;
          }

          if (
            seatingPreference !==
            "any"
          ) {
            const requested =
              seatingPreference.toLowerCase();

            if (
              table.section.toLowerCase() !==
                requested &&
              table.seatingType.toLowerCase() !==
                requested
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      tables,
      guests,
      seatingPreference,
    ]);

  const findTables =
    async () => {
      try {
        setLoadingTables(
          true
        );

        setSearched(false);

        setSelectedTable(
          null
        );

        setBookingError("");

        setWaitlistSuccess(
          false
        );

        setWaitlistPosition(
          null
        );

        if (!reservationDate) {
          setBookingError(
            "Please select a date."
          );
          return;
        }

        if (!time) {
          setBookingError(
            "Please select a time."
          );
          return;
        }

        const selectedDateTime =
          createLocalDateTime(
            reservationDate,
            time
          );

        const now =
          new Date();

        if (
          selectedDateTime.getTime() <=
          now.getTime()
        ) {
          setBookingError(
            "Please select a future time."
          );

          setTime("");

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

        const params =
          new URLSearchParams();

        params.set(
          "restaurantName",
          restaurant.name
        );

        params.set(
          "date",
          reservationDate
        );

        params.set(
          "time",
          time
        );

        params.set(
          "partySize",
          String(guests)
        );

        params.set(
          "seatingPreference",
          seatingPreference
        );

        const response =
          await fetch(
            `${API_BASE_URL}/tables/available?${params.toString()}`,
            {
              method: "GET",
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
              "Failed to find tables"
          );
        }

        setTables(
          data.tables || []
        );

        setSearched(
          true
        );
      } catch (
        error: any
      ) {
        console.error(
          "Find tables error:",
          error
        );

        setBookingError(
          error.message ||
            "Failed to find tables"
        );
      } finally {
        setLoadingTables(
          false
        );
      }
    };

  const openCustomerForm =
    (table: Table) => {
      setSelectedTable(
        table
      );

      setShowCustomerForm(
        true
      );

      setBookingError("");

      /*
        Refresh wallet when customer
        opens the confirmation form.
      */
      const refreshWallet =
        async () => {
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
                `${API_BASE_URL}/wallet`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            const data: WalletResponse =
              await response.json();

            if (!response.ok) {
              return;
            }

            const balance =
              Math.max(
                0,
                Number(
                  data.walletBalance ||
                    0
                )
              );

            setWalletBalance(
              balance
            );

            setUseWallet(
              balance > 0
            );
          } catch {
            // Wallet is optional for booking UI.
          }
        };

      refreshWallet();
    };

  const createReservation =
    async () => {
      try {
        setBookingLoading(
          true
        );

        setBookingError("");

        if (!selectedTable) {
          throw new Error(
            "Please select a table."
          );
        }

        if (!name.trim()) {
          throw new Error(
            "Please enter your name."
          );
        }

        if (!phone.trim()) {
          throw new Error(
            "Please enter your phone number."
          );
        }

        if (!email.trim()) {
          throw new Error(
            "Please enter your email."
          );
        }

        if (
          !reservationDate ||
          !time
        ) {
          throw new Error(
            "Please select date and time."
          );
        }

        const selectedDateTime =
          createLocalDateTime(
            reservationDate,
            time
          );

        if (
          selectedDateTime.getTime() <=
          new Date().getTime()
        ) {
          throw new Error(
            "Please select a future reservation time."
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

        let restaurantId = "";

        if (
          typeof selectedTable.restaurant ===
          "string"
        ) {
          restaurantId =
            selectedTable.restaurant;
        } else {
          restaurantId =
            selectedTable.restaurant._id;
        }

        if (!restaurantId) {
          throw new Error(
            "Restaurant information is missing."
          );
        }

        const shouldUseWallet =
          useWallet &&
          walletBalance > 0;

        const response =
          await fetch(
            `${API_BASE_URL}/reservations`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                restaurant:
                  restaurantId,

                table:
                  selectedTable._id,

                date:
                  selectedDateTime.toISOString(),

                partySize:
                  Number(guests),

                seatingPreference,

                notes: "",

                useWallet:
                  shouldUseWallet,
              }),
            }
          );

        const data: ReservationResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Booking failed"
          );
        }

        const newBookingId =
          data.bookingId ||
          data.reservation
            ?.bookingId ||
          "";

        const redeemedAmount =
          Number(
            data.walletAmountUsed ||
              data.reservation
                ?.walletAmountUsed ||
              0
          );

        setBookingId(
          newBookingId
        );

        setWalletAmountUsed(
          redeemedAmount
        );

        /*
          Backend uses the current
          available balance at booking time.
          Usually this becomes 0 because
          the full wallet balance is redeemed.
        */
        setWalletBalance(
          Math.max(
            0,
            Number(
              data.walletBalanceAfter ??
                walletBalance -
                  redeemedAmount
            )
          )
        );

        setUseWallet(false);

        setShowCustomerForm(
          false
        );

        setShowSuccessPopup(
          true
        );

        setTables([]);

        setSearched(
          false
        );
      } catch (
        error: any
      ) {
        console.error(
          "Create reservation error:",
          error
        );

        setBookingError(
          error.message ||
            "Booking failed"
        );
      } finally {
        setBookingLoading(
          false
        );
      }
    };

  const joinWaitlist =
    async () => {
      try {
        setWaitlistLoading(
          true
        );

        setBookingError("");

        setWaitlistSuccess(
          false
        );

        setWaitlistPosition(
          null
        );

        if (!reservationDate) {
          throw new Error(
            "Please select a date."
          );
        }

        if (!time) {
          throw new Error(
            "Please select a time."
          );
        }

        const requestedDateObject =
          createLocalDateTime(
            reservationDate,
            time
          );

        if (
          requestedDateObject.getTime() <=
          new Date().getTime()
        ) {
          throw new Error(
            "Please select a future time."
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

        const response =
          await fetch(
            `${API_BASE_URL}/waitlist`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                partySize:
                  Number(guests),

                seatingPreference,

                requestedDate:
                  requestedDateObject.toISOString(),

                notes:
                  `Restaurant: ${restaurant.name}`,
              }),
            }
          );

        const data: WaitlistResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to join waitlist"
          );
        }

        setWaitlistPosition(
          data.waitlist
            ?.position ??
            null
        );

        setWaitlistSuccess(
          true
        );
      } catch (
        error: any
      ) {
        console.error(
          "Join waitlist error:",
          error
        );

        setBookingError(
          error.message ||
            "Failed to join waitlist"
        );
      } finally {
        setWaitlistLoading(
          false
        );
      }
    };

  const closeSuccessPopup =
    () => {
      setShowSuccessPopup(
        false
      );

      setBookingId(
        ""
      );

      setSelectedTable(
        null
      );

      setWalletAmountUsed(
        0
      );
    };

  const closeWaitlistPopup =
    () => {
      setWaitlistSuccess(
        false
      );

      setWaitlistPosition(
        null
      );
    };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const showFutureSection =
    (sectionName: string) => {
      if (
        sectionName ===
        "Profile"
      ) {
        window.location.href =
          "/profile";

        return;
      }

      if (
        sectionName ===
        "Refer & Earn"
      ) {
        window.location.href =
          "/refer-earn";

        return;
      }

      if (
        sectionName ===
        "Wallet"
      ) {
        window.location.href =
          "/wallet";

        return;
      }

      setComingSoonName(
        sectionName
      );

      setShowComingSoon(
        true
      );

      setMobileMenuOpen(
        false
      );
    };

  const logout = () => {
    localStorage.removeItem(
      "nivssaToken"
    );

    localStorage.removeItem(
      "nivssaUser"
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    window.location.href =
      "/auth";
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =========================
          CUSTOMER NAVBAR
      ========================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

          <button
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              });

              setMobileMenuOpen(
                false
              );
            }}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg font-black text-white shadow-sm">
              N
            </div>

            <div className="text-left">
              <h1 className="text-xl font-black tracking-tight">
                NIVSSA Dine
              </h1>

              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Smart Dining
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">

            <button
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior:
                    "smooth",
                });
              }}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Home
            </button>

            <button
              onClick={() => {
                document
                  .getElementById(
                    "restaurant-section"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  });
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Restaurants
            </button>

            <a
              href="/my-bookings"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              My Bookings
            </a>

            <button
              onClick={() =>
                showFutureSection(
                  "Waitlist"
                )
              }
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Waitlist
            </button>

            <button
              onClick={() =>
                showFutureSection(
                  "Wallet"
                )
              }
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Wallet
            </button>

            <button
              onClick={() =>
                showFutureSection(
                  "Refer & Earn"
                )
              }
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Refer & Earn
            </button>

            <a
              href="/coupons"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              🎁 Coupons
            </a>

          </nav>

          <div className="hidden items-center gap-3 lg:flex">

            <a
              href="/profile"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {name
                  ? name
                      .charAt(
                        0
                      )
                      .toUpperCase()
                  : "U"}
              </span>

              <span className="max-w-[120px] truncate">
                {name ||
                  "My Account"}
              </span>
            </a>

            <button
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Logout
            </button>

          </div>

          <button
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-xl lg:hidden"
            aria-label="Open navigation"
          >
            ☰
          </button>

        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-md lg:hidden">

            <div className="space-y-1">

              <button
                onClick={() => {
                  window.scrollTo({
                    top: 0,
                    behavior:
                      "smooth",
                  });

                  setMobileMenuOpen(
                    false
                  );
                }}
                className="w-full rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-slate-100"
              >
                Home
              </button>

              <button
                onClick={() => {
                  document
                    .getElementById(
                      "restaurant-section"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    });

                  setMobileMenuOpen(
                    false
                  );
                }}
                className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-slate-100"
              >
                Restaurants
              </button>

              <a
                href="/my-bookings"
                className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-100"
              >
                My Bookings
              </a>

              <button
                onClick={() =>
                  showFutureSection(
                    "Waitlist"
                  )
                }
                className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-slate-100"
              >
                Waitlist
              </button>

              <button
                onClick={() =>
                  showFutureSection(
                    "Wallet"
                  )
                }
                className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-slate-100"
              >
                Wallet
              </button>

              <button
                onClick={() =>
                  showFutureSection(
                    "Refer & Earn"
                  )
                }
                className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-slate-100"
              >
                Refer & Earn
              </button>

              <a
                href="/coupons"
                className="block w-full rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-slate-100"
              >
                🎁 Coupons
              </a>

              <a
                href="/profile"
                className="block w-full rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-slate-100"
              >
                Profile
              </a>

              <button
                onClick={logout}
                className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-3 text-left text-sm font-semibold text-white"
              >
                Logout
              </button>

            </div>
          </div>
        )}

      </header>

      {/* =========================
          MAIN CONTENT
      ========================== */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">

          {/* BOOKING FORM */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold">
              Book a Table
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select restaurant, date, time and seating preference.
            </p>

            <div className="mt-6 space-y-5">

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Restaurant
                </label>

                <select
                  value={
                    restaurant.name
                  }
                  onChange={(
                    event
                  ) => {
                    const selected =
                      restaurants.find(
                        (item) =>
                          item.name ===
                          event
                            .target
                            .value
                      );

                    if (
                      selected
                    ) {
                      setRestaurant(
                        selected
                      );

                      setTime("");
                      setSearched(
                        false
                      );
                      setTables(
                        []
                      );
                      setSelectedTable(
                        null
                      );
                      setBookingError(
                        ""
                      );
                      setWaitlistSuccess(
                        false
                      );
                      setWaitlistPosition(
                        null
                      );
                    }
                  }}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-slate-500"
                >
                  {restaurants.map(
                    (
                      item
                    ) => (
                      <option
                        key={
                          item.name
                        }
                        value={
                          item.name
                        }
                      >
                        {
                          item.name
                        }
                      </option>
                    )
                  )}
                </select>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-sm font-semibold">
                  Restaurant Timing
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {formatTime(
                    restaurant.openingTime
                  )}{" "}
                  -{" "}
                  {formatTime(
                    restaurant.closingTime
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Last booking is available 1 hour before closing.
                </p>

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Date
                </label>

                <input
                  type="date"
                  value={
                    reservationDate
                  }
                  min={getTodayString()}
                  onChange={(
                    event
                  ) => {
                    setReservationDate(
                      event
                        .target
                        .value
                    );

                    setTime("");
                    setSearched(
                      false
                    );
                    setTables(
                      []
                    );
                    setSelectedTable(
                      null
                    );
                    setBookingError(
                      ""
                    );
                    setWaitlistSuccess(
                      false
                    );
                    setWaitlistPosition(
                      null
                    );
                  }}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-slate-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Preferred Time
                </label>

                <select
                  value={
                    time
                  }
                  onChange={(
                    event
                  ) => {
                    setTime(
                      event
                        .target
                        .value
                    );

                    setBookingError(
                      ""
                    );
                  }}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-slate-500"
                >

                  <option value="">
                    Select time
                  </option>

                  {timeSlots.length ===
                  0 ? (
                    <option
                      disabled
                    >
                      No available time slots
                    </option>
                  ) : (
                    timeSlots.map(
                      (
                        slot
                      ) => {
                        const [
                          actualTime,
                          displayTime,
                        ] =
                          slot.split(
                            "|"
                          );

                        return (
                          <option
                            key={
                              actualTime
                            }
                            value={
                              actualTime
                            }
                          >
                            {
                              displayTime
                            }
                          </option>
                        );
                      }
                    )
                  )}

                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Time slots are available every 15 minutes.
                </p>

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Number of Guests
                </label>

                <select
                  value={
                    guests
                  }
                  onChange={(
                    event
                  ) => {
                    setGuests(
                      event
                        .target
                        .value
                    );

                    setSearched(
                      false
                    );

                    setTables(
                      []
                    );

                    setSelectedTable(
                      null
                    );

                    setBookingError(
                      ""
                    );

                    setWaitlistSuccess(
                      false
                    );

                    setWaitlistPosition(
                      null
                    );
                  }}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-slate-500"
                >
                  {Array.from(
                    {
                      length: 12,
                    },
                    (
                      _,
                      index
                    ) =>
                      index + 1
                  ).map(
                    (
                      number
                    ) => (
                      <option
                        key={
                          number
                        }
                        value={
                          number
                        }
                      >
                        {number}{" "}
                        {number ===
                        1
                          ? "Guest"
                          : "Guests"}
                      </option>
                    )
                  )}
                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Seating Preference
                </label>

                <select
                  value={
                    seatingPreference
                  }
                  onChange={(
                    event
                  ) => {
                    setSeatingPreference(
                      event
                        .target
                        .value
                    );

                    setSearched(
                      false
                    );

                    setTables(
                      []
                    );

                    setSelectedTable(
                      null
                    );

                    setBookingError(
                      ""
                    );

                    setWaitlistSuccess(
                      false
                    );

                    setWaitlistPosition(
                      null
                    );
                  }}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-slate-500"
                >
                  <option value="any">
                    Any Seating
                  </option>

                  <option value="indoor">
                    Indoor
                  </option>

                  <option value="outdoor">
                    Outdoor
                  </option>

                  <option value="window">
                    Window
                  </option>

                  <option value="private">
                    Private
                  </option>
                </select>

              </div>

              {bookingError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {
                    bookingError
                  }
                </div>
              )}

              <button
                onClick={
                  findTables
                }
                disabled={
                  loadingTables
                }
                className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingTables
                  ? "Finding Tables..."
                  : "Find Available Tables"}
              </button>

            </div>
          </div>

          {/* RESTAURANT DETAILS */}

          <div className="space-y-6">

            <div
              id="restaurant-section"
              className="rounded-2xl bg-white p-6 shadow-sm"
            >

              <h2 className="text-xl font-bold">
                {
                  restaurant.name
                }
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {
                  restaurant.address
                }
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Cuisine
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {restaurant.cuisine.join(
                      ", "
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Price for Two
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    ₹
                    {
                      restaurant.priceForTwo
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Average Turn Time
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {
                      restaurant.averageTurnTime
                    }{" "}
                    minutes
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Seating
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {restaurant.seatingOptions.join(
                      ", "
                    )}
                  </p>
                </div>

              </div>

              <div className="mt-5">

                <p className="text-sm font-semibold">
                  Special Information
                </p>

                <div className="mt-3 flex flex-wrap gap-2">

                  {restaurant.specialInfo.map(
                    (
                      info
                    ) => (
                      <span
                        key={
                          info
                        }
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                      >
                        {
                          info
                        }
                      </span>
                    )
                  )}

                </div>

              </div>

            </div>

            {/* AVAILABLE TABLES */}

            {searched && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-xl font-bold">
                      Available Tables
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Suitable for{" "}
                      {guests}{" "}
                      {Number(
                        guests
                      ) ===
                      1
                        ? "guest"
                        : "guests"}
                    </p>
                  </div>

                  <span
                    className={
                      filteredTables.length >
                      0
                        ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                        : "rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700"
                    }
                  >
                    {
                      filteredTables.length
                    }{" "}
                    Available
                  </span>

                </div>

                {filteredTables.length ===
                0 ? (
                  <div className="mt-6 rounded-xl bg-yellow-50 p-5">

                    <p className="text-sm font-semibold text-yellow-900">
                      No suitable table is available
                    </p>

                    <p className="mt-2 text-sm text-yellow-800">
                      The selected table criteria are currently full.
                      You can try another time or join the waitlist.
                    </p>

                    <div className="mt-4 rounded-lg bg-white/70 p-4 text-sm text-yellow-900">

                      <p>
                        <strong>
                          Restaurant:
                        </strong>{" "}
                        {
                          restaurant.name
                        }
                      </p>

                      <p className="mt-1">
                        <strong>
                          Date:
                        </strong>{" "}
                        {
                          reservationDate
                        }
                      </p>

                      <p className="mt-1">
                        <strong>
                          Time:
                        </strong>{" "}
                        {time
                          ? formatTime(
                              time
                            )
                          : "-"}
                      </p>

                      <p className="mt-1">
                        <strong>
                          Guests:
                        </strong>{" "}
                        {
                          guests
                        }
                      </p>

                      <p className="mt-1">
                        <strong>
                          Seating:
                        </strong>{" "}
                        {seatingPreference ===
                        "any"
                          ? "Any Seating"
                          : seatingPreference}
                      </p>

                    </div>

                    <button
                      onClick={
                        joinWaitlist
                      }
                      disabled={
                        waitlistLoading
                      }
                      className="mt-4 w-full rounded-lg bg-yellow-600 px-4 py-3 font-semibold text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {waitlistLoading
                        ? "Joining Waitlist..."
                        : "Join Waitlist"}
                    </button>

                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">

                    {filteredTables.map(
                      (
                        table
                      ) => (
                        <div
                          key={
                            table._id
                          }
                          className="rounded-xl border p-4"
                        >

                          <div className="flex items-start justify-between">

                            <div>

                              <p className="font-bold">
                                Table{" "}
                                {
                                  table.tableNumber
                                }
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Capacity:{" "}
                                {
                                  table.capacity
                                }
                              </p>

                            </div>

                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                              Available
                            </span>

                          </div>

                          <div className="mt-4 space-y-1 text-sm text-slate-600">

                            <p>
                              Section:{" "}
                              {
                                table.section
                              }
                            </p>

                            <p>
                              Seating:{" "}
                              {
                                table.seatingType
                              }
                            </p>

                            <p>
                              Turn Time:{" "}
                              {
                                table.turnTime
                              }{" "}
                              min
                            </p>

                          </div>

                          <button
                            onClick={() =>
                              openCustomerForm(
                                table
                              )
                            }
                            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            Select Table
                          </button>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </section>

      {/* CUSTOMER FORM */}

      {showCustomerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

            <div className="flex items-start justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  Customer Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Table{" "}
                  {
                    selectedTable?.tableNumber
                  }{" "}
                  at{" "}
                  {
                    restaurant.name
                  }
                </p>

              </div>

              <button
                onClick={() =>
                  setShowCustomerForm(
                    false
                  )
                }
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>

            </div>

            <div className="mt-6 space-y-4">

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Full Name
                </label>

                <input
                  value={
                    name
                  }
                  onChange={(
                    event
                  ) =>
                    setName(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Enter your name"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-slate-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Phone
                </label>

                <input
                  value={
                    phone
                  }
                  onChange={(
                    event
                  ) =>
                    setPhone(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-slate-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Email
                </label>

                <input
                  type="email"
                  value={
                    email
                  }
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Enter your email"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-slate-500"
                />

              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-sm">

                <p>
                  <strong>
                    Restaurant:
                  </strong>{" "}
                  {
                    restaurant.name
                  }
                </p>

                <p className="mt-1">
                  <strong>
                    Date:
                  </strong>{" "}
                  {
                    reservationDate
                  }
                </p>

                <p className="mt-1">
                  <strong>
                    Time:
                  </strong>{" "}
                  {time
                    ? formatTime(
                        time
                      )
                    : "-"}
                </p>

                <p className="mt-1">
                  <strong>
                    Guests:
                  </strong>{" "}
                  {
                    guests
                  }
                </p>

                <p className="mt-1">
                  <strong>
                    Table:
                  </strong>{" "}
                  {
                    selectedTable?.tableNumber
                  }
                </p>

              </div>

              {/* ================= WALLET REDEMPTION ================= */}

              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="font-bold text-emerald-900">
                      💰 Redeem Wallet Balance
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-800">
                      Use your available NIVSSA Wallet balance for this reservation.
                    </p>

                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                    ₹
                    {walletBalance.toFixed(
                      2
                    )}
                  </span>

                </div>

                {walletLoading ? (
                  <div className="mt-4 rounded-lg bg-white/80 p-3 text-sm text-slate-600">
                    Checking wallet balance...
                  </div>
                ) : walletBalance >
                  0 ? (
                  <>
                    <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4">

                      <input
                        type="checkbox"
                        checked={
                          useWallet
                        }
                        onChange={(
                          event
                        ) =>
                          setUseWallet(
                            event
                              .target
                              .checked
                          )
                        }
                        className="h-5 w-5 accent-emerald-600"
                      />

                      <div>
                        <p className="font-semibold text-slate-900">
                          Redeem available balance
                        </p>

                        <p className="text-xs text-slate-500">
                          ₹
                          {walletBalance.toFixed(
                            2
                          )}{" "}
                          will be used from your wallet.
                        </p>
                      </div>

                    </label>

                    {useWallet && (
                      <div className="mt-3 rounded-lg bg-white p-3">

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            Wallet Used
                          </span>

                          <span className="font-bold text-emerald-700">
                            -₹
                            {walletBalance.toFixed(
                              2
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          This amount will be returned to your wallet if you cancel at least 15 minutes before the reservation time. Late cancellation or no-show is not refundable.
                        </p>

                      </div>
                    )}

                  </>
                ) : (
                  <div className="mt-4 rounded-lg bg-white/80 p-3 text-sm text-slate-600">
                    No wallet balance available.
                  </div>
                )}

              </div>

              {bookingError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {
                    bookingError
                  }
                </div>
              )}

              <button
                onClick={
                  createReservation
                }
                disabled={
                  bookingLoading
                }
                className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bookingLoading
                  ? "Confirming Booking..."
                  : useWallet &&
                    walletBalance >
                      0
                  ? `Confirm Reservation • Redeem ₹${walletBalance.toFixed(
                      2
                    )}`
                  : "Confirm Reservation"}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =========================
          BOOKING SUCCESS
      ========================== */}

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Reservation Confirmed!
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your table has been successfully reserved.
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">

              <p className="text-xs text-slate-500">
                Booking ID
              </p>

              <p className="mt-1 text-xl font-bold tracking-wide">
                {
                  bookingId
                }
              </p>

            </div>

            {walletAmountUsed >
              0 && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">

                <p className="font-bold text-emerald-900">
                  💰 Wallet Redeemed
                </p>

                <p className="mt-1 text-sm text-emerald-800">
                  ₹
                  {walletAmountUsed.toFixed(
                    2
                  )}{" "}
                  has been redeemed from your NIVSSA Wallet.
                </p>

                <p className="mt-2 text-xs leading-5 text-emerald-700">
                  This wallet amount can be refunded only when the reservation is cancelled at least 15 minutes before the reservation time. Late cancellation and no-show are not refundable.
                </p>

              </div>
            )}

            <p className="mt-4 text-sm text-slate-600">
              A confirmation email has been sent to your email address.
            </p>

            <button
              onClick={
                closeSuccessPopup
              }
              className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Done
            </button>

          </div>
        </div>
      )}

      {/* WAITLIST SUCCESS */}

      {waitlistSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-3xl">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Added to Waitlist!
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              There is currently no suitable table available.
              Your waitlist request has been saved successfully.
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left">

              <p className="text-sm">
                <strong>
                  Restaurant:
                </strong>{" "}
                {
                  restaurant.name
                }
              </p>

              <p className="mt-2 text-sm">
                <strong>
                  Date:
                </strong>{" "}
                {
                  reservationDate
                }
              </p>

              <p className="mt-2 text-sm">
                <strong>
                  Time:
                </strong>{" "}
                {time
                  ? formatTime(
                      time
                    )
                  : "-"}
              </p>

              <p className="mt-2 text-sm">
                <strong>
                  Guests:
                </strong>{" "}
                {
                  guests
                }
              </p>

              {waitlistPosition !==
                null && (
                <p className="mt-2 text-sm">
                  <strong>
                    Waitlist Position:
                  </strong>{" "}
                  {
                    waitlistPosition
                  }
                </p>
              )}

            </div>

            <p className="mt-4 text-sm text-slate-600">
              Please wait for the restaurant staff to notify you when a table becomes available.
            </p>

            <button
              onClick={
                closeWaitlistPopup
              }
              className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Done
            </button>

          </div>
        </div>
      )}

      {/* COMING SOON POPUP */}

      {showComingSoon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-xl">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
              ✨
            </div>

            <h2 className="mt-4 text-xl font-bold">
              {
                comingSoonName
              }
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This section is being added to your
              NIVSSA Dine customer account.
            </p>

            <button
              onClick={() =>
                setShowComingSoon(
                  false
                )
              }
              className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Okay
            </button>

          </div>
        </div>
      )}

      {/* FOOTER */}

      <footer className="border-t bg-white">

        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-slate-500">
          NIVSSA Dine — Smart Restaurant Table Reservation & Waitlist Management
        </div>

      </footer>

    </main>
  );
}