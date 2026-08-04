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

test("admin can log in and log out", async ({ page }) => {
  await loginAsAdmin(page);

  await page.locator("header").getByRole("button").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Username")).toBeVisible();
});

test("wrong password shows an error and stays on login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByText("Invalid username or password")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Username")).toBeVisible();
});
