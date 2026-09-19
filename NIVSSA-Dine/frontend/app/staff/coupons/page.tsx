"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

const API_BASE = API_BASE_URL;

type Coupon = {
  _id: string;
  code: string;
  amount: number;
  maxClaims: number;
  claimedCount: number;
  audience: "new_users" | "all_users" | "existing_users";
  newUserDays?: number;
  startDate?: string;
  expiryDate?: string;
  active: boolean;
};

export default function StaffCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [maxClaims, setMaxClaims] = useState("");
  const [audience, setAudience] = useState<
    "new_users" | "all_users" | "existing_users"
  >("new_users");
  const [newUserDays, setNewUserDays] = useState("30");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkStaffAccess();
  }, []);

  const checkStaffAccess = () => {
    try {
      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");

      if (!token || !userString) {
        window.location.href = "/auth";
        return;
      }

      const user = JSON.parse(userString);

      if (user.role !== "staff" && user.role !== "admin") {
        window.location.href = "/";
        return;
      }

      loadCoupons();
    } catch (err) {
      console.error("Staff coupon access error:", err);
      window.location.href = "/auth";
    }
  };

  const loadCoupons = async () => {
    try {
      setLoadingCoupons(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/coupons/staff/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load coupons"
        );
      }

      setCoupons(
        Array.isArray(data.coupons)
          ? data.coupons
          : Array.isArray(data)
          ? data
          : []
      );
    } catch (err: any) {
      console.error("Load coupons error:", err);
      setError(
        err.message || "Failed to load coupons"
      );
    } finally {
      setLoadingCoupons(false);
    }
  };

  const createCoupon = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const cleanCode = code.trim().toUpperCase();
    const parsedAmount = Number(amount);
    const parsedMaxClaims = Number(maxClaims);
    const parsedNewUserDays = Number(newUserDays);

    if (!cleanCode) {
      setError("Coupon code enter karo.");
      return;
    }

    if (parsedAmount <= 0) {
      setError("Amount 0 se greater hona chahiye.");
      return;
    }

    if (parsedMaxClaims <= 0) {
      setError("Maximum claims 0 se greater hona chahiye.");
      return;
    }

    if (audience === "new_users" && parsedNewUserDays <= 0) {
      setError(
        "New user period 0 se greater hona chahiye."
      );
      return;
    }

    if (startDate && expiryDate) {
      const start = new Date(startDate);
      const expiry = new Date(expiryDate);

      if (expiry <= start) {
        setError(
          "Expiry date start date ke baad honi chahiye."
        );
        return;
      }
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/coupons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: cleanCode,
            amount: parsedAmount,
            maxClaims: parsedMaxClaims,
            audience,
            newUserDays:
              audience === "new_users"
                ? parsedNewUserDays
                : 0,
            startDate: startDate
              ? new Date(startDate).toISOString()
              : null,
            expiryDate: expiryDate
              ? new Date(expiryDate).toISOString()
              : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create coupon"
        );
      }

      setMessage(
        data.message ||
          "Coupon created successfully ✅"
      );

      setCode("");
      setAmount("");
      setMaxClaims("");
      setAudience("new_users");
      setNewUserDays("30");
      setStartDate("");
      setExpiryDate("");

      await loadCoupons();
    } catch (err: any) {
      console.error("Create coupon error:", err);

      setError(
        err.message || "Failed to create coupon"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCoupon = async (
    coupon: Coupon
  ) => {
    try {
      setTogglingId(coupon._id);
      setMessage("");
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/coupons/staff/${coupon._id}/toggle`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update coupon"
        );
      }

      setMessage(
        data.message ||
          "Coupon status updated successfully ✅"
      );

      await loadCoupons();
    } catch (err: any) {
      console.error("Toggle coupon error:", err);

      setError(
        err.message || "Failed to update coupon"
      );
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (
    value?: string
  ) => {
    if (!value) {
      return "No limit";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAudienceLabel = (
    value: Coupon["audience"]
  ) => {
    switch (value) {
      case "new_users":
        return "New Users";

      case "all_users":
        return "All Users";

      case "existing_users":
        return "Existing Users";

      default:
        return value;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                🎁 Coupon Management
              </h1>

              <p className="mt-1 text-sm text-slate-300">
                Create and manage NIVSSA Dine wallet coupons.
              </p>
            </div>

            <button
              onClick={() => {
                window.location.href = "/staff";
              }}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-200"
            >
              ← Staff Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ALERTS */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* CREATE COUPON */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Create New Coupon
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Coupon claim hone par amount customer wallet me
              directly add hoga.
            </p>
          </div>

          <form
            onSubmit={createCoupon}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* CODE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Coupon Code
              </label>

              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase())
                }
                placeholder="WELCOME500"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* AMOUNT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Wallet Amount ₹
              </label>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="500"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* MAX CLAIMS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Maximum Claims
              </label>

              <input
                type="number"
                min="1"
                value={maxClaims}
                onChange={(e) =>
                  setMaxClaims(e.target.value)
                }
                placeholder="100"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* AUDIENCE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Audience
              </label>

              <select
                value={audience}
                onChange={(e) =>
                  setAudience(
                    e.target.value as Coupon["audience"]
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="new_users">
                  New Users
                </option>

                <option value="all_users">
                  All Users
                </option>

                <option value="existing_users">
                  Existing Users
                </option>
              </select>
            </div>

            {/* NEW USER DAYS */}
            {audience === "new_users" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  New User Period (Days)
                </label>

                <input
                  type="number"
                  min="1"
                  value={newUserDays}
                  onChange={(e) =>
                    setNewUserDays(e.target.value)
                  }
                  placeholder="30"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Example: 30 = account created within last 30
                  days.
                </p>
              </div>
            )}

            {/* START DATE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Valid From
              </label>

              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              <p className="mt-1 text-xs text-slate-400">
                Empty = valid immediately.
              </p>
            </div>

            {/* EXPIRY DATE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Expiry Date
              </label>

              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) =>
                  setExpiryDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              <p className="mt-1 text-xs text-slate-400">
                Empty = no expiry.
              </p>
            </div>

            {/* SUBMIT */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-600 px-5 py-3.5 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating Coupon..."
                  : "Create Coupon 🎁"}
              </button>
            </div>
          </form>
        </section>

        {/* COUPON LIST */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Existing Coupons
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage existing coupon status and claim limits.
            </p>
          </div>

          {loadingCoupons ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="font-medium text-slate-600">
                Loading coupons...
              </p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-700">
                No coupons found.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Create your first coupon above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {coupons.map((coupon) => {
                const claimCount =
                  Number(coupon.claimedCount) || 0;

                const maxClaimCount =
                  Number(coupon.maxClaims) || 0;

                const claimPercentage =
                  maxClaimCount > 0
                    ? Math.min(
                        100,
                        (claimCount /
                          maxClaimCount) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={coupon._id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    {/* TOP */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                            {coupon.code}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              coupon.active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {coupon.active
                              ? "Active"
                              : "Disabled"}
                          </span>
                        </div>

                        <p className="mt-3 text-2xl font-bold text-slate-900">
                          ₹{coupon.amount}
                        </p>

                        <p className="text-sm text-slate-500">
                          Wallet credit
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          toggleCoupon(coupon)
                        }
                        disabled={
                          togglingId === coupon._id
                        }
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                          coupon.active
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {togglingId === coupon._id
                          ? "Updating..."
                          : coupon.active
                          ? "Disable"
                          : "Enable"}
                      </button>
                    </div>

                    {/* DETAILS */}
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Audience
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {getAudienceLabel(
                            coupon.audience
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Claims
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {claimCount} /{" "}
                          {maxClaimCount}
                        </p>
                      </div>

                      {coupon.audience ===
                        "new_users" && (
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            New User Period
                          </p>

                          <p className="mt-1 font-semibold text-slate-800">
                            {coupon.newUserDays || 0} days
                          </p>
                        </div>
                      )}

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Start
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(
                            coupon.startDate
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Expiry
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(
                            coupon.expiryDate
                          )}
                        </p>
                      </div>
                    </div>

                    {/* CLAIM PROGRESS */}
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>
                          Claim Usage
                        </span>

                        <span>
                          {Math.round(
                            claimPercentage
                          )}
                          %
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-orange-500 transition-all"
                          style={{
                            width: `${claimPercentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
