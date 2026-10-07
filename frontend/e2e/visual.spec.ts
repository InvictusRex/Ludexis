import { test, expect, type Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const SHOT_OPTS = { maxDiffPixelRatio: 0.02 };
const GAME_COUNT = /^[\d,]+ games?$/;

// Counts, jobs, covers and titles depend on whatever library the server holds, so they are masked
// ([data-mask] in the components, every poster and every image): these baselines check the layout, not the data.
const dataRegions = (page: Page) => [
  page.locator("[data-mask]"),
  page.locator("main a[href^='/archive/']"),
  page.locator("main img"),
];

test("login page screenshot", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByLabel("Username")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("login-page.png", { ...SHOT_OPTS, fullPage: true });
});

test("dashboard screenshot after login", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Services" })).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("admin-dashboard.png", { ...SHOT_OPTS, mask: dataRegions(page) });
});

test("library page screenshot after login", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Library", level: 1 })).toBeVisible();
  await expect(page.getByText(GAME_COUNT)).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("library.png", {
    ...SHOT_OPTS,
    mask: [...dataRegions(page), page.getByText(GAME_COUNT)],
  });
});

test("game page screenshot after login", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/library");
  const first = page.locator("main a[href^='/archive/']").first();
  const hasGames = await first.waitFor({ timeout: 15000 }).then(
    () => true,
    () => false,
  );
  test.skip(!hasGames, "The library is empty");
  await first.click();
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("game-page.png", {
    ...SHOT_OPTS,
    mask: [...dataRegions(page), page.getByRole("tabpanel")],
  });
});
