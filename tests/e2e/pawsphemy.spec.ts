import { expect, test } from "@playwright/test"

test("shows the empty release archive and supports keyboard dismissal", async ({ page }) => {
  await page.goto("/")
  const section = page.locator("#pawsphemy")
  await expect(section.getByText("No releases published yet. Check back soon.")).toBeVisible()
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
