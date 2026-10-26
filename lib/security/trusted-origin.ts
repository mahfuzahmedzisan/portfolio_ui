/**
 * Browser mutation Route Handlers must prove the request comes from a
 * trusted frontend origin. SameSite=Lax is necessary but not sufficient
 * defense-in-depth for cookie-authenticated POSTs.
 *
 * Policy: require Origin, or a parseable Referer origin; reject missing,
 * null, malformed, and non-allowlisted values with 403.
 *
 * Returns a standard `Response` (not NextResponse) so unit tests can import
 * this module without pulling in `next/server`.
 */

function parseOrigin(value: string | null): string | null {
  if (!value || value === "null") return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function siteOrigin(): string | null {
  return parseOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null);
}

/** Extra comma-separated origins for previews (optional). */
function extraAllowedOrigins(): string[] {
  const raw = process.env.TRUSTED_BROWSER_ORIGINS ?? "";
  return raw
    .split(",")
    .map((part) => parseOrigin(part.trim()))
    .filter((origin): origin is string => Boolean(origin));
}

export function trustedBrowserOrigins(): string[] {
  const origins = new Set<string>();
  const site = siteOrigin();
  if (site) origins.add(site);
  for (const extra of extraAllowedOrigins()) origins.add(extra);
  return [...origins];
}

export function requestBrowserOrigin(request: Request): string | null {
  const fromOrigin = parseOrigin(request.headers.get("origin"));
  if (fromOrigin) return fromOrigin;
  return parseOrigin(request.headers.get("referer"));
}

export function isTrustedBrowserOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return trustedBrowserOrigins().includes(origin);
}

/** Returns a 403 Response when the browser origin is not trusted. */
export function rejectUntrustedBrowserOrigin(request: Request): Response | null {
  const origin = requestBrowserOrigin(request);
  if (isTrustedBrowserOrigin(origin)) return null;

  return Response.json(
    { message: "Forbidden origin." },
    { status: 403 },
  );
}
