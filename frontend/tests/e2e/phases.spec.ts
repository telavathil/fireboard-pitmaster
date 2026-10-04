import { test, expect } from "@playwright/test";
import { clearActiveSession, loginAsDemo, expectCurrentPhase } from "./helpers";

test.beforeEach(async ({ request, page }) => {
  await clearActiveSession(request);
  await loginAsDemo(page);
  await page.getByRole("button", { name: "Start cook" }).click();
  // Setup and the live screen share the Cook tab, so wait for the live screen itself.
  await page.getByRole("region", { name: "Core temperature" }).waitFor({ timeout: 10000 });
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
  await page.getByRole("region", { name: "Core temperature" }).waitFor({ timeout: 10000 });
}

function currentStage(page: import("@playwright/test").Page) {
  return page.getByRole("list", { name: "Cook stages" }).locator('[aria-current="step"]');
}

test("?phase=2 shows the learning stage without inventing an estimate", async ({ page }) => {
  await gotoPhase(page, 2);
  await expect(currentStage(page)).toHaveText("Learning");
});

test("?phase=3 shows the stall stage", async ({ page }) => {
  await gotoPhase(page, 3);
  await expect(currentStage(page)).toHaveText("Stall");
});

test("?phase=4: the pull takes over and the alarm can be silenced", async ({ page }) => {
  await gotoPhase(page, 4);
  await expect(page.getByRole("alert").filter({ hasText: "Pull now" })).toBeVisible();
  const silence = page.getByRole("button", { name: "Silence alarm" });
  await silence.click();
  await expect(page.getByRole("button", { name: "Turn alarm sound back on" })).toHaveAttribute("aria-pressed", "true");
});

test("?phase=4: I pulled it patches the session status to resting", async ({ page, request }) => {
  await gotoPhase(page, 4);
  await page.getByRole("button", { name: "I pulled it, start rest" }).click();
  await expect
    .poll(async () => (await request.get("http://localhost:8000/api/sessions/active")).json().then((d) => d.status))
    .toBe("resting");
});

test("?phase=5: Finish cook ends the cook after confirmation", async ({ page }) => {
  await gotoPhase(page, 5);
  await page.getByRole("button", { name: "Finish cook" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "End cook" }).click();
  // Ending waits for the backend to save it; reload only after the app has moved on.
  await expect(page.getByRole("heading", { name: "Start a cook" })).toBeVisible();
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByRole("heading", { name: "Start a cook" })).toBeVisible();
});

test("?phase=6 shows the cooking stage", async ({ page }) => {
  await gotoPhase(page, 6);
  await expect(currentStage(page)).toHaveText("Cooking");
});
