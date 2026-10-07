import { expect, type Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/auth\/login/);
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("Admin123!");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible({ timeout: 15000 });
}
