import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const GAME_COUNT = /^[\d,]+ games?$/;

test("library search and sort live in the URL", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/library");

  await expect(page.getByRole("heading", { name: "Library", level: 1 })).toBeVisible();
  await expect(page.getByText(GAME_COUNT)).toBeVisible({ timeout: 15000 });

  await page.getByLabel("Search the library").fill("zz-no-such-game");
  await expect(page).toHaveURL(/[?&]q=zz-no-such-game/);
  await expect(page.getByText("No games match")).toBeVisible({ timeout: 15000 });

  await page.goto("/library?sort=-created_at");
  await expect(page.getByRole("combobox", { name: "Sort by" })).toContainText("Recently added");
});

test("a game opens from the library into its detail page", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/library");

  const first = page.locator("main a[href^='/archive/']").first();
  const hasGames = await first.waitFor({ timeout: 15000 }).then(
    () => true,
    () => false,
  );
  test.skip(!hasGames, "The library is empty");
  await first.click();

  await expect(page).toHaveURL(/\/archive\//);
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Files" })).toBeVisible();
});

test("the command palette searches the archive", async ({ page }) => {
  await loginAsAdmin(page);

  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox", { name: "Search your archive" });
  await expect(input).toBeVisible();
  await input.fill("portal");
  await expect(page.getByRole("option", { name: /Search the library for/ })).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/library\?q=portal/);
});
