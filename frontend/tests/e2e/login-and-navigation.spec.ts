import { test, expect } from "@playwright/test";
import { clearActiveSession, loginAsDemo } from "./helpers";

test.beforeEach(async ({ request }) => {
  await clearActiveSession(request);
});

// Desktop and mobile nav are both real <nav> landmarks now, present in the
// DOM at the same time (mobile is just CSS-hidden at desktop widths) - scope
// to the desktop one by its aria-label so this doesn't match both.
function navLink(page: import("@playwright/test").Page, name: string) {
  return page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name });
}

test("logs in with any non-empty credentials and lands on the setup screen with no session", async ({
  page,
}) => {
  await loginAsDemo(page);
  await expect(page.getByRole("heading", { name: "Start a cook" })).toBeVisible();
  await expect(navLink(page, "Cook")).toHaveAttribute("aria-current", "page");
});

test("setup lives under Cook: there is no separate Probes tab", async ({ page }) => {
  await loginAsDemo(page);
  await expect(navLink(page, "Probes")).toHaveCount(0);
  await navLink(page, "History").click();
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: "Cook" }).click();
  await expect(page.getByRole("heading", { name: "Start a cook" })).toBeVisible();
});
