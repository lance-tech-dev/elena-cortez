// Admin idle timeout. Shared by proxy.ts (server enforcement), the login
// action and the client-side timer, so no "server-only" here.

/** Signed out after this long without activity. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/** The warning with "Stay signed in" shows this long before sign-out. */
export const IDLE_WARNING_MS = 2 * 60 * 1000;

/**
 * Extra time the server allows past IDLE_TIMEOUT_MS. The browser signs out
 * on time; this only covers the gap between the last activity and the last
 * request that told the server about it.
 */
export const SERVER_GRACE_MS = 2 * 60 * 1000;

/** httpOnly cookie holding the time (ms) of the last admin request. */
export const LAST_ACTIVE_COOKIE = "admin_last_active";

export const lastActiveCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  // No maxAge/expires: a browser-session cookie, deleted when the browser
  // quits. proxy.ts treats a missing cookie as expired, so quitting the
  // browser signs the admin out (in addition to the 30-minute idle limit).
} as const;

/** Only same-site admin paths are allowed as a post-login destination. */
export function safeAdminPath(path: string | null | undefined): string {
  return path && /^\/admin(\/[\w\-/]*)?$/.test(path) ? path : "/admin";
}
