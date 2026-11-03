import { expect, test } from "@playwright/test";

const STATIONS = ["client", "tunnel", "services", "vault", "engine", "experience", "contact"];

test("the lab is noindex and its content is server-rendered", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/lab", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { level: 1, name: "Mahfuz Ahmed" })).toBeVisible();
  for (const id of STATIONS) await expect(page.locator(`section#${id}`)).toHaveCount(1);
  expect(await page.locator("#vault article").count()).toBeGreaterThan(0);

  await context.close();
});

test("only /lab may compile WebAssembly", async ({ request }) => {
  const policy = (headers: Record<string, string>) =>
    headers["content-security-policy"] ?? headers["content-security-policy-report-only"] ?? "";

  const lab = await request.get("/lab");
  const home = await request.get("/");

  expect(policy(lab.headers())).toContain("'wasm-unsafe-eval'");
  expect(policy(home.headers())).not.toContain("'wasm-unsafe-eval'");
});

test("reduced motion gets the poster fallback without an intro", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();

  await page.goto("/lab");
  await expect(page.locator("[data-render-mode]")).toHaveAttribute("data-render-mode", "fallback");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('img[src="/3d/posters/client.webp"]')).toHaveCount(1);

  await context.close();
});

test("skipping 3D from the intro persists the poster fallback", async ({ page }) => {
  await page.goto("/lab");
  const mode = page.locator("[data-render-mode]");
  await expect(mode).not.toHaveAttribute("data-render-mode", "pending");

  // Headless GPUs may already land on the fallback; skipping must still pin it.
  if ((await mode.getAttribute("data-render-mode")) === "webgl") {
    await page.getByRole("dialog").getByRole("button", { name: "Skip 3D" }).click();
  }
  await expect(mode).toHaveAttribute("data-render-mode", "fallback");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.reload();
  await expect(mode).toHaveAttribute("data-render-mode", "fallback");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("button", { name: "3D off" })).toHaveAttribute("aria-pressed", "false");
});

test("the WebGL path loads, enters and renders without page errors", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/lab");
  const mode = page.locator("[data-render-mode]");
  await expect(mode).not.toHaveAttribute("data-render-mode", "pending");
  test.skip((await mode.getAttribute("data-render-mode")) !== "webgl", "no WebGL-capable GPU in this run");

  // The intro dismisses itself once the assets are ready.
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 60_000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("the floating nav starts collapsed and scrolls to each station", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  const nav = page.getByRole("navigation", { name: "Main" });
  const orb = nav.getByRole("button", { name: "Open menu" });

  await expect(orb).toHaveAttribute("aria-expanded", "false");
  await expect(nav.getByRole("link", { name: "Projects", exact: true })).toHaveCount(0);
  await orb.click();
  await nav.getByRole("link", { name: "Projects", exact: true }).click();
  // Picking an item collapses the nav again.
  await expect(nav.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: "Selected projects" })).toBeInViewport();
});

test("the contact form validates and the honeypot is hidden", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  const form = page.locator("#contact form");
  await expect(form.getByRole("button", { name: /Send message/ })).toBeVisible();
  // Browser validation blocks an empty submit, so nothing is requested.
  let requested = false;
  page.on("request", (r) => r.url().includes("/api/contact") && (requested = true));
  await form.getByRole("button", { name: /Send message/ }).click();
  expect(requested).toBe(false);
  // Off-screen and hidden from assistive tech: only bots see the honeypot.
  await expect(form.locator('[aria-hidden="true"] input[name="company"]')).toHaveCount(1);
});

test("the contact API rejects untrusted origins and bad payloads", async ({ request }) => {
  const forbidden = await request.post("/api/contact", { data: {}, headers: { origin: "https://evil.example" } });
  expect(forbidden.status()).toBe(403);
  const invalid = await request.post("/api/contact", { data: { name: "x" }, headers: { origin: "http://localhost:3100" } });
  expect([403, 422]).toContain(invalid.status());
});
