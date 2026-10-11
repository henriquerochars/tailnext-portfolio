import { expect, test } from "@playwright/test"
import { featuredSkillIds, skills } from "../../data/profile"
import { expectHeadingInView, navigateTo, navigation, openMenu, themeControl } from "./helpers"

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()) })
  runtimeErrors.set(page, errors)
})

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([])
  runtimeErrors.delete(page)
})

test("renders the reviewed portfolio content without console errors", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle("Henrique Rocha Dev")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Henrique Rocha Serrano")
  await expect(page.getByText("Hi, I'm Henrique!", { exact: true })).toBeVisible()
  const portrait = page.getByAltText("Henrique Rocha")
  await expect(portrait).toBeVisible()
  await expect(portrait).toHaveJSProperty("complete", true)
  await expect(portrait).not.toHaveJSProperty("naturalWidth", 0)
  await expect(page.getByRole("heading", { name: "About Me" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "My Skills" })).toBeVisible()
  await expect(page.locator(".profile-introduction")).toContainText("Senior Software Engineer at Lena")
  await expect(page.locator(".profile-introduction")).toContainText("Rio de Janeiro, Brazil")
  await expect(page.locator("#about")).toContainText("harness engineering and spec-driven development")
  await expect(page.locator("#about")).toContainText("postgraduate program in Software Engineering for Applied AI at UNIPDS")
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
  await expect(page.getByRole("list", { name: "My Skills" }).getByRole("listitem")).toHaveText(featuredSkillIds.map(id => skills[id].label))
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Senior Software Engineer at Lena/)
})

test("navigates between Home and About using native fragments", async ({ page }) => {
  await page.goto("/")
  await navigateTo(page, "About")
  await expect(page).toHaveURL(/#about$/)
  await page.getByRole("link", { name: "Home — Henrique Rocha Serrano", exact: true }).click()
  await expect(page).toHaveURL(/#home$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1)
  await expectHeadingInView(page, "Henrique Rocha Serrano")
})

test("selects and persists dark, light and system themes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/")
  const theme = themeControl(page)
  await expect(theme).toHaveValue("system")
  await expect(page.locator("html")).toHaveClass(/dark/)
  for (const mode of ["light", "dark"]) {
    await theme.selectOption(mode)
    await page.reload()
    await expect(theme).toHaveValue(mode)
    await expect(page.locator("html")).toHaveClass(new RegExp(mode))
  }
  await theme.selectOption("system")
  await page.reload()
  await expect(theme).toHaveValue("system")
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.emulateMedia({ colorScheme: "light" })
  await expect(page.locator("html")).toHaveClass(/light/)
  await theme.selectOption("dark")
  await page.emulateMedia({ colorScheme: "light" })
  await expect(page.locator("html")).toHaveClass(/dark/)
})

test("exposes the preserved public destinations", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("link", { name: "Blog pt-br", exact: true })).toHaveAttribute("href", "https://henriquerochadevblog.vercel.app")
  for (const [label, href] of [
    ["GitHub", "https://github.com/henriquerochars"],
    ["LinkedIn", "https://www.linkedin.com/in/henriquerochaserrano/"],
    ["Twitter", "https://twitter.com/henriquerochars"],
  ]) await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href)
  await expect(page.locator('a[href^="mailto:"], a[href^="tel:"], a[download]')).toHaveCount(0)
})

