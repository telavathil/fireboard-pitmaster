import { test, expect } from "@playwright/test";
import { clearActiveSession, loginAsDemo } from "./helpers";

test.beforeEach(async ({ request, page }) => {
  await clearActiveSession(request);
  await loginAsDemo(page);
});

test("Setup: a preset fills protein, cut and target together", async ({ page }) => {
  await page.getByRole("button", { name: /Pork butt/ }).click();
  await expect(page.getByLabel("Target temperature")).toHaveText("205°");
  await expect(page.getByRole("radio", { name: "Pork" })).toBeChecked();
  await expect(page.getByLabel("Cut")).toHaveValue("Pork butt");
});

test("Setup: protein and cooker are single-choice radio groups", async ({ page }) => {
  await page.getByText("Poultry", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Poultry" })).toBeChecked();
  await page.getByText("Offset smoker", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Offset smoker" })).toBeChecked();
});

test("Setup: switching weight to pounds converts the entry and still starts a metric cook", async ({ page, request }) => {
  await page.getByText("lb", { exact: true }).click();
  await expect(page.getByLabel("Weight")).toHaveValue("11.9");
  await page.getByLabel("Weight").fill("12");
  await page.getByRole("button", { name: "Start cook" }).click();
  await expect
    .poll(async () => (await request.get("http://localhost:8000/api/sessions/active")).json().then((d) => d.weight_kg))
    .toBe(5.44);
});

test("Setup: an invalid weight is explained and nothing is submitted", async ({ page }) => {
  await page.getByLabel("Weight").fill("0");
  await page.getByRole("button", { name: "Start cook" }).click();
  await expect(page.getByText("Enter a weight between 0.2 and 40 kg.")).toBeVisible();
  await expect(page.getByLabel("Weight")).toBeFocused();
});

test("starting a cook creates a session and navigates to the dashboard tab", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Start cook" }).click();
  await page.getByRole("region", { name: "Core temperature" }).waitFor({ timeout: 10000 });
  await expect(page.getByRole("button", { name: "Cook options" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Core temperature" })).toBeVisible();
});

test("ending an active cook returns to a sessionless state", async ({ page }) => {
  await page.getByRole("button", { name: "Start cook" }).click();
  await page.getByRole("region", { name: "Core temperature" }).waitFor({ timeout: 10000 });

  await page.getByRole("button", { name: "Cook options" }).click();
  await page.getByRole("menuitem", { name: /End cook/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "End cook" }).click();
  await expect(page.getByRole("heading", { name: "Start a cook" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cook options" })).not.toBeVisible();
});

test("cancelling the end-cook confirmation keeps the cook running", async ({ page }) => {
  await page.getByRole("button", { name: "Start cook" }).click();
  await page.getByRole("button", { name: "Cook options" }).click();
  await page.getByRole("menuitem", { name: /End cook/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Keep cooking" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("region", { name: "Core temperature" })).toBeVisible();
});
