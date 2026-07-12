import { test, expect } from "@playwright/test";

test("has title and shows workspace ready", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/TransitOps/);

  // Expect the main heading to be visible.
  await expect(
    page.locator("text=TransitOps workspace is ready")
  ).toBeVisible();
});
