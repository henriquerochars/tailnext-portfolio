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
