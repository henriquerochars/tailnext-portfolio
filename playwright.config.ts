import { defineConfig, devices } from "@playwright/test"

const remote = process.env.PLAYWRIGHT_BASE_URL
const owned = process.env.HARNESS_SERVER_OWNED === "1"
const port = Number(process.env.HARNESS_PORT ?? "3000")
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid browser port")
if (remote && !/^https:\/\/[a-z0-9-]+\.vercel\.app\/?$/.test(remote)) throw new Error("Remote profile requires HTTPS Vercel deployment URL")

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: true,
  failOnFlakyTests: true,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: remote ?? `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: remote || owned ? undefined : {
    command: `yarn start --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
