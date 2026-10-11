import { expect, test } from "@playwright/test"
import { education, employment, skills } from "../../data/profile"
import { expectHeadingInView, navigateTo, navigation, openMenu } from "./helpers"

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

test("renders the complete career and verified skills without inferring associations", async ({ page, request }) => {
  const html = await (await request.get("/")).text()
  expect(html.match(/<li id="experience-/g)).toHaveLength(employment.length)
  await page.goto("/")
  expect(await page.locator("main > section").evaluateAll(elements => elements.map(element => element.id))).toEqual(["about", "experience", "education"])
  const jobs = page.locator("#experience ol > li")
  const studies = page.getByRole("list", { name: "Academic background", exact: true }).locator(":scope > li")
  await expect(jobs).toHaveCount(employment.length)
  await expect(studies).toHaveCount(education.length)
  for (let i = 0; i < employment.length; i++) {
    if (i < 3) await expect(jobs.nth(i)).toBeVisible()
    else await expect(jobs.nth(i)).toBeHidden()
  }
  const summary = page.locator(".earlier-experience > summary")
  await expect(summary).toHaveAccessibleName("Show 6 earlier roles")
  await summary.focus()
  await page.keyboard.press("Space")
  await expect(summary).toHaveAccessibleName("Hide 6 earlier roles")
  for (const [index, entry] of [...employment, ...education].entries()) {
    const job = "employer" in entry
    const item = job ? jobs.nth(index) : studies.nth(index - employment.length)
    const organization = job ? entry.employer : entry.institution
    await expect(item.getByRole("heading", { level: 3 })).toHaveText(job ? entry.role : entry.program)
    await expect(item).toContainText(organization)
    await expect(item).toBeVisible()
    if (job) for (const paragraph of entry.description) await expect(item).toContainText(paragraph)
    if (entry.skillAssociations.status === "verified") {
      await expect(item.getByRole("list", { name: `Skills at ${organization}`, exact: true }).getByRole("listitem")).toHaveText(entry.skillAssociations.skillIds.map(id => skills[id].label))
    } else await expect(item.getByRole("list")).toHaveCount(0)
  }
  await expect(jobs.first().locator("time")).toHaveAttribute("datetime", "2025-02")
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
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["01About Me", "02Experience", "03Education"])
  await summary.focus()
  await page.keyboard.press("Enter")
  await expect(summary).toBeFocused()
  await expect(jobs.nth(3)).toBeHidden()
  await expect(jobs).toHaveCount(9)
})

for (const width of [360, 768, 1024, 1280, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`reviews career and navigation at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(value => localStorage.setItem("theme", value), theme)
      await page.goto("/")
      await expect(page.locator("html")).toHaveClass(new RegExp(theme))
      await page.evaluate(() => document.fonts.ready)
      await testInfo.attach(`layout-${width}-${theme}`, { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" })
      const menu = page.getByRole("button", { name: "Open navigation menu" })
      if (width < 1280) {
        await expect(menu).toBeVisible()
        await menu.click()
        await expect(navigation(page)).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await testInfo.attach(`navigation-${width}-${theme}`, { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" })
        await page.keyboard.press("Escape")
        await expect(menu).toBeFocused()
        await expect(menu).toHaveAttribute("aria-expanded", "false")
      } else await expect(menu).toBeHidden()
      for (const label of ["Experience", "Education", "About"] as const) {
        await navigateTo(page, label)
        if (width < 1280) await expect(menu).toHaveAttribute("aria-expanded", "false")
        await expect(page).toHaveURL(new RegExp(`#${label.toLowerCase()}$`))
        await expect(navigation(page).locator(`a[href="#${label.toLowerCase()}"]`)).toHaveAttribute("aria-current", "location")
      }
      await page.getByRole("link", { name: "Home — Henrique Rocha Serrano", exact: true }).click()
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1)
      await expectHeadingInView(page, "Henrique Rocha Serrano")
      await navigateTo(page, "Experience")
      await testInfo.attach(`experience-collapsed-${width}-${theme}`, { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" })
      await page.locator(".earlier-experience > summary").click()
      for (const id of ["experience", "education"] as const) {
        await navigateTo(page, id === "experience" ? "Experience" : "Education")
        const section = page.locator(`#${id}`)
        for (const badge of await section.locator("ul > li").all()) {
          const box = (await badge.boundingBox())!
          expect(box.x).toBeGreaterThanOrEqual(0)
          expect(box.x + box.width).toBeLessThanOrEqual(width)
        }
        const first = section.locator("ol > li").first()
        const positions = await first.evaluate(entry => {
          const date = entry.querySelector(":scope > p")!.getBoundingClientRect()
          const title = entry.querySelector("h3")!.getBoundingClientRect()
          return { dateBottom: date.bottom, dateRight: date.right, titleTop: title.top, titleLeft: title.left }
        })
        if (width < 768) expect(positions.dateBottom).toBeLessThanOrEqual(positions.titleTop)
        else expect(positions.dateRight).toBeLessThanOrEqual(positions.titleLeft)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await testInfo.attach(`${id}-${width}-${theme}`, { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" })
      }
    })
  }
}

test("supports fragment loading, keyboard destinations and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/#experience")
  await expectHeadingInView(page, "Experience")
  expect(await page.locator("html").evaluate(element => getComputedStyle(element).scrollBehavior)).toBe("auto")
  for (const label of ["Education", "Experience"] as const) {
    const link = navigation(page).getByRole("link", { name: label, exact: true })
    for (let i = 0; i < 20 && !(await link.evaluate(element => element === document.activeElement)); i++) await page.keyboard.press("Shift+Tab")
    await expect(link).toBeFocused()
    expect(await link.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none")
    await page.keyboard.press("Enter")
    await expectHeadingInView(page, label)
  }
  await page.goto("/")
  await page.getByRole("link", { name: "Scroll to About section" }).click()
  await expectHeadingInView(page, "About Me")
})

