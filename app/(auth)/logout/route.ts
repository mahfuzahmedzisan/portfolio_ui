import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth/redirect";
import {
  LOGIN_PATH,
  SESSION_EXPIRED_REASON,
} from "@/lib/auth/session-expired";

/**
 * GET /logout is strictly non-mutating (Phase 01).
 * Session clearing is POST /api/auth/logout or logoutAction only.
 */
export async function GET(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.search = "";

  const next = request.nextUrl.searchParams.get("next");
  const reason = request.nextUrl.searchParams.get("reason");
  const safeNext = next ? safeRedirectPath(next, "") : "";

  if (safeNext) loginUrl.searchParams.set("next", safeNext);
  if (reason === SESSION_EXPIRED_REASON) {
    loginUrl.searchParams.set("reason", SESSION_EXPIRED_REASON);
  }

  return NextResponse.redirect(loginUrl);
}
