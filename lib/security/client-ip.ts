/**
 * Phase 01 secure fallback for client IP forwarding.
 *
 * Spoofable headers (`x-forwarded-for`, `x-real-ip`, `x-vercel-forwarded-for`)
 * are ignored until a verified reverse-proxy topology is documented.
 * Returning null omits `X-Client-IP` so Laravel uses the TCP peer (the BFF).
 */
export function clientIpFromRequestHeaders(
  _headers: { get(name: string): string | null },
): string | null {
  return null;
}