test("reveals direct fragments inside the earlier history and preserves back/forward navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/#experience-banestes")
  await expect(page.locator(".earlier-experience")).toHaveAttribute("open", "")
  await expectHeadingInView(page, "Technical Support")
  await navigateTo(page, "Education")
  await page.goBack()
  await expectHeadingInView(page, "Technical Support")
  await page.goForward()
  await expectHeadingInView(page, "Education")
})

for (const width of [360, 1440]) {
  test(`tracks manual scrolling without changing the fragment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/#about")
    await expectHeadingInView(page, "About Me")
    await page.locator("#experience").evaluate(element => element.scrollIntoView())
    await expect(navigation(page).locator('a[aria-current="location"]')).toHaveText("02Experience")
    await expect(page).toHaveURL(/#about$/)
    await page.locator(".earlier-experience > summary").click()
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(navigation(page).locator('a[aria-current="location"]')).toHaveText("03Education")
    await page.locator(".earlier-experience > summary").click()
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(navigation(page).locator('a[aria-current="location"]')).toHaveText("03Education")
    await expect(page).toHaveURL(/#about$/)
  })
}

test("fits the sticky profile and releases it in short desktop windows", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/")
  await page.evaluate(() => document.fonts.ready)
  const profile = page.locator(".profile-content")
  await expect(profile).toHaveAttribute("data-sticky", "true")
  await navigateTo(page, "Experience")
  expect((await profile.boundingBox())!.y).toBeGreaterThanOrEqual(24)
  await page.setViewportSize({ width: 1440, height: 500 })
  await expect(profile).toHaveAttribute("data-sticky", "false")
  await page.getByRole("link", { name: "Home — Henrique Rocha Serrano", exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1)
  await testInfo.attach("desktop-short", { body: await page.screenshot({ animations: "disabled" }), contentType: "image/png" })
  await page.locator(".profile-utilities").scrollIntoViewIfNeeded()
  await expect(page.getByRole("link", { name: "Blog pt-br", exact: true })).toBeInViewport()
})

test("closes the mobile menu when entering desktop layout", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto("/")
  await openMenu(page)
  await navigation(page).getByRole("link", { name: "About", exact: true }).focus()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(navigation(page).getByRole("link", { name: "About", exact: true })).toBeFocused()
  await page.setViewportSize({ width: 1024, height: 900 })
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute("aria-expanded", "false")
})

const runtimeErrors = new WeakMap<object, string[]>()
