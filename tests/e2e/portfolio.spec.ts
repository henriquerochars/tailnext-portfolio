import { expect, test } from "@playwright/test"
import { featuredSkillIds, skills } from "../../data/profile"

test.describe("portfolio smoke coverage", () => {
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
  test("renders the primary portfolio content without console errors", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text())
      }
    })

    await page.goto("/")

    await expect(page).toHaveTitle("Henrique Rocha Dev")
    await expect(page.getByRole("heading", { name: "Hi, I'm Henrique!" })).toBeVisible()
    await expect(page.getByAltText("Henrique Rocha")).toBeVisible()
    await expect(page.getByAltText("Henrique Rocha")).toHaveJSProperty("complete", true)
    await expect(page.getByAltText("Henrique Rocha")).not.toHaveJSProperty("naturalWidth", 0)
    await expect(page.getByRole("heading", { name: "About Me" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "My Skills" })).toBeVisible()
    await expect(page.locator("#home")).toContainText("Senior Software Engineer at Lena")
    await expect(page.locator("#home")).toContainText("Rio de Janeiro, Brazil")
    await expect(page.locator("#about")).toContainText("harness engineering and spec-driven development")
    await expect(page.locator("#about")).toContainText("postgraduate program in Software Engineering for Applied AI at UNIPDS")
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
    const skillList = page.getByRole("list", { name: "My Skills" })
    await expect(skillList.getByRole("listitem")).toHaveText(featuredSkillIds.map(id => skills[id].label))
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Senior Software Engineer at Lena/)

    expect(consoleErrors).toEqual([])
  })

  test("navigates between Home and About", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("link", { name: "About", exact: true }).click()
    await expect(page.locator("#about")).toBeInViewport()

    await page.getByRole("link", { name: "Home", exact: true }).click()
    await expect(page.locator("#home")).toBeInViewport()
  })

  test("toggles dark and light themes", async ({ page }) => {
    await page.goto("/")

    const darkButton = page.getByRole("button", { name: "Switch to dark theme" })
    if (await darkButton.isVisible()) {
      await darkButton.click()
    }

    await expect(page.locator("html")).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator("html")).toHaveClass(/dark/)
    await page.getByRole("button", { name: "Switch to light theme" }).click()
    await expect(page.locator("html")).not.toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator("html")).not.toHaveClass(/dark/)
  })

  test("exposes the expected external links", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("link", { name: "Blog pt-br" })).toHaveAttribute(
      "href",
      "https://henriquerochadevblog.vercel.app"
    )
    await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/henriquerochars"
    )
    await expect(page.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/henriquerochaserrano/"
    )
    await expect(page.getByRole("link", { name: "Twitter" })).toHaveAttribute(
      "href",
      "https://twitter.com/henriquerochars"
    )
  })

  test("supports mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")

    await page.getByRole("button", { name: "Open navigation menu" }).click()
    await expect(page.getByRole("button", { name: "Close navigation menu" })).toBeVisible()
    await expect(page.getByRole("link", { name: "About", exact: true })).toBeVisible()

    await page.getByRole("link", { name: "About", exact: true }).click()
    await expect(page.locator("#about")).toBeInViewport()
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeVisible()
  })

  test("supports keyboard navigation and theme controls", async ({ page }) => {
    await page.goto("/")
    const about = page.getByRole("link", { name: "About", exact: true })
    for (let i = 0; i < 12 && !(await about.evaluate(element => element === document.activeElement)); i++) await page.keyboard.press("Tab")
    await expect(about).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page.locator("#about")).toBeInViewport()
    const theme = page.getByRole("button", { name: /Switch to (dark|light) theme/ })
    const previous = await theme.getAttribute("aria-label")
    for (let i = 0; i < 12 && !(await theme.evaluate(element => element === document.activeElement)); i++) await page.keyboard.press("Tab")
    await expect(theme).toBeFocused()
    await page.keyboard.press("Space")
    await expect(theme).not.toHaveAttribute("aria-label", previous!)
  })

  for (const width of [360, 1440]) {
    for (const theme of ["light", "dark"]) {
      test(`reviews professional content at ${width}px in ${theme} theme`, async ({ page }, testInfo) => {
        await page.setViewportSize({width, height: 900})
        await page.addInitScript(value => localStorage.setItem("theme", value), theme)
        const linkedinRequests: string[] = []
        page.on("request", request => {
          if (new URL(request.url()).hostname.endsWith("linkedin.com")) linkedinRequests.push(request.url())
        })
        await page.goto("/")
        await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /light/)
        await expect(page.getByAltText("Henrique Rocha")).not.toHaveJSProperty("naturalWidth", 0)
        const skillList = page.getByRole("list", {name: "My Skills"})
        await skillList.scrollIntoViewIfNeeded()
        await expect(skillList.getByRole("listitem")).toHaveCount(featuredSkillIds.length)
        for (const item of await skillList.getByRole("listitem").all()) {
          const box = await item.boundingBox()
          expect(box).not.toBeNull()
          expect(box!.x).toBeGreaterThanOrEqual(0)
          expect(box!.x + box!.width).toBeLessThanOrEqual(width)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await expect(page.locator('a[href^="mailto:"], a[href^="tel:"]')).toHaveCount(0)
        expect(linkedinRequests).toEqual([])
        await page.evaluate(() => document.fonts.ready)
        await testInfo.attach(`profile-${width}-${theme}`, {
          body: await page.screenshot({fullPage: true, animations: "disabled"}), contentType: "image/png",
        })
      })
    }
  }
})

const runtimeErrors = new WeakMap<object, string[]>()
