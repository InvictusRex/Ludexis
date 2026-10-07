import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "lib/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      "hooks/**/*.test.{ts,tsx}",
      "app/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules", "e2e/**", "playwright.config.ts"],
    css: false,
    // Forms typed key by key (passwords, setup) outrun the 5 s default on busy or slow CI runners.
    testTimeout: 20_000,
    restoreMocks: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
