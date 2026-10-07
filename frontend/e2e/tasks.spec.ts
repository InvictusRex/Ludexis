import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("the session lives in httpOnly cookies, not in page storage", async ({ page, context }) => {
  await loginAsAdmin(page);

  const cookies = await context.cookies();
  const access = cookies.find((cookie) => cookie.name === "ludexis_access");
  expect(access?.httpOnly).toBe(true);
  const stored = await page.evaluate(() => Object.keys(window.localStorage).filter((key) => key.includes("token")));
  expect(stored).toEqual([]);

  // A reload keeps the session.
  await page.reload();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible({ timeout: 15000 });
});

test("admin can run a scheduled task now", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/tasks");

  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Scheduled" })).toHaveAttribute("aria-selected", "true");
  const row = page.getByRole("row").filter({ hasText: "Detect duplicates" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /run now/i }).click();

  await expect(page.getByText("Detect duplicates started")).toBeVisible();
});
