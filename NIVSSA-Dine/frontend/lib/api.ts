const DEFAULT_API_URL = "http://localhost:3000";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/**
 * Resolves the backend URL from environment variables.
 * Checks both VITE_API_URL (Vite standard requested) and NEXT_PUBLIC_API_URL (Next.js standard).
 */
const resolveRawApiUrl = (): string => {
  // Check process.env (Next.js server/client runtime via next.config.ts)
  if (typeof process !== "undefined" && process.env) {
    if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check import.meta.env for Vite / ESM client runtime
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    if (meta?.env?.VITE_API_URL) return meta.env.VITE_API_URL;
    if (meta?.env?.NEXT_PUBLIC_API_URL) return meta.env.NEXT_PUBLIC_API_URL;
  } catch {
    // Environment does not support or provide import.meta.env
  }

  return DEFAULT_API_URL;
};

const rawUrl = trimTrailingSlash(resolveRawApiUrl().trim());

/**
 * The base origin of the backend without a trailing "/api" suffix.
 * Example: https://nivssa-dine-working-backup-1.onrender.com
 */
export const API_ORIGIN = rawUrl.endsWith("/api")
  ? rawUrl.slice(0, -4)
  : rawUrl;

/**
 * The full API base path with a single "/api" suffix.
 * Prevents accidental "/api/api" if VITE_API_URL already contains "/api".
 * Example: https://nivssa-dine-working-backup-1.onrender.com/api
 */
export const API_BASE_URL = rawUrl.endsWith("/api")
  ? rawUrl
  : `${rawUrl}/api`;

