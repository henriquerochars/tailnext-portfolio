import { expect, test } from "@playwright/test"

test("shows the empty release archive and supports keyboard dismissal", async ({ page }) => {
  await page.goto("/")
  const section = page.locator("#pawsphemy")
  await expect(section.locator(":scope > p").filter({ hasText: "No releases published yet. Check back soon." })).toBeVisible()
  await expect(section.getByText(/official changelog also tracks unreleased work/i)).toBeVisible()
  await expect(section.getByRole("link", { name: "Official changelog" })).toHaveAttribute("href", "https://github.com/henriquerochars/pawsphemy/blob/main/CHANGELOG.md")
  await expect(section.getByRole("link", { name: "Gameplay GIFs" })).toHaveAttribute("href", "https://github.com/henriquerochars/pawsphemy/tree/main/docs/gifs")
  const open = section.getByRole("button", { name: "View release archive" })
  await open.click()
  const dialog = page.getByRole("dialog", { name: "View release archive" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("No releases published yet. Check back soon.")).toBeVisible()
  await dialog.getByLabel("Search by name").fill("test")
  await dialog.getByLabel("From date").fill("2025-01-01")
  await page.keyboard.press("Escape")
  await expect(dialog).not.toBeVisible()
  await expect(open).toBeFocused()
})

test("orders and filters releases and limits archive pages", async () => {
  const { filterReleases, releasePage } = await import("../../lib/pawsphemy-releases")
  const releases = Array.from({ length: 12 }, (_, index) => ({
    name: `Release ${index + 1}`,
    date: `2025-01-${String(index + 1).padStart(2, "0")}`,
    explanation: `Full explanation ${index + 1}`,
    gifs: [{ src: `/fixture-${index + 1}.gif`, alt: `Example ${index + 1}` }],
  }))
  const sorted = filterReleases(releases, "en")
  expect(sorted.slice(0, 5).map(release => release.name)).toEqual(["Release 12", "Release 11", "Release 10", "Release 9", "Release 8"])
  expect(releasePage(sorted, 1)).toHaveLength(10)
  expect(releasePage(sorted, 2)).toEqual(sorted.slice(10))
  expect(filterReleases(releases, "en", " RELEASE 1 ", "2025-01-10", "2025-01-11").map(release => release.name)).toEqual(["Release 11", "Release 10"])
  expect(sorted[0].explanation).toBe("Full explanation 12")
  expect(sorted[0].gifs[0].alt).toBe("Example 12")
})

test("renders populated releases and resets archive pagination when filters change", async ({ page }) => {
  // Bundle the real component with test-only data; no fixture route or release is shipped.
  const { webpack } = (await import("next/dist/compiled/webpack/webpack.js")).default as unknown as {
    webpack: (config: object, callback: (error?: Error | null, stats?: { hasErrors(): boolean; toString(options: { errors: boolean }): string }) => void) => void
  }
  const path = await import("node:path")
  const fs = await import("node:fs/promises")
  const os = await import("node:os")
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "pawsphemy-ui-"))
  try {
    await new Promise<void>((resolve, reject) => {
      webpack({ mode: "development", entry: path.resolve("tests/fixtures/pawsphemy/entry.tsx"), output: { path: output, filename: "fixture.js" }, resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@": process.cwd() } }, module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: path.resolve("tests/fixtures/pawsphemy/loader.cjs") }] } }, (error, stats) => {
        if (error || stats?.hasErrors()) reject(error ?? new Error(stats?.toString({ errors: true })))
        else resolve()
      })
    })
    await page.setContent('<div id="root"></div>')
    await page.addScriptTag({ path: path.join(output, "fixture.js") })
    const section = page.locator("#pawsphemy")
    const preview = section.locator("article:not(dialog article)")
    await expect(preview).toHaveCount(5)
    await expect(preview.first().getByRole("heading")).toHaveText("Release 12")
    await expect(preview.first().getByText("Full explanation 12")).toBeVisible()
    await expect(preview.first().getByRole("img", { name: "Example 12" })).toHaveAttribute("src", "/fixture-12.gif")
    await section.getByRole("button", { name: "View release archive" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.locator("article")).toHaveCount(10)
    const next = dialog.getByRole("button", { name: "Next" })
    const previous = dialog.getByRole("button", { name: "Previous" })
    await next.focus()
    await page.keyboard.press("Enter")
    await expect(dialog.getByText("Page 2 / 2")).toBeVisible()
    await expect(next).toBeFocused()
    await expect(next).toHaveAttribute("aria-disabled", "true")
    await page.keyboard.press("Enter")
    await expect(dialog.getByText("Page 2 / 2")).toBeVisible()
    await previous.focus()
    await page.keyboard.press("Enter")
    await expect(dialog.getByText("Page 1 / 2")).toBeVisible()
    await expect(previous).toBeFocused()
    await expect(previous).toHaveAttribute("aria-disabled", "true")
    await next.focus()
    await page.keyboard.press("Enter")
    await expect(dialog.locator("article")).toHaveCount(2)
    await dialog.getByLabel("Search by name").fill(" RELEASE 1 ")
    await expect(dialog.locator("article")).toHaveCount(4)
    await expect(dialog.getByText("Full explanation 11")).toBeVisible()
    await dialog.getByLabel("From date").fill("2025-01-10")
    await dialog.getByLabel("To date").fill("2025-01-11")
    await expect(dialog.locator("article")).toHaveCount(2)
    await expect(dialog.locator("article").first().locator("time")).toHaveAttribute("datetime", "2025-01-11")
    await dialog.getByLabel("Search by name").fill("missing")
    await expect(dialog.getByText("No releases match these filters.")).toBeVisible()
    await dialog.getByLabel("Search by name").fill("")
    await dialog.getByLabel("From date").fill("")
    await dialog.getByLabel("To date").fill("")
    await expect(dialog.getByText("Page 1 / 2")).toBeVisible()
    await expect(dialog.locator("article")).toHaveCount(10)
  } finally { await fs.rm(output, { recursive: true, force: true }) }
})
