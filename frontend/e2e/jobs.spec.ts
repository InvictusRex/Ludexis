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

test("jobs page renders heading and filter/trigger UI", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/admin/jobs");

  await expect(page.getByRole("heading", { name: "Job Center" })).toBeVisible();

  await expect(page.getByText("Filters")).toBeVisible();
  await expect(page.getByText("Status").first()).toBeVisible();
  await expect(page.getByText("Job History")).toBeVisible();

  await expect(page.getByRole("button", { name: "Start Job" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();

  await expect(
    page.getByText(/Live|No jobs found\.|Failed to load jobs/).first(),
  ).toBeVisible({ timeout: 15000 });
});
