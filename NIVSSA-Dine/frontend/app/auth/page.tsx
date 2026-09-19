"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api/auth";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");

  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  /* =====================================================
     LOGIN / SIGNUP
  ===================================================== */

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    clearMessages();
    setLoading(true);

    try {
      const endpoint =
        mode === "signup"
          ? `${API_URL}/signup`
          : `${API_URL}/login`;

      const body =
        mode === "signup"
          ? {
              name,
              phone,
              email,
              password,
              referralCode: referralCode.trim() || undefined,
            }
          : {
              email,
              password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong"
        );
      }

      if (!data.userId) {
        throw new Error(
          "User ID was not received from server"
        );
      }

      setUserId(data.userId);
      setOtp("");
      setOtpStep(true);

      setMessage(
        mode === "signup"
          ? "OTP sent to your email. Please check your inbox or spam folder."
          : "Login OTP sent to your email. Please check your inbox or spam folder."
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the request"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     VERIFY OTP
  ===================================================== */

  const handleVerifyOTP = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid OTP"
        );
      }

      if (!data.token) {
        throw new Error(
          "Authentication token was not received."
        );
      }

      /* =====================================================
         SAVE AUTH DATA
         Customer + Staff both supported
      ===================================================== */

      // Main customer storage
      localStorage.setItem(
        "nivssaToken",
        data.token
      );

      localStorage.setItem(
        "nivssaUser",
        JSON.stringify(data.user)
      );

      // Staff dashboard compatibility
      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      /* =====================================================
         ROLE BASED REDIRECT
      ===================================================== */

      const role = data.user?.role;

      if (
        role === "staff" ||
        role === "admin"
      ) {
        router.push("/staff");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     BACK FROM OTP
  ===================================================== */

  const handleBack = () => {
    setOtpStep(false);
    setOtp("");
    setUserId("");
    clearMessages();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-fuchsia-100 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-pink-200/50 rounded-full blur-3xl" />

        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-rose-200/50 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-[28px] shadow-[0_20px_60px_rgba(190,24,93,0.15)] p-8 border border-pink-100">

          {/* =====================================================
             HEADER
          ===================================================== */}

          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-5xl mb-4 shadow-sm">
              🍽️
            </div>

            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
              NIVSSA Dine
            </h1>

            <p className="text-gray-500 mt-2">
              Restaurant Reservation System
            </p>
          </div>

          {/* =====================================================
             SUCCESS MESSAGE
          ===================================================== */}

          {message && (
            <div className="mb-5 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {/* =====================================================
             ERROR MESSAGE
          ===================================================== */}

          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* =====================================================
             LOGIN / SIGNUP
          ===================================================== */}

          {!otpStep ? (
            <>
              {/* MODE SWITCH */}

              <div className="flex rounded-2xl bg-pink-50 p-1.5 mb-6 border border-pink-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    clearMessages();
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    mode === "login"
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                      : "text-pink-600 hover:bg-pink-100"
                  }`}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    clearMessages();
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    mode === "signup"
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                      : "text-pink-600 hover:bg-pink-100"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* AUTH FORM */}

              <form
                onSubmit={handleAuth}
                className="space-y-5"
              >
                {/* NAME FOR SIGNUP */}

                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      placeholder="Enter your name"
                      required
                      className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    />
                  </div>
                )}

                {/* PHONE FOR SIGNUP */}

                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setPhone(value);
                      }}
                      placeholder="Enter your phone number"
                      required
                      maxLength={10}
                      minLength={10}
                      className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    />
                  </div>
                )}

                {/* EMAIL */}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />
                </div>

                {/* REFERRAL CODE FOR SIGNUP */}

                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Referral Code <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>

                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Enter referral code"
                      maxLength={30}
                      className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    />
                  </div>
                )}

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white py-3.5 font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "signup"
                    ? "Create Account"
                    : "Login"}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* =====================================================
                 OTP HEADER
              ===================================================== */}

              <div className="text-center mb-7">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-3xl mb-4 shadow-sm">
                  🔐
                </div>

                <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                  Verify OTP
                </h2>

                <p className="text-gray-500 mt-2">
                  Enter the 6-digit OTP sent to your
                  email address.
                </p>

                <p className="text-sm text-pink-500 mt-2 font-medium">
                  Check your inbox or spam folder.
                </p>
              </div>

              {/* OTP FORM */}

              <form
                onSubmit={handleVerifyOTP}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    6-Digit OTP
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const value =
                        e.target.value.replace(
                          /\D/g,
                          ""
                        );

                      setOtp(value);
                    }}
                    placeholder="Enter OTP"
                    required
                    autoFocus
                    className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none transition-all placeholder:text-gray-300 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />
                </div>

                {/* VERIFY */}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    otp.length !== 6
                  }
                  className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white py-3.5 font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-200 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading
                    ? "Verifying..."
                    : "Verify OTP"}
                </button>

                {/* BACK */}

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-pink-200 text-pink-600 py-3 font-semibold hover:bg-pink-50 disabled:opacity-50 transition-all"
                >
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* =====================================================
             FOOTER
          ===================================================== */}

          <div className="text-center mt-7 pt-5 border-t border-pink-100">
            <p className="text-xs text-gray-400">
              © 2026 NIVSSA Dine • Smart Restaurant Reservation
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}