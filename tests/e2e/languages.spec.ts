import { test, expect } from "./fixtures"
import { getMessages } from "../../i18n/messages"
import { locales, localePaths } from "../../i18n/locales"
import { employment, education } from "../../data/profile"

for (const locale of locales) {
  const messages = getMessages(locale)
  const path = localePaths[locale] || "/"
  test(`renders complete ${locale} content, metadata and UTC career dates on direct load`, async ({ page, request }) => {
    const errors: string[] = []
    page.on("pageerror", error => errors.push(error.message))
    await page.goto(path)
    await expect(page.locator("html")).toHaveAttribute("lang", locale)
    await expect(page).toHaveTitle(`${messages.ui.portfolio} | HenriqueRochaDev`)
    await expect(page.locator("header a[href='#home']")).toHaveText(`HenriqueRochaDev | ${messages.ui.portfolio}`)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.introduction.greeting)
    for (const paragraph of messages.introduction.about) await expect(page.locator("#about")).toContainText(paragraph)
    for (const [index, entry] of messages.employment.entries()) {
      const item = page.locator(`#experience-${entry.id}`)
      await expect(item.getByRole("heading")).toHaveText(entry.role)
      for (const paragraph of entry.description) await expect(item).toContainText(paragraph)
      await expect(item).toContainText(employment[index].employer)
      await expect(item.locator("time").first()).toHaveAttribute("datetime", `${entry.start.year}-${String(entry.start.month).padStart(2, "0")}`)
      if (locale !== "en") expect(entry.description).not.toEqual(employment[index].description)
    }
    for (const [index, entry] of messages.education.entries()) {
      await expect(page.locator(`#education-${entry.id}`)).toContainText(entry.program)
      await expect(page.locator(`#education-${entry.id}`)).toContainText(entry.field)
      if (locale !== "en") expect(entry.program).not.toBe(education[index].program)
    }
    await expect(page.locator("#experience-lena")).toContainText(new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date("2025-02-01T00:00:00Z")))
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", messages.introduction.metadataDescription)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://henriquerochadev.vercel.app${path === "/" ? "" : path}`)
    for (const language of locales) await expect(page.locator(`link[rel="alternate"][hreflang="${language}"]`)).toHaveAttribute("href", `https://henriquerochadev.vercel.app${localePaths[language]}`)
    // Raw HTML proves the language and prose are present before hydration.
    const html = await (await request.get(path)).text()
    expect(html).toContain(`lang="${locale}"`)
    expect(html).toContain(messages.employment[8].description[0])
    await page.reload()
    await expect(page.locator("html")).toHaveAttribute("lang", locale)
    expect(errors).toEqual([])
  })
  for (const width of [320, 640, 1024, 1280, 1440]) {
    test(`${locale} selector and navigation fit at ${width}px in both themes`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(path)
      const menu = page.getByRole("button", { name: messages.ui.openMenu })
      if (width < 1280) await menu.click()
      const select = page.getByRole("combobox", { name: messages.ui.language })
      await expect(select).toBeVisible()
      await expect(select).toHaveValue(locale)
      await expect(select.locator("option")).toHaveText(["Português (BR)", "English", "Español"])
      for (const theme of ["light", "dark"]) {
        const button = page.getByRole("button", { name: theme === "dark" ? messages.ui.darkTheme : messages.ui.lightTheme })
        if (await button.count()) await button.click()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        const box = (await page.locator("[data-language-switcher]").boundingBox())!
        expect(box.width).toBe(176)
        expect(box.height).toBe(44)
        await testInfo.attach(`header-${locale}-${width}-${theme}`, { body: await page.getByRole("banner").screenshot(), contentType: "image/png" })
      }
    })
  }
}

