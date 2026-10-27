import { defineConfig, devices } from "@playwright/test";

const trustedPreviewToken = process.env.VERCEL_OIDC_TOKEN;

export default defineConfig({
  testDir: "./tests/smoke",
  timeout: 60_000,
  use: {
    trace: "retain-on-failure",
    extraHTTPHeaders: trustedPreviewToken
      ? { "x-vercel-trusted-oidc-idp-token": trustedPreviewToken }
      : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
