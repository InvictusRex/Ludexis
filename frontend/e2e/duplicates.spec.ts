import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("duplicates live in the Metadata section", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/duplicates");

  await expect(page).toHaveURL(/\/admin\/metadata\?tab=duplicates$/);
  await expect(page.getByRole("heading", { name: "Metadata" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Duplicates" })).toHaveAttribute("aria-selected", "true");

  await expect(
    page
      .getByText(/stored more than once/)
      .or(page.getByText("No duplicates found"))
      .or(page.getByText("Duplicates could not be loaded")),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
});
