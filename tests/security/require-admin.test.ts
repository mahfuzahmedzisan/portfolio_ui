import assert from "node:assert/strict";
import test from "node:test";

import type { SessionPayload } from "../../types/auth.ts";

/** Mirrors requireAdminSession role gate without cookie I/O. */
function adminGate(session: SessionPayload | null): 401 | 403 | "ok" {
  if (!session) return 401;
  if (session.user.role !== "admin") return 403;
  return "ok";
}

function payload(role: "admin" | "user"): SessionPayload {
  return {
    accessToken: "1|token",
    sessionEndsAt: Date.now() + 60_000,
    user: {
      id: 1,
      name: "Test",
      email: "test@example.com",
      role,
      two_factor_enabled: false,
    },
  };
}

test("requireAdminSession gate rejects missing session", () => {
  assert.equal(adminGate(null), 401);
});

test("requireAdminSession gate rejects non-admin session", () => {
  assert.equal(adminGate(payload("user")), 403);
});

test("requireAdminSession gate allows admin session", () => {
  assert.equal(adminGate(payload("admin")), "ok");
});
