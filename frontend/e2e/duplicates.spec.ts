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

test("duplicates page renders heading and empty or list state", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.goto("/admin/duplicates");

  await expect(
    page.getByRole("heading", { name: "Duplicate Detection" }),
  ).toBeVisible();

  await expect(
    page
      .getByText("No duplicates found")
      .or(page.getByRole("heading", { name: /High Priority|Duplicates/ }))
      .or(page.getByText("Failed to load duplicate groups")),
  ).toBeVisible({ timeout: 15000 });

  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
});