test("supports mobile navigation, Escape and closing after selection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await openMenu(page)
  const close = page.getByRole("button", { name: "Close navigation menu" })
  await expect(close).toHaveAttribute("aria-expanded", "true")
  await expect(navigation(page).getByRole("link", { name: "About", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeFocused()
  await navigateTo(page, "About")
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute("aria-expanded", "false")
  await expect(themeControl(page)).toBeVisible()
  await openMenu(page)
  await page.getByRole("link", { name: "Home", exact: true }).click()
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute("aria-expanded", "false")
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1)
})

test("supports skip navigation, keyboard links and the theme selector", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("Tab")
  const skip = page.getByRole("link", { name: "Skip to content" })
  await expect(skip).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("main")).toBeFocused()
  await expectHeadingInView(page, "About Me")
  await page.goto("/")
  const about = navigation(page).getByRole("link", { name: "About", exact: true })
  for (let i = 0; i < 16 && !(await about.evaluate(element => element === document.activeElement)); i++) await page.keyboard.press("Tab")
  await expect(about).toBeFocused()
  for (const name of ["Experience", "Education", "Blog pt-br"]) {
    await page.keyboard.press("Tab")
    await expect(page.getByRole("link", { name, exact: true })).toBeFocused()
  }
  await page.keyboard.press("Tab")
  const theme = themeControl(page)
  await expect(theme).toBeFocused()
  expect(await theme.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none")
  // Native select type-ahead works in both macOS and Linux headless Chromium.
  await page.keyboard.press("l")
  await page.keyboard.press("Enter")
  await expect(theme).toHaveValue("light")
  await expect(page.locator("html")).toHaveClass(/light/)
  for (const name of ["Blog pt-br", "Education", "Experience", "About"]) {
    await page.keyboard.press("Shift+Tab")
    await expect(page.getByRole("link", { name, exact: true })).toBeFocused()
  }
  await page.keyboard.press("Enter")
  await expectHeadingInView(page, "About Me")
})

for (const width of [360, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`reviews professional content at ${width}px in ${theme} theme`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(value => localStorage.setItem("theme", value), theme)
      const externalRequests: string[] = []
      page.on("request", request => {
        const host = new URL(request.url()).hostname
        if (host.endsWith("linkedin.com") || host.endsWith("googleapis.com") || host.endsWith("gstatic.com")) externalRequests.push(request.url())
      })
      await page.goto("/")
      await expect(page.locator("html")).toHaveClass(new RegExp(theme))
      await expect(page.getByAltText("Henrique Rocha")).not.toHaveJSProperty("naturalWidth", 0)
      const skillList = page.getByRole("list", { name: "My Skills" })
      await skillList.scrollIntoViewIfNeeded()
      await expect(skillList.getByRole("listitem")).toHaveCount(featuredSkillIds.length)
      for (const item of await skillList.getByRole("listitem").all()) {
        const box = (await item.boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(width)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      expect(externalRequests).toEqual([])
      await page.evaluate(() => document.fonts.ready)
      await testInfo.attach(`profile-${width}-${theme}`, {
        body: await page.screenshot({ fullPage: true, animations: "disabled" }), contentType: "image/png",
      })
    })
  }
}

const runtimeErrors = new WeakMap<object, string[]>()

for (const mode of ["light", "dark"]) {
  test(`keeps rendered text, hover and focus contrast readable in ${mode}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(value => localStorage.setItem("theme", value), mode)
    await page.goto("/#experience")
    await expectHeadingInView(page, "Experience")
    await navigation(page).getByRole("link", { name: "Experience", exact: true }).hover()
    await page.locator(".earlier-experience > summary").hover()
    const ratios = await page.evaluate(() => {
      const luminance = (color: string) => {
        const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(value => {
          const channel = Number(value) / 255
          return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
        })
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
      }
      const contrast = (foreground: string, background: string) => {
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
        return (values[0] + .05) / (values[1] + .05)
      }
      const background = getComputedStyle(document.body).backgroundColor
      return ["body", ".about-copy", ".skills-list > li", ".career-organization", ".earlier-experience > summary", ".desktop-navigation a[aria-current]", ".desktop-navigation .theme-control"].map(selector => {
        const style = getComputedStyle(document.querySelector(selector)!)
        return { selector, ratio: contrast(style.color, style.backgroundColor === "rgba(0, 0, 0, 0)" ? background : style.backgroundColor) }
      })
    })
    for (const { selector, ratio } of ratios) expect(ratio, selector).toBeGreaterThanOrEqual(4.5)
    await themeControl(page).focus()
    const focus = await themeControl(page).evaluate(element => {
      const style = getComputedStyle(element)
      return { width: style.outlineWidth, color: style.outlineColor, accent: getComputedStyle(document.body).getPropertyValue("--accent").trim() }
    })
    expect(focus.width).toBe("3px")
    expect(focus.color).not.toBe("rgba(0, 0, 0, 0)")
    await testInfo.attach(`focus-${mode}`, { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" })
  })
}
