import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures"
import { education, employment, skills } from "../../data/profile"
import { englishUI } from "../../i18n/ui"
import { formatDuration, isoDuration, monthsInclusive } from "../../lib/profile-duration"

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

test("renders the complete career and verified skills without inferring associations", async ({ page }) => {
  await page.goto("/")
  expect(await page.locator("main > section").evaluateAll(sections => sections.map(section => section.id))).toEqual([
    "home", "about", "experience", "education", "blog", "pawsphemy",
  ])
  const jobs = page.getByRole("list", { name: "Professional experience", exact: true }).locator(":scope > li")
  const studies = page.getByRole("list", { name: "Academic background", exact: true }).locator(":scope > li")
  await expect(jobs).toHaveCount(employment.length)
  await expect(studies).toHaveCount(education.length)
  for (const [index, entry] of [...employment, ...education].entries()) {
    const job = "employer" in entry
    const item = job ? jobs.nth(index) : studies.nth(index - employment.length)
    const organization = job ? entry.employer : entry.institution
    await expect(item.getByRole("heading", { level: 3 })).toHaveText(job ? entry.role : entry.program)
    await expect(item).toContainText(organization)
    await expect(item).toBeVisible()
    if (job) for (const paragraph of entry.description) await expect(item).toContainText(paragraph)
    if (job) {
      const months = monthsInclusive(entry.start, entry.end, new Date())
      await expect(item).toContainText(`Duration: ${formatDuration(months, englishUI)}`)
      await expect(item.locator('time[datetime^="P"]')).toHaveAttribute("datetime", isoDuration(months))
    }
    if (entry.skillAssociations.status === "verified") {
      const list = item.getByRole("list", { name: `Skills at ${organization}`, exact: true })
      await expect(list.getByRole("listitem")).toHaveText(entry.skillAssociations.skillIds.map(id => skills[id].label))
    } else {
      await expect(item.getByRole("list")).toHaveCount(0)
    }
  }
  await expect(jobs.first().locator("time").first()).toHaveAttribute("datetime", "2025-02")
  await expect(jobs.first()).toContainText("February 2025 — Present")
  await expect(jobs.last()).toContainText("Technical Support")
  await expect(jobs.last()).toContainText("SQL, PowerShell and Python")
  await expect(page.locator("#experience-lendingclub").getByRole("listitem").filter({ hasText: /^GraphQL$/ })).toHaveCount(1)
  await expect(studies.first()).toContainText("September 2026 — September 2027 (expected)")
  await expect(studies.first()).toContainText("In progress")
  await expect(studies.first().locator("time")).toHaveText(["September 2026", "September 2027"])
  await expect(studies.first().locator("time").nth(1)).toHaveAttribute("datetime", "2027-09")
  await expect(studies.last().locator("time")).toHaveText(["2018", "2022"])
  await expect(studies.last().locator("time").first()).toHaveAttribute("datetime", "2018")
  await expect(studies.last()).not.toContainText("expected")
  await expect(studies.last()).not.toContainText("In progress")
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["About Me", "Experience", "Education", "Latest blog posts", "Pawsphemy patch notes"])
})

for (const width of [360, 768, 1024, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`reviews career and navigation at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(value => localStorage.setItem("theme", value), theme)
      await page.goto("/")
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /light/)
      const menu = page.getByRole("button", { name: "Open navigation menu" })
      if (width < 1280) {
        await expect(menu).toBeVisible()
        await menu.click()
        await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute("aria-expanded", "true")
        await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await testInfo.attach(`navigation-${width}-${theme}`, {
          body: await page.screenshot({ animations: "disabled" }), contentType: "image/png",
        })
        await page.keyboard.press("Escape")
        await expect(menu).toBeFocused()
        await expect(menu).toHaveAttribute("aria-expanded", "false")
      } else {
        await expect(menu).toBeHidden()
        await testInfo.attach(`navigation-${width}-${theme}`, {
          body: await page.screenshot({ animations: "disabled" }), contentType: "image/png",
        })
      }
      for (const label of ["Experience", "Education", "About", "Home"]) {
        if (width < 1280) await menu.click()
        const link = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: label, exact: true })
        await expect(link).toHaveAttribute("href", `#${label.toLowerCase()}`)
        await link.click()
        if (width < 1280) await expect(menu).toHaveAttribute("aria-expanded", "false")
        await expect(page).toHaveURL(new RegExp(`#${label.toLowerCase()}$`))
        await expectHeadingBelowHeader(page, label === "Home" ? "Hi, I'm Henrique!" : label === "About" ? "About Me" : label)
      }
      for (const id of ["experience", "education"]) {
        const section = page.locator(`#${id}`)
        await section.scrollIntoViewIfNeeded()
        for (const badge of await section.locator("ul > li").all()) {
          const box = await badge.boundingBox()
          expect(box).not.toBeNull()
          expect(box!.x).toBeGreaterThanOrEqual(0)
          expect(box!.x + box!.width).toBeLessThanOrEqual(width)
        }
        const firstItem = section.locator("ol > li").first()
        const date = (await firstItem.locator(":scope > p").boundingBox())!
        const title = (await firstItem.getByRole("heading", { level: 3 }).boundingBox())!
        if (width < 768) expect(date.y + date.height).toBeLessThanOrEqual(title.y)
        else expect(date.x + date.width).toBeLessThanOrEqual(title.x)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await page.evaluate(() => document.fonts.ready)
        await testInfo.attach(`${id}-${width}-${theme}`, {
          body: await section.screenshot({ animations: "disabled", style: "header { visibility: hidden; }" }), contentType: "image/png",
        })
      }
    })
  }
}

test("supports fragment loading, keyboard destinations and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/#experience")
  await expectHeadingBelowHeader(page, "Experience")
  expect(await page.locator("html").evaluate(element => getComputedStyle(element).scrollBehavior)).toBe("auto")
  for (const label of ["Education", "Experience"]) {
    const link = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: label, exact: true })
    // Shift+Tab returns through the document to the header after native fragment navigation.
    for (let i = 0; i < 20 && !(await link.evaluate(element => element === document.activeElement)); i++) await page.keyboard.press("Shift+Tab")
    await expect(link).toBeFocused()
    expect(await link.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none")
    await page.keyboard.press("Enter")
    await expectHeadingBelowHeader(page, label)
  }
  await page.goto("/")
  await page.getByRole("link", { name: "Scroll to About section" }).click()
  await expectHeadingBelowHeader(page, "About Me")
})

async function expectHeadingBelowHeader(page: Page, name: string) {
  await expect.poll(async () => {
    const heading = await page.getByRole("heading", { name, exact: true }).boundingBox()
    const header = await page.getByRole("banner").boundingBox()
    return Boolean(heading && header && heading.y >= header.y + header.height && heading.y + heading.height <= 900)
  }).toBe(true)
}

const runtimeErrors = new WeakMap<object, string[]>()
