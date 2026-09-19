"use client";

import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

type Restaurant = {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
};

type Table = {
  _id: string;
  tableNumber: number;
  capacity: number;
  section?: string;
  seatingType?: string;
  status: string;
  turnTime?: number;
  restaurant?: Restaurant | string;
};

type Reservation = {
  _id: string;
  bookingId: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  restaurant?: Restaurant;
  table?: {
    _id?: string;
    tableNumber?: number;
    capacity?: number;
    section?: string;
    seatingType?: string;
    status?: string;
    turnTime?: number;
  };
  tables?: {
    _id?: string;
    tableNumber?: number;
    capacity?: number;
    section?: string;
    seatingType?: string;
    status?: string;
    turnTime?: number;
  }[];
  date: string;
  partySize: number;
  seatingPreference?: string;
  status: string;
  arrivalStatus?: string;
  gracePeriodMinutes?: number;
  notes?: string;
};

type WaitlistEntry = {
  _id: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  restaurant?: Restaurant;
  requestedDate?: string;
  partySize?: number;
  seatingPreference?: string;
  status?: string;
  position?: number;
  table?: {
    _id?: string;
    tableNumber?: number;
    capacity?: number;
    section?: string;
    seatingType?: string;
  };
};

export default function StaffPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] =
    useState<Reservation[]>([]);
  const [waitlist, setWaitlist] =
    useState<WaitlistEntry[]>([]);

  const [loadingTables, setLoadingTables] =
    useState(true);
  const [loadingReservations, setLoadingReservations] =
    useState(true);
  const [loadingWaitlist, setLoadingWaitlist] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [updatingGraceId, setUpdatingGraceId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [activeSection, setActiveSection] =
    useState<
      "tables" | "reservations" | "waitlist"
    >("tables");

  const [selectedReservationDate, setSelectedReservationDate] =
    useState<string>("all");

  const [reservationSearch, setReservationSearch] =
    useState<string>("");

  const [selectedWaitlistDate, setSelectedWaitlistDate] =
    useState<string>("all");

  useEffect(() => {
    checkStaffAccess();
  }, []);

  const checkStaffAccess = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const userString =
        localStorage.getItem("user");

      if (!token || !userString) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userString);

      if (
        user.role !== "staff" &&
        user.role !== "admin"
      ) {
        window.location.href = "/";
        return;
      }

      await Promise.all([
        loadTables(),
        loadReservations(),
        loadWaitlist(),
      ]);
    } catch (err) {
      console.error(
        "Staff access error:",
        err
      );

      setError(
        "Unable to load staff dashboard"
      );
    }
  };

  const loadTables = async () => {
    try {
      setLoadingTables(true);

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `${API_BASE}/tables`,
          {
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
          "Failed to load tables"
        );
      }

      setTables(
        Array.isArray(data.tables)
          ? data.tables
          : []
      );
    } catch (err: any) {
      console.error(
        "Load tables error:",
        err
      );

      setError(
        err.message ||
        "Failed to load tables"
      );
    } finally {
      setLoadingTables(false);
    }
  };

  const loadReservations = async () => {
    try {
      setLoadingReservations(true);

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `${API_BASE}/reservations/staff/all`,
          {
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
          "Failed to load reservations"
        );
      }

      setReservations(
        Array.isArray(
          data.reservations
        )
          ? data.reservations
          : []
      );
    } catch (err: any) {
      console.error(
        "Load reservations error:",
        err
      );

      setError(
        err.message ||
        "Failed to load reservations"
      );
    } finally {
      setLoadingReservations(false);
    }
  };

  const loadWaitlist = async () => {
    try {
      setLoadingWaitlist(true);

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `${API_BASE}/waitlist/staff/all`,
          {
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
          "Failed to load waitlist"
        );
      }

      setWaitlist(
        Array.isArray(data.waitlist)
          ? data.waitlist
          : []
      );
    } catch (err: any) {
      console.error(
        "Load waitlist error:",
        err
      );

      setError(
        err.message ||
        "Failed to load waitlist"
      );
    } finally {
      setLoadingWaitlist(false);
    }
  };

  const updateTableStatus = async (
    tableId: string,
    status: string
  ) => {
    try {
      setUpdatingId(tableId);
      setError("");

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `${API_BASE}/tables/${tableId}/status`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              status,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update table"
        );
      }

      await loadTables();
    } catch (err: any) {
      console.error(
        "Update table status error:",
        err
      );

      setError(
        err.message ||
        "Failed to update table status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateReservation = async (
    bookingId: string,
    action:
      | "arrive"
      | "no-show"
      | "complete"
  ) => {
    try {
      setUpdatingId(bookingId);
      setError("");

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `${API_BASE}/reservations/${bookingId}/${action}`,
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
          "Failed to update reservation"
        );
      }

      await Promise.all([
        loadReservations(),
        loadTables(),
      ]);
    } catch (err: any) {
      console.error(
        "Update reservation error:",
        err
      );

      setError(
        err.message ||
        "Failed to update reservation"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateGracePeriod = async (
    bookingId: string,
    gracePeriodMinutes: number
  ) => {
    try {
      setUpdatingGraceId(bookingId);
      setError("");

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `${API_BASE}/reservations/${bookingId}/grace-period`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              gracePeriodMinutes,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update grace period"
        );
      }

      await loadReservations();
    } catch (err: any) {
      console.error(
        "Update grace period error:",
        err
      );

      setError(
        err.message ||
        "Failed to update grace period"
      );
    } finally {
      setUpdatingGraceId(null);
    }
  };

  const notifyWaitlistCustomer = async (
    id: string
  ) => {
    try {
      setUpdatingId(id);
      setError("");

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `${API_BASE}/waitlist/${id}/notify`,
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
          "Failed to notify customer"
        );
      }

      await Promise.all([
        loadWaitlist(),
        loadReservations(),
        loadTables(),
      ]);
    } catch (err: any) {
      console.error(
        "Notify waitlist customer error:",
        err
      );

      setError(
        err.message ||
        "Failed to notify waitlist customer"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/auth";
  };

  const formatDateTime = (
    value?: string
  ) => {
    if (!value) {
      return "N/A";
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const formatTime = (
    value?: string
  ) => {
    if (!value) {
      return "N/A";
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatDateOnly = (
    value?: string
  ) => {
    if (!value) {
      return "N/A";
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  const getDateKey = (
    value?: string
  ) => {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getDate()
      ).padStart(2, "0"),
    ].join("-");
  };

  const getTableNumbers = (
    reservation: Reservation
  ) => {
    if (
      Array.isArray(
        reservation.tables
      ) &&
      reservation.tables.length > 0
    ) {
      return reservation.tables
        .map(
          (table) =>
            table?.tableNumber
        )
        .filter(
          (number) =>
            number !== undefined
        )
        .join(", ");
    }

    return reservation.table?.tableNumber
      ? String(
          reservation.table.tableNumber
        )
      : "N/A";
  };

  const getStatusClass = (
    status: string
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "available":
        return "bg-green-100 text-green-700";

      case "reserved":
        return "bg-blue-100 text-blue-700";

      case "occupied":
        return "bg-orange-100 text-orange-700";

      case "repair":
        return "bg-red-100 text-red-700";

      case "confirmed":
        return "bg-blue-100 text-blue-700";

      case "completed":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-gray-100 text-gray-700";

      case "no_show":
        return "bg-red-100 text-red-700";

      case "notified":
        return "bg-purple-100 text-purple-700";

      case "waiting":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getReservationStatusPriority = (
    status?: string
  ) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return 1;

      case "completed":
        return 2;

      case "cancelled":
        return 3;

      case "no_show":
        return 4;

      default:
        return 5;
    }
  };

  const availableTables =
    tables.filter(
      (table) =>
        table.status ===
        "available"
    ).length;

  const occupiedTables =
    tables.filter(
      (table) =>
        table.status ===
        "occupied"
    ).length;

  const reservedTables =
    tables.filter(
      (table) =>
        table.status ===
        "reserved"
    ).length;

  const pendingReservations =
    reservations.filter(
      (reservation) =>
        reservation.status ===
          "confirmed" &&
        reservation.arrivalStatus !==
          "arrived"
    ).length;

  const waitingCustomers =
    waitlist.filter(
      (entry) =>
        entry.status ===
        "waiting"
    ).length;

  const reservationDates =
    Array.from(
      new Set(
        reservations
          .map((reservation) =>
            getDateKey(
              reservation.date
            )
          )
          .filter(Boolean)
      )
    ).sort();

  const filteredReservations =
    reservations
      .filter((reservation) => {
        const reservationDate =
          getDateKey(
            reservation.date
          );

        if (
          selectedReservationDate !==
            "all" &&
          reservationDate !==
            selectedReservationDate
        ) {
          return false;
        }

        const search =
          reservationSearch
            .trim()
            .toLowerCase();

        if (!search) {
          return true;
        }

        const customerName =
          reservation.user?.name || "";

        const customerEmail =
          reservation.user?.email || "";

        const customerPhone =
          reservation.user?.phone || "";

        const bookingId =
          reservation.bookingId || "";

        const restaurantName =
          reservation.restaurant
            ?.name || "";

        return (
          customerName
            .toLowerCase()
            .includes(search) ||
          customerEmail
            .toLowerCase()
            .includes(search) ||
          customerPhone
            .toLowerCase()
            .includes(search) ||
          bookingId
            .toLowerCase()
            .includes(search) ||
          restaurantName
            .toLowerCase()
            .includes(search)
        );
      })
      .sort((a, b) => {
        const statusA =
          getReservationStatusPriority(
            a.status
          );

        const statusB =
          getReservationStatusPriority(
            b.status
          );

        if (statusA !== statusB) {
          return statusA - statusB;
        }

        const timeA =
          new Date(
            a.date
          ).getTime();

        const timeB =
          new Date(
            b.date
          ).getTime();

        if (timeA !== timeB) {
          return timeA - timeB;
        }

        const nameA =
          a.user?.name
            ?.trim()
            .toLowerCase() || "";

        const nameB =
          b.user?.name
            ?.trim()
            .toLowerCase() || "";

        return nameA.localeCompare(
          nameB
        );
      });

  const waitlistDates =
    Array.from(
      new Set(
        waitlist
          .filter(
            (entry) =>
              entry.requestedDate
          )
          .map(
            (entry) =>
              getDateKey(
                entry.requestedDate
              )
          )
          .filter(Boolean)
      )
    ).sort();

  const filteredWaitlist =
    waitlist
      .filter((entry) => {
        if (
          selectedWaitlistDate ===
          "all"
        ) {
          return true;
        }

        return (
          getDateKey(
            entry.requestedDate
          ) ===
          selectedWaitlistDate
        );
      })
      .sort((a, b) => {
        const dateA =
          new Date(
            a.requestedDate || 0
          ).getTime();

        const dateB =
          new Date(
            b.requestedDate || 0
          ).getTime();

        if (dateA !== dateB) {
          return dateA - dateB;
        }

        return (
          (a.position || 0) -
          (b.position || 0)
        );
      });

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                NIVSSA Dine
              </h1>

              <p className="text-sm text-slate-300">
                Staff Dashboard
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}

            <button
              onClick={() =>
                setError("")
              }
              className="ml-3 font-bold"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Tables
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {tables.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Available
            </p>

            <p className="mt-1 text-3xl font-bold text-green-600">
              {availableTables}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Reserved
            </p>

            <p className="mt-1 text-3xl font-bold text-blue-600">
              {reservedTables}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Occupied
            </p>

            <p className="mt-1 text-3xl font-bold text-orange-600">
              {occupiedTables}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Waitlist
            </p>

            <p className="mt-1 text-3xl font-bold text-purple-600">
              {waitingCustomers}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() =>
              setActiveSection(
                "tables"
              )
            }
            className={`rounded-lg px-5 py-3 text-sm font-semibold ${
              activeSection ===
              "tables"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 shadow-sm"
            }`}
          >
            Floor Plan & Tables
          </button>

          <button
            onClick={() =>
              setActiveSection(
                "reservations"
              )
            }
            className={`rounded-lg px-5 py-3 text-sm font-semibold ${
              activeSection ===
              "reservations"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 shadow-sm"
            }`}
          >
            Reservations

            {pendingReservations >
              0 && (
              <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                {pendingReservations}
              </span>
            )}
          </button>

          <button
            onClick={() =>
              setActiveSection(
                "waitlist"
              )
            }
            className={`rounded-lg px-5 py-3 text-sm font-semibold ${
              activeSection ===
              "waitlist"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 shadow-sm"
            }`}
          >
            Waitlist

            {waitingCustomers >
              0 && (
              <span className="ml-2 rounded-full bg-purple-500 px-2 py-0.5 text-xs text-white">
                {waitingCustomers}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              window.location.href =
                "/staff/coupons";
            }}
            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-orange-50 hover:text-orange-600"
          >
            🎁 Coupons
          </button>
        </div>

        {activeSection ===
          "tables" && (
          <section className="mt-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Live Floor Plan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage table availability and occupancy.
              </p>
            </div>

            {loadingTables ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                Loading tables...
              </div>
            ) : tables.length ===
              0 ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                No tables found.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tables.map(
                  (table) => (
                    <div
                      key={
                        table._id
                      }
                      className="rounded-xl bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            Table{" "}
                            {
                              table.tableNumber
                            }
                          </h3>

                          <p className="text-sm text-slate-500">
                            Capacity:{" "}
                            {
                              table.capacity
                            }
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            table.status
                          )}`}
                        >
                          {
                            table.status
                          }
                        </span>
                      </div>

                      <div className="mt-4 space-y-1 text-sm text-slate-600">
                        <p>
                          Section:{" "}
                          {
                            table.section ||
                            "N/A"
                          }
                        </p>

                        <p>
                          Type:{" "}
                          {
                            table.seatingType ||
                            "N/A"
                          }
                        </p>

                        <p>
                          Turn Time:{" "}
                          {
                            table.turnTime ||
                            60
                          }{" "}
                          min
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          disabled={
                            updatingId ===
                            table._id
                          }
                          onClick={() =>
                            updateTableStatus(
                              table._id,
                              "available"
                            )
                          }
                          className="rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:opacity-50"
                        >
                          Available
                        </button>

                        <button
                          disabled={
                            updatingId ===
                            table._id
                          }
                          onClick={() =>
                            updateTableStatus(
                              table._id,
                              "occupied"
                            )
                          }
                          className="rounded-lg bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-200 disabled:opacity-50"
                        >
                          Occupied
                        </button>

                        <button
                          disabled={
                            updatingId ===
                            table._id
                          }
                          onClick={() =>
                            updateTableStatus(
                              table._id,
                              "maintenance"
                            )
                          }
                          className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          Repair
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {activeSection ===
          "reservations" && (
          <section className="mt-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Reservations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search bookings by date, time, customer or booking ID.
              </p>
            </div>

            {!loadingReservations &&
              reservations.length > 0 && (
              <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Search Booking
                    </label>

                    <input
                      type="text"
                      value={
                        reservationSearch
                      }
                      onChange={(
                        event
                      ) =>
                        setReservationSearch(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search name, email, phone, booking ID..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Search by Date
                    </label>

                    <select
                      value={
                        selectedReservationDate
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedReservationDate(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="all">
                        All Dates
                      </option>

                      {reservationDates.map(
                        (
                          dateKey
                        ) => {
                          const reservation =
                            reservations.find(
                              (
                                item
                              ) =>
                                getDateKey(
                                  item.date
                                ) ===
                                dateKey
                            );

                          return (
                            <option
                              key={
                                dateKey
                              }
                              value={
                                dateKey
                              }
                            >
                              {formatDateOnly(
                                reservation?.date
                              )}
                            </option>
                          );
                        }
                      )}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-900">
                      {
                        filteredReservations.length
                      }
                    </span>{" "}
                    booking
                    {filteredReservations.length !==
                    1
                      ? "s"
                      : ""}
                  </p>

                  {(reservationSearch ||
                    selectedReservationDate !==
                      "all") && (
                    <button
                      onClick={() => {
                        setReservationSearch(
                          ""
                        );

                        setSelectedReservationDate(
                          "all"
                        );
                      }}
                      className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            )}

            {loadingReservations ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                Loading reservations...
              </div>
            ) : filteredReservations.length ===
              0 ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                No reservations found for this date/search.
              </div>
            ) : (
              <div className="space-y-5">
                {filteredReservations.map(
                  (
                    reservation
                  ) => (
                    <div
                      key={
                        reservation._id
                      }
                      className="rounded-xl bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">
                              {
                                reservation.bookingId
                              }
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                reservation.status
                              )}`}
                            >
                              {
                                reservation.status
                              }
                            </span>

                            {reservation.arrivalStatus && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                Arrival:{" "}
                                {
                                  reservation.arrivalStatus
                                }
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {
                              reservation
                                .restaurant
                                ?.name ||
                              "Restaurant"
                            }
                          </p>
                        </div>

                        <div className="text-sm text-slate-500">
                          {formatDateTime(
                            reservation.date
                          )}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Customer
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {
                              reservation
                                .user
                                ?.name ||
                              "N/A"
                            }
                          </p>

                          <p className="mt-1 break-all text-sm text-slate-500">
                            {
                              reservation
                                .user
                                ?.email ||
                              "N/A"
                            }
                          </p>

                          {reservation
                            .user
                            ?.phone && (
                            <p className="mt-1 text-sm text-slate-500">
                              {
                                reservation
                                  .user
                                  .phone
                              }
                            </p>
                          )}
                        </div>

                        <div className="rounded-lg bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Booking
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            Date:{" "}
                            {reservation.date
                              ? new Date(
                                  reservation.date
                                ).toLocaleDateString(
                                  "en-IN"
                                )
                              : "N/A"}
                          </p>

                          <p className="text-sm text-slate-700">
                            Time:{" "}
                            {formatTime(
                              reservation.date
                            )}
                          </p>

                          <p className="text-sm text-slate-700">
                            Guests:{" "}
                            {
                              reservation.partySize
                            }
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Table
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            Table{" "}
                            {
                              getTableNumbers(
                                reservation
                              )
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Seating:{" "}
                            {
                              reservation.seatingPreference ||
                              "Any"
                            }
                          </p>
                        </div>

                        <div className="rounded-lg bg-blue-50 p-4">
                          <p className="text-xs font-semibold uppercase text-blue-500">
                            Grace Period
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            Current:{" "}
                            {
                              reservation.gracePeriodMinutes ||
                              15
                            }{" "}
                            min
                          </p>

                          {reservation.status ===
                            "confirmed" && (
                            <div className="mt-3">
                              <select
                                value={
                                  reservation.gracePeriodMinutes ||
                                  15
                                }
                                disabled={
                                  updatingGraceId ===
                                  reservation.bookingId
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateGracePeriod(
                                    reservation.bookingId,
                                    Number(
                                      event
                                        .target
                                        .value
                                    )
                                  )
                                }
                                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                              >
                                <option value="10">
                                  10 minutes
                                </option>

                                <option value="15">
                                  15 minutes
                                </option>

                                <option value="20">
                                  20 minutes
                                </option>

                                <option value="30">
                                  30 minutes
                                </option>
                              </select>

                              {updatingGraceId ===
                                reservation.bookingId && (
                                <p className="mt-2 text-xs text-blue-600">
                                  Updating...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {reservation.status ===
                        "confirmed" && (
                        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                          {reservation.arrivalStatus !==
                            "arrived" && (
                            <button
                              disabled={
                                updatingId ===
                                reservation.bookingId
                              }
                              onClick={() =>
                                updateReservation(
                                  reservation.bookingId,
                                  "arrive"
                                )
                              }
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Mark Arrived
                            </button>
                          )}

                          {reservation.arrivalStatus !==
                            "no_show" && (
                            <button
                              disabled={
                                updatingId ===
                                reservation.bookingId
                              }
                              onClick={() =>
                                updateReservation(
                                  reservation.bookingId,
                                  "no-show"
                                )
                              }
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Mark No-Show
                            </button>
                          )}

                          <button
                            disabled={
                              updatingId ===
                              reservation.bookingId
                            }
                            onClick={() =>
                              updateReservation(
                                reservation.bookingId,
                                "complete"
                              )
                            }
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            Complete Reservation
                          </button>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {activeSection ===
          "waitlist" && (
          <section className="mt-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Waitlist
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage customers waiting for available tables.
              </p>
            </div>

            {!loadingWaitlist &&
              waitlist.length > 0 && (
              <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Search Waitlist by Date
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Select a date to view only that day's waiting customers.
                    </p>
                  </div>

                  <select
                    value={
                      selectedWaitlistDate
                    }
                    onChange={(event) =>
                      setSelectedWaitlistDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 md:w-72"
                  >
                    <option value="all">
                      All Dates
                    </option>

                    {waitlistDates.map(
                      (dateKey) => {
                        const entry =
                          waitlist.find(
                            (item) =>
                              getDateKey(
                                item.requestedDate
                              ) ===
                              dateKey
                          );

                        return (
                          <option
                            key={
                              dateKey
                            }
                            value={
                              dateKey
                            }
                          >
                            {formatDateOnly(
                              entry?.requestedDate
                            )}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>
              </div>
            )}

            {loadingWaitlist ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                Loading waitlist...
              </div>
            ) : filteredWaitlist.length ===
              0 ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                No waitlist entries found for this date.
              </div>
            ) : (
              <div className="space-y-5">
                {filteredWaitlist.map(
                  (entry) => (
                    <div
                      key={
                        entry._id
                      }
                      className="rounded-xl bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
                              Queue #
                              {
                                entry.position ??
                                "N/A"
                              }
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                entry.status ||
                                  "waiting"
                              )}`}
                            >
                              {
                                entry.status ||
                                "waiting"
                              }
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-bold text-slate-900">
                            {
                              entry.user
                                ?.name ||
                              "Customer"
                            }
                          </h3>

                          <p className="text-sm text-slate-500">
                            {
                              entry.user
                                ?.email ||
                              "N/A"
                            }
                          </p>

                          {entry.user
                            ?.phone && (
                            <p className="mt-1 text-sm text-slate-500">
                              {
                                entry.user
                                  .phone
                              }
                            </p>
                          )}
                        </div>

                        <div className="text-left lg:text-right">
                          <p className="font-semibold text-slate-900">
                            {
                              entry.restaurant
                                ?.name ||
                              "Restaurant"
                            }
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDateOnly(
                              entry.requestedDate
                            )}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatTime(
                              entry.requestedDate
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Party Size
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {
                              entry.partySize ??
                              "N/A"
                            }{" "}
                            guests
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Seating
                          </p>

                          <p className="mt-1 font-semibold capitalize text-slate-900">
                            {
                              entry.seatingPreference ||
                              "Any"
                            }
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Assigned Table
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {entry.table
                              ?.tableNumber
                              ? `Table ${entry.table.tableNumber}`
                              : "Not assigned"}
                          </p>
                        </div>
                      </div>

                      {entry.status ===
                        "waiting" && (
                        <div className="mt-5 border-t border-slate-100 pt-5">
                          <button
                            disabled={
                              updatingId ===
                              entry._id
                            }
                            onClick={() =>
                              notifyWaitlistCustomer(
                                entry._id
                              )
                            }
                            className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                          >
                            {updatingId ===
                            entry._id
                              ? "Notifying..."
                              : "Notify Customer"}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}