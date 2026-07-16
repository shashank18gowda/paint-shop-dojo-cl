// Centralized, validated access to public runtime config.
// NEXT_PUBLIC_* values are inlined into the client bundle at build time,
// so a missing value in a production build is a hard error (not a silent
// fallback to localhost, which would break the deployed app).

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_API_URL is required for production builds. Set it before running `next build`.",
  );
}

/** Backend API base URL, e.g. `http://localhost:3001/api`. */
export const API_BASE = apiUrl ?? "http://localhost:3001/api";

/** Backend origin without the `/api` suffix, e.g. `http://localhost:3001`. */
export const BACKEND_URL = API_BASE.replace(/\/api\/?$/, "");
