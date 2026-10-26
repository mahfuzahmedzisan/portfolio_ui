import assert from "node:assert/strict";
import test from "node:test";

import {
  LOGIN_PATH,
  LOGOUT_PATH,
  SESSION_EXPIRED_REASON,
  logoutUrl,
} from "../../lib/auth/session-expired.ts";
import { clientIpFromRequestHeaders } from "../../lib/security/client-ip.ts";

test("session-expired redirect targets login without mutating via GET logout", () => {
  const url = logoutUrl("/admin/media");
  assert.equal(url.startsWith(`${LOGIN_PATH}?`), true);
  assert.match(url, new RegExp(`reason=${SESSION_EXPIRED_REASON}`));
  assert.match(url, /next=%2Fadmin%2Fmedia/);
  assert.equal(url.includes(LOGOUT_PATH), false);
});

test("logout path constant remains a bookmark-friendly non-API path", () => {
  assert.equal(LOGOUT_PATH, "/logout");
  assert.equal(LOGIN_PATH, "/login");
});

test("client IP helper never trusts spoofable forwarded headers", () => {
  const headers = {
    get(name: string) {
      const map: Record<string, string> = {
        "x-forwarded-for": "203.0.113.9",
        "x-real-ip": "198.51.100.7",
        "x-vercel-forwarded-for": "192.0.2.1",
      };
      return map[name.toLowerCase()] ?? null;
    },
  };
  assert.equal(clientIpFromRequestHeaders(headers), null);
});
