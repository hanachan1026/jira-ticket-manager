import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  reporter: "list",
  // Chrome extensions require a persistent context that can't run in parallel
  workers: 1,
  projects: [
    {
      name: "chromium-extension",
      // Browser options are set per-test via launchPersistentContext in fixtures.ts
      // because Chrome extensions require a persistent context with --load-extension
    },
  ],
});