test("supports keyboard focus and native language changes while preserving query/hash, reloads and English return", async ({ page }) => {
  await page.goto("/?ref=language-test#experience")
  const select = page.getByRole("combobox", { name: "Language" })
  await page.getByRole("button", { name: /Switch to (dark|light) theme/ }).focus()
  await page.keyboard.press("Tab")
  await expect(select).toBeFocused()
  const focusRing = await page.locator("[data-language-switcher]").evaluate(element => ({ style: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth }))
  expect(focusRing).toEqual({ style: "solid", width: "3px" })
  await select.selectOption("es")
  await expect(page).toHaveURL(/\/es\?ref=language-test#experience$/)
  await expect(page.locator("html")).toHaveAttribute("lang", "es")
  await expect(page).toHaveTitle("Portafolio | HenriqueRochaDev")
  await expect(page.locator("#experience-heading")).toBeInViewport()
  await page.reload()
  await expect(page.getByRole("combobox", { name: "Idioma" })).toHaveValue("es")
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("pt-BR")
  await expect(page).toHaveURL(/\/pt-br\?ref=language-test#experience$/)
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR")
  await expect(page).toHaveTitle("Portfólio | HenriqueRochaDev")
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("en")
  await expect(page).toHaveURL(/\/\?ref=language-test#experience$/)
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
})

test("rejects unsupported route locales and API locale values", async ({ request }) => {
  expect((await request.get("/fr")).status()).toBe(404)
  expect((await request.get("/es/unknown")).status()).toBe(404)
  expect((await request.get("/api/blog-posts?locale=https://example.com")).status()).toBe(400)
  const sitemap = await (await request.get("/sitemap.xml")).text()
  for (const path of ["/pt-br", "/es"]) expect(sitemap).toContain(`https://henriquerochadev.vercel.app${path === "/" ? "" : path}`)
})

test("mobile switch closes navigation and localized feeds keep their source-language indication", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto("/")
  await page.getByRole("button", { name: "Open navigation menu" }).click()
  await page.getByRole("combobox", { name: "Language" }).selectOption("es")
  await expect(page.locator("html")).toHaveAttribute("lang", "es")
  await expect(page.getByRole("button", { name: "Abrir menú de navegación" })).toHaveAttribute("aria-expanded", "false")
  await expect(page.getByText(getMessages("es").ui.portugueseSource)).toBeVisible()
  await expect(page.locator("#blog ol")).toHaveAttribute("lang", "pt-BR")
  await expect(page.locator("#blog time").first()).toHaveText("6 de octubre de 2026")
  await page.route("**/api/blog-posts*", route => route.fulfill({ json: { posts: [{ title: "Software learning", summary: "Translated notes.", date: "2026-10-06T00:00:00Z", url: "https://henriquerochadevblog.vercel.app/en/blog/learning" }], sourceLocale: "en" } }))
  await page.getByRole("button", { name: "Abrir menú de navegación" }).click()
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("en")
  await expect(page.locator("#blog ol")).toHaveAttribute("lang", "en")
  await expect(page.locator("#blog")).toContainText("Translated notes.")
  await expect(page.getByText(getMessages("en").ui.portugueseSource)).toHaveCount(0)
})

for (const fragment of ["experience", "education", "blog"]) {
  test(`switching an active ${fragment} fragment reanchors its translated heading below the header`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(`/#${fragment}`)
    await page.getByRole("combobox", { name: "Language" }).selectOption("es")
    await expect(page).toHaveURL(new RegExp(`/es#${fragment}$`))
    await expect.poll(async () => {
      const heading = await page.locator(`#${fragment}-heading`).boundingBox()
      const header = await page.getByRole("banner").boundingBox()
      return Boolean(heading && header && heading.y >= header.height && heading.y + heading.height <= 900)
    }).toBe(true)
  })
}

test("mixed localized feed marks each Portuguese source article without labeling translated articles as Portuguese", async ({ page }) => {
  await page.route("**/api/blog-posts*", route => route.fulfill({ json: { sourceLocale: "en", posts: [
    { title: "Translated post", summary: "Translated summary.", date: "2026-10-06T00:00:00Z", url: "https://henriquerochadevblog.vercel.app/en/blog/translated", locale: "en" },
    { title: "Post em português", summary: "Resumo original.", date: "2026-10-05T00:00:00Z", url: "https://henriquerochadevblog.vercel.app/en/blog/original", locale: "pt-BR" },
  ] } }))
  await page.goto("/#blog")
  const articles = page.locator("#blog article")
  await expect(articles.nth(0)).toHaveAttribute("lang", "en")
  await expect(articles.nth(0)).not.toContainText(getMessages("en").ui.portugueseSource)
  await expect(articles.nth(1)).toHaveAttribute("lang", "pt-BR")
  await expect(articles.nth(1)).toContainText(getMessages("en").ui.portugueseSource)
  await expect(articles.nth(1).locator("time")).toHaveAttribute("lang", "en")
})
