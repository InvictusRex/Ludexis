import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  webServer: {
    command: "npm run dev -- -p 3001",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: /visual\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: /visual\.spec\.ts/,
    },
  ],
});
