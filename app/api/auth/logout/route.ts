import { NextResponse } from "next/server";
import { revokeLaravelToken } from "@/lib/auth/api";
import { deleteSession, getSession } from "@/lib/auth/auth-cookies";
import { rejectUntrustedBrowserOrigin } from "@/lib/security/trusted-origin";

export async function POST(request: Request) {
  const forbidden = rejectUntrustedBrowserOrigin(request);
  if (forbidden) return forbidden;

  const session = await getSession();

  if (session?.accessToken) {
    await revokeLaravelToken(session.accessToken);
  }

  await deleteSession();

  return NextResponse.json({ ok: true });
}
