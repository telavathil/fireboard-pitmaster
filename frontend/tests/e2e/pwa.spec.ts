import { test, expect } from "@playwright/test";

test("serves an installable web app manifest with its icons", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  const manifest = await (await request.get(href!)).json();
  expect(manifest).toMatchObject({ name: "FireBoard Pitmaster", short_name: "Pitmaster", display: "standalone", start_url: "/" });
  for (const icon of manifest.icons as Array<{ src: string }>) {
    const res = await request.get(icon.src);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

test("serves the service worker uncached and same-origin only", async ({ request }) => {
  const res = await request.get("/sw.js");
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toBe("no-cache, no-store, must-revalidate");
  expect(res.headers()["content-security-policy"]).toBe("default-src 'self'; script-src 'self'");
});

test("registers and activates the service worker", async ({ page }) => {
  await page.goto("/");
  // ready resolves once a worker is active-or-activating; poll until activation completes.
  await expect
    .poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state))
    .toBe("activated");
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/$/);
});
