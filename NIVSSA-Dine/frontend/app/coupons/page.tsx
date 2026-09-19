"use client";

import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

type CouponClaim = {
  _id: string;
  code: string;
  amount: number;
  createdAt: string;
  coupon?: {
    code?: string;
    amount?: number;
  };
};

export default function CouponsPage() {
  const [code, setCode] = useState("");
  const [claims, setClaims] = useState<CouponClaim[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkCustomer();
  }, []);

  const checkCustomer = () => {
    const token =
      localStorage.getItem("nivssaToken");

    const userString =
      localStorage.getItem("nivssaUser");

    if (!token || !userString) {
      window.location.href = "/auth";
      return;
    }

    try {
      const user = JSON.parse(userString);

      if (
        user.role &&
        user.role !== "customer"
      ) {
        window.location.href = "/staff";
        return;
      }

      loadData();
    } catch (err) {
      console.error("Customer access error:", err);
      window.location.href = "/auth";
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("nivssaToken");

      const [walletResponse, claimsResponse] =
        await Promise.all([
          fetch(`${API_BASE}/wallet`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_BASE}/coupons/my-claims`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      const walletData =
        await walletResponse.json();

      const claimsData =
        await claimsResponse.json();

      if (!walletResponse.ok) {
        throw new Error(
          walletData.message ||
            "Failed to load wallet"
        );
      }

      if (!claimsResponse.ok) {
        throw new Error(
          claimsData.message ||
            "Failed to load coupon history"
        );
      }

      setWalletBalance(
        Number(walletData.walletBalance) || 0
      );

      setClaims(
        Array.isArray(claimsData.claims)
          ? claimsData.claims
          : Array.isArray(claimsData)
          ? claimsData
          : []
      );
    } catch (err: any) {
      console.error("Load coupon data error:", err);

      setError(
        err.message ||
          "Unable to load coupon information"
      );
    } finally {
      setLoading(false);
    }
  };

  const claimCoupon = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const cleanCode =
      code.trim().toUpperCase();

    if (!cleanCode) {
      setError(
        "Coupon code enter karo."
      );
      return;
    }

    try {
      setClaiming(true);

      const token =
        localStorage.getItem("nivssaToken");

      const response = await fetch(
        `${API_BASE}/coupons/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: cleanCode,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to claim coupon"
        );
      }

      setMessage(
        data.message ||
          `₹${data.amount || 0} added to your wallet ✅`
      );

      setCode("");

      await loadData();
    } catch (err: any) {
      console.error("Claim coupon error:", err);

      setError(
        err.message ||
          "Unable to claim coupon"
      );
    } finally {
      setClaiming(false);
    }
  };

  const formatDate = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                🎁 Coupons
              </h1>

              <p className="mt-1 text-sm text-slate-300">
                Claim coupons and get wallet credit.
              </p>
            </div>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-200"
            >
              ← Home
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* WALLET */}
        <section className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-orange-100">
            Your Wallet Balance
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            ₹{walletBalance}
          </h2>

          <p className="mt-2 text-sm text-orange-100">
            Wallet balance can be used for NIVSSA Dine
            booking payments.
          </p>
        </section>

        {/* CLAIM */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Claim a Coupon
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter a valid coupon code to add money
              directly to your wallet.
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={claimCoupon}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="Enter coupon code"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium uppercase outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            <button
              type="submit"
              disabled={claiming}
              className="rounded-xl bg-orange-600 px-7 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {claiming
                ? "Claiming..."
                : "Claim Coupon 🎁"}
            </button>
          </form>
        </section>

        {/* HISTORY */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Coupon History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Coupons you have already claimed.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              Loading...
            </div>
          ) : claims.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <div className="text-4xl">
                🎁
              </div>

              <p className="mt-3 font-semibold text-slate-700">
                No coupons claimed yet.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Enter a coupon code above to get wallet
                credit.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div
                  key={claim._id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="inline-block rounded-lg bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                        {claim.code ||
                          claim.coupon?.code ||
                          "COUPON"}
                      </span>

                      <p className="mt-2 text-sm text-slate-500">
                        Claimed on{" "}
                        {formatDate(
                          claim.createdAt
                        )}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-bold text-green-600">
                        +₹
                        {claim.amount ||
                          claim.coupon?.amount ||
                          0}
                      </p>

                      <p className="text-xs font-medium text-slate-400">
                        Wallet Credit
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* BACK */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => {
              window.location.href = "/wallet";
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            💰 View Wallet
          </button>

          <button
            onClick={() => {
              window.location.href = "/my-bookings";
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            📅 My Bookings
          </button>
        </div>
      </main>
    </div>
  );
}