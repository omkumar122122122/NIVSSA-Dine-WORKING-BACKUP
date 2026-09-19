"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

type Referral = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  reward: number;
  status: string;
};

type Transaction = {
  _id: string;
  amount: number;
  type: "credit" | "debit";
  reason: string;
  description: string;
  createdAt: string;
};

type Referrer = {
  name: string;
  email: string;
  referralCode: string;
};

type ReferralData = {
  referralCode: string | null;
  walletBalance: number;
  totalReferrals: number;
  totalEarned: number;
  referredBy: Referrer | null;
  welcomeBonus: number;
  referrals: Referral[];
  transactions: Transaction[];
};

export default function ReferEarnPage() {
  const [data, setData] =
    useState<ReferralData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "nivssaToken"
        ) ||
        localStorage.getItem("token");

      if (!token) {
        window.location.href =
          "/auth";
        return;
      }

      const response =
        await fetch(
          `${API_URL}/referral`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load referral details"
        );
      }

      setData(result);
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
    loadReferralData();
  }, []);

  const copyCode = async () => {
    if (!data?.referralCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        data.referralCode
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert(
        `Your referral code is ${data.referralCode}`
      );
    }
  };

  const shareReferral = async () => {
    if (!data?.referralCode) {
      return;
    }

    const text =
      `Join NIVSSA Dine 🍽️\n` +
      `Use my referral code ${data.referralCode} ` +
      `and get ₹20 wallet bonus!`;

    if (
      navigator.share
    ) {
      try {
        await navigator.share({
          title:
            "NIVSSA Dine - Refer & Earn",
          text,
        });
      } catch {
        // User closed share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          text
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {
        alert(text);
      }
    }
  };

  const formatDate = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "N/A";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffaf5] flex items-center justify-center">
        <div className="text-center">

          <div className="text-5xl mb-4">
            🎁
          </div>

          <p className="text-gray-600 font-medium">
            Loading Refer & Earn...
          </p>

        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#fffaf5] flex items-center justify-center px-5">

        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">

          <div className="text-5xl">
            ⚠️
          </div>

          <h2 className="text-2xl font-bold mt-4">
            Something went wrong
          </h2>

          <p className="text-gray-600 mt-2">
            {error}
          </p>

          <button
            onClick={
              loadReferralData
            }
            className="mt-6 px-6 py-3 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700"
          >
            Try Again
          </button>

        </div>

      </main>
    );
  }

  if (!data) {
    return null;
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

          <div className="flex items-center gap-2">

            <a
              href="/wallet"
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50"
            >
              Wallet
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

      {/* CONTENT */}

      <section className="px-5 py-10 md:px-12">

        <div className="max-w-6xl mx-auto">

          {/* HEADER */}

          <div className="text-center">

            <p className="text-orange-600 font-bold text-sm">
              REFER & EARN
            </p>

            <h1 className="text-4xl md:text-5xl font-extrabold mt-2">
              Invite Friends. Earn ₹50. 🎉
            </h1>

            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              Your friend gets ₹20 wallet bonus,
              and you earn ₹50 when their
              account is verified.
            </p>

          </div>

          {/* REFERRAL CODE */}

          <div className="mt-10 bg-gradient-to-r from-orange-600 to-pink-600 rounded-3xl p-7 md:p-10 text-white shadow-xl">

            <div className="grid md:grid-cols-2 gap-8 items-center">

              <div>

                <p className="text-orange-100 font-medium">
                  YOUR REFERRAL CODE
                </p>

                <div className="mt-3 text-4xl md:text-5xl font-black tracking-[0.15em]">
                  {data.referralCode ||
                    "N/A"}
                </div>

                <p className="text-orange-100 mt-3">
                  Share this code with your friends.
                </p>

                <div className="flex flex-wrap gap-3 mt-6">

                  <button
                    onClick={
                      copyCode
                    }
                    className="px-5 py-3 rounded-xl bg-white text-orange-600 font-bold hover:bg-orange-50"
                  >
                    {copied
                      ? "Copied ✓"
                      : "Copy Code"}
                  </button>

                  <button
                    onClick={
                      shareReferral
                    }
                    className="px-5 py-3 rounded-xl bg-black/20 border border-white/30 font-bold hover:bg-black/30"
                  >
                    Share ↗
                  </button>

                </div>

              </div>

              <div className="bg-white/15 rounded-2xl p-6 backdrop-blur-sm">

                <p className="text-orange-100">
                  Your Wallet
                </p>

                <p className="text-4xl font-black mt-2">
                  ₹
                  {data.walletBalance.toFixed(
                    2
                  )}
                </p>

                <p className="text-orange-100 text-sm mt-2">
                  Use your wallet balance on NIVSSA Dine bookings.
                </p>

              </div>

            </div>

          </div>

          {/* STATS */}

          <div className="grid md:grid-cols-3 gap-5 mt-7">

            <div className="bg-white rounded-2xl border p-6 shadow-sm">

              <p className="text-gray-500 text-sm">
                Friends Referred
              </p>

              <p className="text-3xl font-black mt-2">
                {
                  data.totalReferrals
                }
              </p>

            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">

              <p className="text-gray-500 text-sm">
                Referral Earnings
              </p>

              <p className="text-3xl font-black text-green-600 mt-2">
                ₹
                {
                  data.totalEarned
                }
              </p>

            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">

              <p className="text-gray-500 text-sm">
                New Customer Bonus
              </p>

              <p className="text-3xl font-black text-pink-600 mt-2">
                ₹
                {
                  data.welcomeBonus
                }
              </p>

            </div>

          </div>

          {/* WHO REFERRED ME */}

          {data.referredBy && (

            <div className="mt-7 bg-purple-50 border border-purple-200 rounded-3xl p-7">

              <p className="text-purple-600 font-bold text-sm">
                YOU WERE REFERRED BY
              </p>

              <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <h2 className="text-2xl font-bold">
                    {
                      data.referredBy.name
                    }
                  </h2>

                  <p className="text-gray-600 mt-1">
                    {
                      data.referredBy.email
                    }
                  </p>

                  <p className="text-sm text-purple-600 mt-2 font-semibold">
                    Code:{" "}
                    {
                      data.referredBy
                        .referralCode
                    }
                  </p>

                </div>

                <div className="text-left md:text-right">

                  <p className="text-gray-500 text-sm">
                    Welcome Bonus
                  </p>

                  <p className="text-3xl font-black text-green-600">
                    +₹20
                  </p>

                </div>

              </div>

            </div>

          )}

          {/* MY REFERRALS */}

          <div className="mt-8 bg-white rounded-3xl border shadow-sm overflow-hidden">

            <div className="p-7 border-b">

              <h2 className="text-2xl font-bold">
                My Referral History
              </h2>

              <p className="text-gray-500 mt-1">
                See who joined using your code and what you earned.
              </p>

            </div>

            {data.referrals.length ===
            0 ? (
              <div className="p-10 text-center">

                <div className="text-5xl">
                  👥
                </div>

                <h3 className="text-xl font-bold mt-4">
                  No referrals yet
                </h3>

                <p className="text-gray-500 mt-2">
                  Share your referral code and start earning ₹50.
                </p>

              </div>
            ) : (

              <div className="divide-y">

                {data.referrals.map(
                  (referral) => (

                    <div
                      key={
                        referral.id
                      }
                      className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >

                      <div>

                        <h3 className="font-bold text-lg">
                          {
                            referral.name
                          }
                        </h3>

                        <p className="text-sm text-gray-500">
                          {
                            referral.email
                          }
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          Joined{" "}
                          {formatDate(
                            referral.joinedAt
                          )}
                        </p>

                      </div>

                      <div className="flex items-center gap-4">

                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          {referral.status ===
                          "completed"
                            ? "Completed"
                            : "Pending"}
                        </span>

                        <span className="text-xl font-black text-green-600">
                          +₹50
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          {/* REFERRAL TRANSACTIONS */}

          <div className="mt-8 bg-white rounded-3xl border shadow-sm overflow-hidden">

            <div className="p-7 border-b">

              <h2 className="text-2xl font-bold">
                Referral Wallet History
              </h2>

              <p className="text-gray-500 mt-1">
                Referral-related wallet credits.
              </p>

            </div>

            {data.transactions.length ===
            0 ? (
              <div className="p-10 text-center text-gray-500">
                No referral transactions yet.
              </div>
            ) : (

              <div className="divide-y">

                {data.transactions.map(
                  (transaction) => (

                    <div
                      key={
                        transaction._id
                      }
                      className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >

                      <div>

                        <h3 className="font-semibold">
                          {
                            transaction.reason
                          }
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {
                            transaction.description
                          }
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(
                            transaction.createdAt
                          )}
                        </p>

                      </div>

                      <p
                        className={`text-xl font-black ${
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

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          {/* HOW IT WORKS */}

          <div className="mt-8 rounded-3xl bg-orange-50 border border-orange-100 p-7">

            <h2 className="text-2xl font-bold">
              How it works
            </h2>

            <div className="grid md:grid-cols-3 gap-5 mt-6">

              <div>

                <div className="text-3xl">
                  1️⃣
                </div>

                <h3 className="font-bold mt-2">
                  Share Code
                </h3>

                <p className="text-gray-600 text-sm mt-1">
                  Share your unique referral code.
                </p>

              </div>

              <div>

                <div className="text-3xl">
                  2️⃣
                </div>

                <h3 className="font-bold mt-2">
                  Friend Joins
                </h3>

                <p className="text-gray-600 text-sm mt-1">
                  Friend signs up and verifies their account.
                </p>

              </div>

              <div>

                <div className="text-3xl">
                  3️⃣
                </div>

                <h3 className="font-bold mt-2">
                  Both Get Rewarded
                </h3>

                <p className="text-gray-600 text-sm mt-1">
                  Friend gets ₹20 and you get ₹50.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}