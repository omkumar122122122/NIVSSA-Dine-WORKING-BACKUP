"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  referralCode: string;
  walletBalance: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("nivssaToken");

      if (!token) {
        window.location.href = "/auth";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/profile/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load profile"
        );
      }

      setProfile(data.user);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");

      localStorage.setItem(
        "nivssaUser",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );
    } catch (err: any) {
      console.error("Load profile error:", err);

      setError(
        err.message || "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!name.trim()) {
        setError("Name cannot be empty.");
        return;
      }

      if (newPassword && newPassword.length < 6) {
        setError(
          "New password must be at least 6 characters."
        );
        return;
      }

      if (newPassword && !currentPassword) {
        setError(
          "Enter current password to change password."
        );
        return;
      }

      const token = localStorage.getItem("nivssaToken");

      if (!token) {
        window.location.href = "/auth";
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/profile/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            currentPassword:
              currentPassword || undefined,
            newPassword:
              newPassword || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      setProfile(data.user);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");

      localStorage.setItem(
        "nivssaUser",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setCurrentPassword("");
      setNewPassword("");

      setMessage(
        "Profile updated successfully ✅"
      );
    } catch (err: any) {
      console.error("Save profile error:", err);

      setError(
        err.message || "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      if (!profile?.referralCode) {
        return;
      }

      await navigator.clipboard.writeText(
        profile.referralCode
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Could not copy referral code.");
    }
  };

  const logout = () => {
    localStorage.removeItem("nivssaToken");
    localStorage.removeItem("nivssaUser");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/auth";
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl bg-white px-8 py-6 text-sm font-semibold shadow-sm">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg font-black text-white">
              N
            </div>

            <div>
              <h1 className="text-xl font-black">
                NIVSSA Dine
              </h1>

              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Smart Dining
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:block"
            >
              Home
            </a>

            <a
              href="/my-bookings"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:block"
            >
              My Bookings
            </a>

            <button
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Customer Account
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your NIVSSA Dine account.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl font-black text-white">
                {name
                  ? name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {name || "NIVSSA Customer"}
                </h2>

                <p className="text-sm text-slate-500">
                  {profile?.email}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold">
                Full Name
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">
                Email
              </label>

              <input
                value={profile?.email || ""}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
              />

              <p className="mt-2 text-xs text-slate-400">
                Email is connected to your OTP login account.
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">
                Phone
              </label>

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter phone number"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold">
                Change Password
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Leave these fields empty if you do not want to change your password.
              </p>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold">
                  Current Password
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(
                      e.target.value
                    )
                  }
                  placeholder="Current password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold">
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="New password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="mt-7 w-full rounded-xl bg-slate-900 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving Changes..."
                : "Save Profile Changes"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-sm font-semibold text-slate-300">
                Wallet Balance
              </p>

              <p className="mt-3 text-4xl font-black">
                ₹
                {Number(
                  profile?.walletBalance || 0
                ).toFixed(2)}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Referral rewards will appear here.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Your Referral Code
              </p>

              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="text-center text-2xl font-black tracking-[0.15em]">
                  {profile?.referralCode ||
                    "Generating..."}
                </p>
              </div>

              <button
                onClick={copyReferralCode}
                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {copied
                  ? "Copied ✅"
                  : "Copy Referral Code"}
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-bold">
                Account Information
              </h3>

              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    Role
                  </span>

                  <span className="font-semibold capitalize">
                    {profile?.role || "customer"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    Email
                  </span>

                  <span className="max-w-[190px] break-all text-right font-semibold">
                    {profile?.email || "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    Phone
                  </span>

                  <span className="font-semibold">
                    {profile?.phone || "Not added"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-slate-500">
          NIVSSA Dine — Smart Restaurant Table Reservation & Waitlist Management
        </div>
      </footer>
    </main>
  );
}