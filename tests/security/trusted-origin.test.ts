import assert from "node:assert/strict";
import test from "node:test";

import {
  isTrustedBrowserOrigin,
  rejectUntrustedBrowserOrigin,
  requestBrowserOrigin,
} from "../../lib/security/trusted-origin.ts";

const SITE = "http://localhost:3000";

function withSiteEnv(run: () => void | Promise<void>) {
  const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
  const previousExtra = process.env.TRUSTED_BROWSER_ORIGINS;
  process.env.NEXT_PUBLIC_SITE_URL = SITE;
  delete process.env.TRUSTED_BROWSER_ORIGINS;
  return Promise.resolve(run()).finally(() => {
    if (previousSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSite;
    if (previousExtra === undefined) delete process.env.TRUSTED_BROWSER_ORIGINS;
    else process.env.TRUSTED_BROWSER_ORIGINS = previousExtra;
  });
}

test("allows a trusted Origin", async () => {
  await withSiteEnv(() => {
    const request = new Request(`${SITE}/api/auth/login`, {
      method: "POST",
      headers: { Origin: SITE },
    });
    assert.equal(requestBrowserOrigin(request), SITE);
    assert.equal(isTrustedBrowserOrigin(SITE), true);
    assert.equal(rejectUntrustedBrowserOrigin(request), null);
  });
});

test("allows a trusted Referer when Origin is absent", async () => {
  await withSiteEnv(() => {
    const request = new Request(`${SITE}/api/auth/logout`, {
      method: "POST",
      headers: { Referer: `${SITE}/login?reason=session-expired` },
    });
    assert.equal(requestBrowserOrigin(request), SITE);
    assert.equal(rejectUntrustedBrowserOrigin(request), null);
  });
});

test("denies an untrusted Origin", async () => {
  await withSiteEnv(async () => {
    const request = new Request(`${SITE}/api/auth/login`, {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    });
    const response = rejectUntrustedBrowserOrigin(request);
    assert.ok(response);
    assert.equal(response.status, 403);
  });
});

test("denies a missing Origin and Referer", async () => {
  await withSiteEnv(async () => {
    const request = new Request(`${SITE}/api/auth/login`, { method: "POST" });
    const response = rejectUntrustedBrowserOrigin(request);
    assert.ok(response);
    assert.equal(response.status, 403);
  });
});

test("denies a null Origin", async () => {
  await withSiteEnv(async () => {
    const request = new Request(`${SITE}/api/auth/login`, {
      method: "POST",
      headers: { Origin: "null" },
    });
    const response = rejectUntrustedBrowserOrigin(request);
    assert.ok(response);
    assert.equal(response.status, 403);
  });
});

test("denies a malformed Origin", async () => {
  await withSiteEnv(async () => {
    const request = new Request(`${SITE}/api/auth/login`, {
      method: "POST",
      headers: { Origin: "not-a-url" },
    });
    const response = rejectUntrustedBrowserOrigin(request);
    assert.ok(response);
    assert.equal(response.status, 403);
  });
});
