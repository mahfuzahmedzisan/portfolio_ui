import { requireAdminSession } from "@/lib/auth/require-admin";
import { proxyTus } from "@/lib/media/proxy-upstream";
import { rejectUntrustedBrowserOrigin } from "@/lib/security/trusted-origin";

export const dynamic = "force-dynamic";

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

async function forward(request: Request, context: { params: Promise<{ slug?: string[] }> }) {
  if (MUTATING.has(request.method.toUpperCase())) {
    const forbidden = rejectUntrustedBrowserOrigin(request);
    if (forbidden) return forbidden;
  }

  const { response } = await requireAdminSession();
  if (response) return response;

  const { slug } = await context.params;
  return proxyTus(request, slug);
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const HEAD = forward;
export const DELETE = forward;
export const OPTIONS = forward;
