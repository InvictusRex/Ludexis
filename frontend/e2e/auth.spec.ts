import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("admin can log in and log out", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByLabel("Username")).toBeVisible();
});

test("wrong password shows an error and stays on login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/auth\/login/);

  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Invalid username or password" })).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByLabel("Username")).toBeVisible();
});
