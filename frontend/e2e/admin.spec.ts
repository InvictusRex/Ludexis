import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("dashboard overview shows sections, scans and server health", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Admin Dashboard", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  const sections = page.getByRole("navigation", { name: "Dashboard sections" });
  for (const name of ["Overview", "Libraries", "Tasks", "Metadata", "Users", "Activity log", "Settings"]) {
    await expect(sections.getByRole("link", { name })).toBeVisible();
  }

  await expect(page.getByRole("button", { name: "Scan for changes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Full scan" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Services" })).toContainText("Database", { timeout: 15000 });
});

test("retired pages redirect to where their content moved", async ({ page }) => {
  await loginAsAdmin(page);

  const moves: [string, RegExp][] = [
    ["/admin/monitoring", /\/admin$/],
    ["/admin/analytics", /\/admin$/],
    ["/admin/library", /\/admin\/libraries$/],
    ["/admin/audit-logs", /\/admin\/logs$/],
    ["/admin/permissions", /\/admin\/users\?tab=roles$/],
    ["/search", /\/library$/],
  ];
  for (const [from, to] of moves) {
    await page.goto(from);
    await expect(page).toHaveURL(to);
  }
});
