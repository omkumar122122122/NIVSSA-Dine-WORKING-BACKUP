import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
  ],
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.VITE_API_URL ||
      "",
    VITE_API_URL:
      process.env.VITE_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "",
  },
};

export default nextConfig;