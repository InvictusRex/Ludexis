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

test("the session lives in httpOnly cookies, not in page storage", async ({ page, context }) => {
  await loginAsAdmin(page);

  const cookies = await context.cookies();
  const access = cookies.find((cookie) => cookie.name === "ludexis_access");
  expect(access?.httpOnly).toBe(true);
  const stored = await page.evaluate(() => Object.keys(window.localStorage).filter((key) => key.includes("token")));
  expect(stored).toEqual([]);

  // A reload keeps the session.
  await page.reload();
  await expect(page.getByText("Total Archive Entries")).toBeVisible({ timeout: 15000 });
});

test("admin can run a scheduled task now", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/tasks");

  await expect(page.getByRole("heading", { name: "Scheduled Tasks" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "Detect duplicates" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /run now/i }).click();

  await expect(page.getByText("Detect duplicates started")).toBeVisible();
});
