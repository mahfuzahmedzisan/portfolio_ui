import { NextResponse } from "next/server";

import { ApiError } from "@/lib/auth/api-error";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { SessionExpiredError } from "@/lib/auth/session-expired";
import { retryAdminMedia } from "@/lib/media/library";
import { rejectUntrustedBrowserOrigin } from "@/lib/security/trusted-origin";

function jsonError(error: unknown, fallback: string) {
  if (error instanceof SessionExpiredError) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status || 500 },
    );
  }

  return NextResponse.json({ message: fallback }, { status: 500 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const forbidden = rejectUntrustedBrowserOrigin(request);
  if (forbidden) return forbidden;

  const { response } = await requireAdminSession();
  if (response) return response;

  const { id } = await context.params;
  const mediaId = Number(id);
  if (!Number.isInteger(mediaId) || mediaId < 1) {
    return NextResponse.json({ message: "Media not found." }, { status: 404 });
  }

  try {
    const data = await retryAdminMedia(mediaId);
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error, "Unable to retry the conversion.");
  }
}
