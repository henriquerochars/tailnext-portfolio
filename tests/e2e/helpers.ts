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
    const heading = await page.getByRole("heading", { name: name === "Henrique Rocha Serrano" ? `Home — ${name}` : name, exact: true }).boundingBox()
    const bar = await page.locator(".mobile-bar").boundingBox()
    const offset = bar ? bar.y + bar.height : 0
    return Boolean(heading && heading.y >= offset - 1 && heading.y + heading.height <= page.viewportSize()!.height)
  }).toBe(true)
  await page.evaluate(() => new Promise<void>(resolve => {
    let previous = window.scrollY
    let stableFrames = 0
    const settled = () => {
      stableFrames = window.scrollY === previous ? stableFrames + 1 : 0
      previous = window.scrollY
      if (stableFrames >= 3) resolve()
      else requestAnimationFrame(settled)
    }
    requestAnimationFrame(settled)
  }))
}

export async function navigateTo(page: Page, label: "About" | "Experience" | "Education") {
  await openMenu(page)
  await navigation(page).getByRole("link", { name: label, exact: true }).click()
  await expectHeadingInView(page, label === "About" ? "About Me" : label)
}
