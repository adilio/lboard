import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
const port = process.env.PW_PORT || "4180";
const url = `http://127.0.0.1:${port}${process.env.APP_BASE || "/"}`;
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
    command: "node tests/serve-static.mjs",
    url,
    reuseExistingServer: false,
  },
});
