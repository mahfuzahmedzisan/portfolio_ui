import { expect, test } from "@playwright/test";

const STATIONS = ["client", "tunnel", "engine", "log", "vault"];

test("the lab is noindex and its content is server-rendered", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/lab", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { level: 1, name: "Mahfuz Ahmed" })).toBeVisible();
  for (const id of STATIONS) await expect(page.locator(`section#${id}`)).toHaveCount(1);
  await expect(page.locator("#vault article")).toHaveCount(3);

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

test("reduced motion gets the poster fallback without a boot screen", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();

  await page.goto("/lab");
  await expect(page.locator("[data-render-mode]")).toHaveAttribute("data-render-mode", "fallback");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('img[src="/3d/posters/client.webp"]')).toHaveCount(1);

  await context.close();
});

test("skipping 3D from the boot screen persists the poster fallback", async ({ page }) => {
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

  const enterSilently = page.getByRole("dialog").getByRole("button", { name: "Enter silently" });
  await expect(enterSilently).toBeEnabled({ timeout: 60_000 });
  await enterSilently.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("the station rail scrolls to each station", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  const rail = page.getByRole("navigation", { name: "Stations" });

  await rail.getByRole("link", { name: /Database Vault/ }).click();
  await expect(rail.getByRole("link", { name: /Database Vault/ })).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("heading", { name: "Selected projects" })).toBeInViewport();
});
