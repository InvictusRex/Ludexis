import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("job history lives in the Tasks section", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/jobs");

  await expect(page).toHaveURL(/\/admin\/tasks\?tab=jobs$/);
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Jobs" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Start job" })).toBeVisible();

  // A job table, no jobs yet, or a load error.
  await expect(
    page
      .getByRole("table")
      .or(page.getByText(/^No jobs (yet|match these filters)$/))
      .or(page.getByText("Jobs could not be loaded")),
  ).toBeVisible({ timeout: 15000 });
});
