"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

type Transaction = {
  _id: string;
  amount: number;
  type: "credit" | "debit";
  reason: string;
  description?: string;
  createdAt: string;
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWallet = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("nivssaToken") ||
        localStorage.getItem("token");

      if (!token) {
        window.location.href = "/auth";
        return;
      }

      const walletResponse = await fetch(
        `${API_URL}/wallet`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const walletData =
        await walletResponse.json();

      if (!walletResponse.ok) {
        throw new Error(
          walletData.message ||
            "Failed to load wallet"
        );
      }

      const transactionResponse =
        await fetch(
          `${API_URL}/wallet/transactions`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const transactionData =
        await transactionResponse.json();

      if (!transactionResponse.ok) {
        throw new Error(
          transactionData.message ||
            "Failed to load transactions"
        );
      }

      setBalance(
        Number(
          walletData.walletBalance || 0
        )
      );

      setTransactions(
        transactionData.transactions || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const formatDate = (
    value: string
  ) => {
    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "N/A";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffaf5] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">
            💰
          </div>

          <p className="text-gray-600 font-semibold">
            Loading Wallet...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] text-gray-900">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b px-5 md:px-12 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">

          <a
            href="/"
            className="text-2xl font-extrabold"
          >
            <span className="text-orange-600">
              NIVSSA
            </span>{" "}
            Dine 🍽️
          </a>

          <div className="flex gap-2">

            <a
              href="/refer-earn"
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50"
            >
              Refer & Earn
            </a>

            <a
              href="/profile"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              Profile
            </a>

          </div>
        </div>
      </nav>

      <section className="px-5 py-10 md:px-12">
        <div className="max-w-6xl mx-auto">

          {/* HEADER */}

          <div className="text-center">
            <p className="text-orange-600 font-bold text-sm">
              NIVSSA WALLET
            </p>

            <h1 className="text-4xl md:text-5xl font-black mt-2">
              Your Wallet 💰
            </h1>

            <p className="text-gray-600 mt-3">
              Use your wallet balance for NIVSSA Dine bookings.
            </p>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* BALANCE */}

          <div className="mt-10 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-8 md:p-10 text-white shadow-xl">

            <p className="text-slate-300">
              Available Balance
            </p>

            <p className="text-5xl md:text-6xl font-black mt-2">
              ₹{balance.toFixed(2)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">

              <a
                href="/"
                className="px-5 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100"
              >
                Book a Table
              </a>

              <a
                href="/refer-earn"
                className="px-5 py-3 rounded-xl border border-white/30 bg-white/10 font-bold hover:bg-white/20"
              >
                Earn More
              </a>

            </div>
          </div>

          {/* INFO CARDS */}

          <div className="grid md:grid-cols-3 gap-5 mt-7">

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="text-3xl">
                🎁
              </div>

              <h3 className="font-bold text-lg mt-3">
                Referral Rewards
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Referral earnings are added directly to your wallet.
              </p>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="text-3xl">
                🍽️
              </div>

              <h3 className="font-bold text-lg mt-3">
                Use for Booking
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Wallet balance can be used toward NIVSSA bookings.
              </p>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="text-3xl">
                🔒
              </div>

              <h3 className="font-bold text-lg mt-3">
                Safe & Simple
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Every wallet credit and debit is recorded in history.
              </p>
            </div>

          </div>

          {/* TRANSACTION HISTORY */}

          <div className="mt-8 bg-white rounded-3xl border shadow-sm overflow-hidden">

            <div className="p-7 border-b">
              <h2 className="text-2xl font-bold">
                Wallet History
              </h2>

              <p className="text-gray-500 mt-1">
                Your recent wallet transactions.
              </p>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">

                <div className="text-5xl">
                  💳
                </div>

                <h3 className="text-xl font-bold mt-4">
                  No transactions yet
                </h3>

                <p className="text-gray-500 mt-2">
                  Your referral rewards and booking wallet activity will appear here.
                </p>

              </div>
            ) : (
              <div className="divide-y">

                {transactions.map(
                  (transaction) => (
                    <div
                      key={
                        transaction._id
                      }
                      className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >

                      <div>
                        <h3 className="font-bold">
                          {
                            transaction.reason
                          }
                        </h3>

                        {transaction.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {
                              transaction.description
                            }
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          {
                            formatDate(
                              transaction.createdAt
                            )
                          }
                        </p>
                      </div>

                      <div className="text-right">

                        <p
                          className={`text-2xl font-black ${
                            transaction.type ===
                            "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type ===
                          "credit"
                            ? "+"
                            : "-"}
                          ₹
                          {
                            transaction.amount
                          }
                        </p>

                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            transaction.type ===
                            "credit"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {
                            transaction.type ===
                            "credit"
                              ? "Credit"
                              : "Debit"
                          }
                        </span>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>
      </section>

    </main>
  );
}