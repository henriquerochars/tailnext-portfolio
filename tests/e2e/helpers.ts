import { expect, type Page } from "@playwright/test"

export function navigation(page: Page) {
  return page.locator(page.viewportSize()!.width >= 1280 ? ".desktop-navigation nav" : "#mobile-menu")
}

export function themeControl(page: Page) {
  return page.locator(page.viewportSize()!.width >= 1280 ? ".desktop-navigation" : ".mobile-bar").getByRole("combobox", { name: "Theme" })
}

export async function openMenu(page: Page) {
  if (page.viewportSize()!.width >= 1280) return
  const toggle = page.getByRole("button", { name: "Open navigation menu" })
  if (await toggle.isVisible()) await toggle.click()
}

export async function expectHeadingInView(page: Page, name: string) {
  await expect.poll(async () => {
    const heading = await page.getByRole("heading", { name, exact: true }).boundingBox()
    const bar = await page.locator(".mobile-bar").boundingBox()
    const offset = bar ? bar.y + bar.height : 0
    return Boolean(heading && heading.y >= offset - 1 && heading.y + heading.height <= page.viewportSize()!.height)
  }).toBe(true)
}

export async function navigateTo(page: Page, label: "About" | "Experience" | "Education") {
  await openMenu(page)
  await navigation(page).getByRole("link", { name: label, exact: true }).click()
  await expectHeadingInView(page, label === "About" ? "About Me" : label)
}
