import { test, expect } from "@playwright/test";
import { clearActiveSession, loginAsDemo, expectCurrentPhase } from "./helpers";

test.beforeEach(async ({ request, page }) => {
  await clearActiveSession(request);
  await loginAsDemo(page);
  await page.getByRole("button", { name: "INITIALIZE THERMAL MODEL" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { activeTab?: string }).activeTab))
    .toBe("dashboard");
});

async function gotoPhase(page: import("@playwright/test").Page, phase: number) {
  await page.goto(`/?phase=${phase}`);
  // The SSE telemetry stream stays open indefinitely, so `networkidle`
  // never resolves here - wait for the DOM instead, then give the debug
  // override effect a moment to apply.
  await page.waitForLoadState("domcontentloaded");
  await expectCurrentPhase(page, phase);
  // currentPhase is forced by the URL override immediately, independent of
  // the async fetchActiveSession() call fired on mount - wait for that to
  // resolve too, or actions like LOG WEIGHT & PULL silently no-op against
  // a still-null activeSession.
  await page.getByRole("button", { name: "END SESSION" }).waitFor({ timeout: 10000 });
}

test("?phase=2 renders the Stabilizing view", async ({ page }) => {
  await gotoPhase(page, 2);
  await expect(page.getByRole("heading", { name: "Live Thermal Analysis" })).toBeVisible();
});

test("?phase=3: FORCE BREAKOUT (SPRITZ) increments the spritz counter", async ({ page }) => {
  await gotoPhase(page, 3);
  await expect(page.getByText("0 TIMES")).toBeVisible();
  await page.getByRole("button", { name: /FORCE BREAKOUT/ }).click();
  await expect(page.getByText("1 TIMES")).toBeVisible();
});

test("?phase=4: SILENCE ALARM disables itself and relabels", async ({ page }) => {
  await gotoPhase(page, 4);
  await page.getByRole("button", { name: "SILENCE ALARM" }).click();
  const silencedBtn = page.getByRole("button", { name: "ALARM SILENCED" });
  await expect(silencedBtn).toBeVisible();
  await expect(silencedBtn).toBeDisabled();
});

test("?phase=4: LOG WEIGHT & PULL patches the session status to resting", async ({ page, request }) => {
  await gotoPhase(page, 4);
  await page.getByRole("button", { name: "LOG WEIGHT & PULL" }).click();
  await expect
    .poll(async () => (await request.get("http://localhost:8000/api/sessions/active")).json().then((d) => d.status))
    .toBe("resting");
});

test("?phase=5: Begin Carving ends the cook", async ({ page }) => {
  await gotoPhase(page, 5);
  await page.getByRole("button", { name: /Begin Carving/ }).click();
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByText("STANDBY MODE")).toBeVisible();
});

test("?phase=6 renders the active-cook view", async ({ page }) => {
  await gotoPhase(page, 6);
  await expect(page.getByRole("heading", { name: "Thermal Evolution" })).toBeVisible();
});
