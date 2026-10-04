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

test("History lists a cook after it ends, from the backend's saved history", async ({ page }) => {
  await page.getByLabel("Cut").fill("E2E history brisket");
  await page.getByRole("button", { name: "Start cook" }).click();
  await page.getByRole("region", { name: "Core temperature" }).waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Cook options" }).click();
  await page.getByRole("menuitem", { name: /End cook/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "End cook" }).click();

  await navLink(page, "History").click();
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "E2E history brisket" }).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText("203°");
});

test("Settings: the temperature unit applies everywhere and survives a reload", async ({ page }) => {
  await navLink(page, "Settings").click();
  await page.getByText("Celsius (°C)", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Celsius (°C)" })).toBeChecked();

  await page.reload();
  await navLink(page, "Settings").click();
  await expect(page.getByRole("radio", { name: "Celsius (°C)" })).toBeChecked();

  await navLink(page, "Cook").click();
  await expect(page.getByLabel("Target temperature")).toHaveText("95°");
});

test("Settings: alarm sound can be turned off and stays off", async ({ page }) => {
  await navLink(page, "Settings").click();
  await page.getByText("Off", { exact: true }).click();
  await page.reload();
  await navLink(page, "Settings").click();
  await expect(page.getByRole("radio", { name: "Off" })).toBeChecked();
});

test("Settings: sign out returns to the sign-in screen", async ({ page }) => {
  await navLink(page, "Settings").click();
  await expect(page.getByText(/Signed in as/)).toContainText("demo");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "SIGN IN" })).toBeVisible();
});
