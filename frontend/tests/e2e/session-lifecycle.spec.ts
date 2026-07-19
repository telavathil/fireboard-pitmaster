import { test, expect } from "@playwright/test";
import { clearActiveSession, loginAsDemo } from "./helpers";

test.beforeEach(async ({ request, page }) => {
  await clearActiveSession(request);
  await loginAsDemo(page);
});

test("Pre-Cook Setup: preset buttons update the displayed target temperature", async ({ page }) => {
  await page.getByRole("button", { name: /PORK BUTT \(205/ }).click();
  await expect(page.getByText("205°F").first()).toBeVisible();
});

test("Pre-Cook Setup: meat-type quick-select buttons toggle active styling", async ({ page }) => {
  // exact: true is what actually fixes the ambiguity that used to need an
  // xpath workaround - "poultry" is also a substring of the visible
  // "POULTRY (165°F)" preset button's accessible name.
  const poultryBtn = page.getByRole("button", { name: "poultry", exact: true });
  await poultryBtn.click();
  await expect(poultryBtn).toHaveClass(/forge-btn-active/);
});

test("Pre-Cook Setup: cooker profile card selection shows a SELECTED badge", async ({ page }) => {
  const offsetCard = page.getByRole("button", { name: /Offset Smoker/ });
  await offsetCard.click();
  await expect(offsetCard.getByText("SELECTED")).toBeVisible();
});

test("submitting Pre-Cook Setup creates a session and navigates to the dashboard tab", async ({
  page,
}) => {
  await page.getByRole("button", { name: "INITIALIZE THERMAL MODEL" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { activeTab?: string }).activeTab))
    .toBe("dashboard");
  await expect(page.getByRole("button", { name: "END ACTIVE COOK" })).toBeVisible();
  await expect(page.getByRole("button", { name: "END SESSION" })).toBeVisible();
});

test("ending an active cook returns to a sessionless state", async ({ page }) => {
  await page.getByRole("button", { name: "INITIALIZE THERMAL MODEL" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { activeTab?: string }).activeTab))
    .toBe("dashboard");

  await page.getByRole("button", { name: "END ACTIVE COOK" }).click();
  await expect(page.getByText("STANDBY MODE")).toBeVisible();
  await expect(page.getByRole("button", { name: "END ACTIVE COOK" })).not.toBeVisible();
});
