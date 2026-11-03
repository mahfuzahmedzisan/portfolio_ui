import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectOversizedBody } from "@/lib/http/body-limit";
import { rejectUntrustedBrowserOrigin } from "@/lib/security/trusted-origin";

const PROJECT_TYPES = ["web-app", "ecommerce", "saas", "api", "dashboard", "3d", "support", "other"] as const;
const BUDGETS = ["under-1k", "1k-5k", "5k-15k", "15k-plus", "not-sure"] as const;

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(160),
  projectType: z.enum(PROJECT_TYPES),
  budget: z.enum(BUDGETS),
  message: z.string().trim().min(10).max(3000),
  // Honeypot: a real visitor never sees or fills this field.
  company: z.string().max(0).optional(),
});

type Contact = z.infer<typeof schema>;

const BODY_LIMIT = 16 * 1024;
const WINDOW_MS = 60 * 60 * 1000;
const PER_VISITOR = 5;
const GLOBAL = 30;

// Best-effort limiter for a single server instance; the webhook or mail provider is the real backstop.
const hits = new Map<string, number[]>();

function allowed(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  const global = (hits.get("*") ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= PER_VISITOR || global.length >= GLOBAL) return false;
  hits.set(key, [...recent, now]);
  hits.set("*", [...global, now]);
  return true;
}

function summary(contact: Contact): string {
  return [
    `New portfolio enquiry from ${contact.name} <${contact.email}>`,
    `Project: ${contact.projectType} · Budget: ${contact.budget}`,
    "",
    contact.message,
  ].join("\n");
}

/** Sends the message through whichever channel is configured. Returns null when none is. */
async function deliver(contact: Contact): Promise<boolean | null> {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // `text` for Slack, `content` for Discord, the structured fields for anything else.
      body: JSON.stringify({ text: summary(contact), content: summary(contact), ...contact }),
    });
    return response.ok;
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (key && to) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>",
        to: [to],
        reply_to: contact.email,
        subject: `Portfolio enquiry: ${contact.name}`,
        text: summary(contact),
      }),
    });
    return response.ok;
  }

  return null;
}

export async function POST(request: Request) {
  const untrusted = rejectUntrustedBrowserOrigin(request);
  if (untrusted) return untrusted;

  const oversized = rejectOversizedBody(request, BODY_LIMIT);
  if (oversized) return oversized;

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (!allowed(visitor)) {
    return NextResponse.json({ message: "Too many messages. Please try again later." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Please check the form and try again." }, { status: 422 });
  }

  const result = await deliver(parsed.data).catch(() => false);
  if (result === null) {
    // No channel configured: keep the message in the server log in development, refuse in production.
    if (process.env.NODE_ENV !== "production") {
      console.info("[contact] no delivery channel configured, message logged only:\n" + summary(parsed.data));
      return NextResponse.json({ ok: true, delivered: false });
    }
    return NextResponse.json({ message: "Messaging is not available right now." }, { status: 503 });
  }
  if (!result) return NextResponse.json({ message: "The message could not be delivered." }, { status: 502 });

  return NextResponse.json({ ok: true, delivered: true });
}
