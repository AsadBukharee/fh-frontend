import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev -- -p 3000",
        port: 3000,
        reuseExisting: !process.env.CI,
      },
});

