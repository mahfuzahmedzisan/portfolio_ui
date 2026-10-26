import "server-only";

import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/auth-cookies";
import type { SessionPayload } from "@/types/auth";

/**
 * Session + admin role for privileged BFF Route Handlers.
 * Laravel still enforces role:admin; this is defense in depth.
 */
export async function requireAdminSession(): Promise<
  | { session: SessionPayload; response: null }
  | { session: null; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ message: "Unauthenticated." }, { status: 401 }),
    };
  }

  if (session.user.role !== "admin") {
    return {
      session: null,
      response: NextResponse.json(
        { message: "You do not have permission to perform this action." },
        { status: 403 },
      ),
    };
  }

  return { session, response: null };
}
