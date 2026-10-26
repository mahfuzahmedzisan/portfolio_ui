/**
 * Shared vocabulary for "this session is dead and the user must sign in again".
 *
 * Deliberately free of server-only imports: the proxy, route handlers,
 * Server Components, and browser code all need to agree on these values.
 */

import type { Route } from "next";

/** Query flag that tells the login page why the visitor landed there. */
export const SESSION_EXPIRED_REASON = "session-expired";

/**
 * Bookmark-friendly path. GET /logout is non-mutating and only redirects to
 * login. Session clearing happens via POST /api/auth/logout or logoutAction.
 */
export const LOGOUT_PATH = "/logout";

/** Login path used when a Sanctum token is dead but a cookie may still exist. */
export const LOGIN_PATH = "/login";

/** Raised when the API rejects our token and the refresh cannot revive it. */
export class SessionExpiredError extends Error {
  constructor(message = "Your session has expired.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * Redirect target after auth failure. Does not clear cookies by itself —
 * the login page performs a one-shot POST logout when `reason=session-expired`
 * so GET navigations stay non-mutating (avoids CSRF + proxy loops).
 */
export function logoutUrl(next?: string): Route {
  const params = new URLSearchParams({ reason: SESSION_EXPIRED_REASON });
  if (next) params.set("next", next);
  return `${LOGIN_PATH}?${params.toString()}` as Route;
}
