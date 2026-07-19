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

test("logs in with any non-empty credentials and lands on Pre-Cook Setup with no session", async ({
  page,
}) => {
  await loginAsDemo(page);
  await expect(page.getByRole("heading", { name: "Pre-Cook Setup" })).toBeVisible();
});

test("Dashboard nav shows the Empty Dashboard state when no session is active (regression)", async ({
  page,
}) => {
  // Regression test for a real bug found during manual QA: Phase1Setup's
  // render condition used to also fire whenever currentPhase===1 (which is
  // the default with no active session), permanently shadowing this view
  // no matter which tab was clicked.
  await loginAsDemo(page);
  await navLink(page, "Dashboard").click();
  await expect(page.getByRole("heading", { name: "PITMASTER DASHBOARD IDLE" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pre-Cook Setup" })).not.toBeVisible();
});

test("'GO TO PROBES SETUP' on the Empty Dashboard navigates back to Pre-Cook Setup", async ({
  page,
}) => {
  await loginAsDemo(page);
  await navLink(page, "Dashboard").click();
  await page.getByRole("button", { name: "GO TO PROBES SETUP" }).click();
  await expect(page.getByRole("heading", { name: "Pre-Cook Setup" })).toBeVisible();
});

test("Empty Dashboard card renders at full width, not collapsed by a spacing-scale collision", async ({
  page,
}) => {
  // Regression test for the max-w-md-resolves-to-spacing-md CSS bug. The
  // card itself is a styling container, not a semantic/interactive
  // element, so there's no role to look it up by - CSS class is correct
  // here, not a fallback.
  await loginAsDemo(page);
  await navLink(page, "Dashboard").click();
  const card = page.locator(".glass-card").first();
  const box = await card.boundingBox();
  expect(box?.width).toBeGreaterThan(400);
});
