import { test, expect, type Page } from "@playwright/test";

const SHOT_OPTS = { maxDiffPixelRatio: 0.02 };

// Counts, job lists, game cards and the account email depend on whatever library the server holds,
// so they are masked: these baselines check the layout, not the data.
const accountEmail = (page: Page) => page.locator("header").getByText(/@/);
const innermostGrid = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).locator("xpath=ancestor::div[contains(concat(' ', @class, ' '), ' grid ')][1]");

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

test("login page screenshot", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByLabel("Username")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("login-page.png", {
    ...SHOT_OPTS,
    fullPage: true,
  });
});

test("admin dashboard screenshot after login", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Administration Dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Quick Actions")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("admin-dashboard.png", {
    ...SHOT_OPTS,
    mask: [
      accountEmail(page),
      innermostGrid(page, "Total Entries"),
      page.locator('[data-slot="card"]').filter({ hasText: "Recent Jobs" }),
    ],
  });
});

test("library page screenshot after login", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "Library", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Showing .* entries/)).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.getByRole("checkbox", { name: "Select all entries" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("library.png", {
    ...SHOT_OPTS,
    mask: [
      accountEmail(page),
      page.getByText(/^Showing /),
      page.getByText(/ shown · /),
      page.locator("div.grid:has(> div.relative)"),
    ],
  });
});

test("monitoring page screenshot after login", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/monitoring");
  await expect(
    page.getByRole("heading", { name: "System Monitoring" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("heading", { name: "Infrastructure" })
      .or(page.getByText("Failed to load monitoring data. Please try again.")),
  ).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("admin-monitoring.png", {
    ...SHOT_OPTS,
    fullPage: true,
  });
});
