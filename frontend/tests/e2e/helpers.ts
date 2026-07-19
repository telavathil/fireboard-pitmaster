import { Page, expect } from "@playwright/test";

export const API_BASE = "http://localhost:8000";

/**
 * The backend's simulator keeps core-temp state keyed by device_id (not
 * session_id), and multiple sessions share the default device_id in these
 * tests. Ending/clearing any leftover session here keeps each test run
 * deterministic instead of racing whatever a previous run (or the
 * background simulator) left active - see the stale-session bug found
 * during manual QA.
 */
export async function clearActiveSession(request: import("@playwright/test").APIRequestContext) {
  const res = await request.get(`${API_BASE}/api/sessions/active`);
  if (res.status() === 404) return;
  const data = await res.json();
  await request.patch(`${API_BASE}/api/sessions/${data.id}`, {
    data: { status: "completed" },
  });
}

export async function loginAsDemo(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");

  await page.getByRole("textbox", { name: "Username" }).fill("demo");
  await page.getByRole("textbox", { name: "Password" }).fill("demo");
  await page.getByRole("button", { name: "SIGN IN" }).click();
  await page.getByRole("navigation", { name: "Primary navigation" }).waitFor();
  await page.waitForLoadState("networkidle");
}

export async function expectCurrentPhase(page: Page, phase: number) {
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { currentPhase?: number }).currentPhase))
    .toBe(phase);
}
