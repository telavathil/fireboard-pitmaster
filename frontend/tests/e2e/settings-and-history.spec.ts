import { test, expect } from "@playwright/test";
import { clearActiveSession, loginAsDemo } from "./helpers";

// Desktop and mobile nav are both real <nav> landmarks now, present in the
// DOM at the same time (mobile is just CSS-hidden at desktop widths) - scope
// to the desktop one by its aria-label so this doesn't match both.
function navLink(page: import("@playwright/test").Page, name: string) {
  return page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name });
}

test.beforeEach(async ({ request, page }) => {
  await clearActiveSession(request);
  await loginAsDemo(page);
});

test("History tab renders the session history log", async ({ page }) => {
  await navLink(page, "History").click();
  await expect(page.getByRole("heading", { name: "SESSION HISTORY LOG" })).toBeVisible();
});

test("Settings: temperature unit toggle updates active styling", async ({ page }) => {
  await navLink(page, "Settings").click();
  const celsiusBtn = page.getByRole("button", { name: /CELSIUS/ });
  await celsiusBtn.click();
  await expect(celsiusBtn).toHaveClass(/forge-btn-active/);
});

test("Settings: SSE stream interval buttons toggle active styling", async ({ page }) => {
  await navLink(page, "Settings").click();
  const rateBtn = page.getByRole("button", { name: "5 SECONDS" });
  await rateBtn.click();
  await expect(rateBtn).toHaveClass(/forge-btn-active/);
});

test("Settings: prediction model dropdown updates", async ({ page }) => {
  await navLink(page, "Settings").click();
  await page.getByRole("combobox").selectOption("exponential");
  await expect(page.getByRole("combobox")).toHaveValue("exponential");
});

test("Settings: audio alarm toggle relabels the button", async ({ page }) => {
  await navLink(page, "Settings").click();
  const alarmBtn = page.getByRole("button", { name: /AUDIO ALARMS/ });
  await expect(alarmBtn).toHaveText("AUDIO ALARMS: ON");
  await alarmBtn.click();
  await expect(alarmBtn).toHaveText("AUDIO ALARMS: MUTED");
});
