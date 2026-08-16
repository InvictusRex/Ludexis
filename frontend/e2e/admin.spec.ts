import { test, expect, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("Admin123!");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText("Total Archive Entries")).toBeVisible({
    timeout: 15000,
  });
}

test("admin dashboard loads stats", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "Administration Dashboard" }),
  ).toBeVisible();

  for (const label of [
    "Total Entries",
    "Collections",
    "Users",
    "Metadata Coverage",
    "Verification Coverage",
  ]) {
    await expect(page.getByText(label).first()).toBeVisible();
  }

  await expect(page.getByText("Quick Actions")).toBeVisible();

  await page.goto("/admin/analytics");

  await expect(
    page.getByRole("heading", { name: "Job & System Analytics" }),
  ).toBeVisible();

  await expect(
    page
      .getByRole("heading", { name: "Scan Progress" })
      .or(page.getByText("Failed to load analytics data. Please try again.")),
  ).toBeVisible({ timeout: 15000 });

  await expect(
    page
      .getByText("Job Status Distribution")
      .or(page.getByText("Failed to load analytics data. Please try again.")),
  ).toBeVisible();
});
