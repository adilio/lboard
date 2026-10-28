import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
const port = process.env.PW_PORT || "4173";
const url = `http://127.0.0.1:${port}${process.env.APP_BASE || "/lboard/"}`;
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  use: {
    baseURL: url,
    viewport: { width: 1180, height: 820 },
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH ||
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: `npm run preview -- --port ${port}`,
    url,
    reuseExistingServer: !process.env.CI,
  },
});
