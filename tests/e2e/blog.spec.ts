import { test, expect, blogPosts } from "./fixtures"

test.use({ timezoneId: "America/Los_Angeles" })

for (const width of [360, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`shows the five latest posts at ${width}px in ${theme} theme`, async ({ page }, testInfo) => {
      const errors: string[] = []
      page.on("pageerror", error => errors.push(error.message))
      const external: string[] = []
      page.on("request", request => {
        if (new URL(request.url()).hostname === "henriquerochadevblog.vercel.app") external.push(request.url())
      })
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(value => localStorage.setItem("theme", value), theme)
      await page.goto("/#blog")
      const section = page.getByRole("region", { name: "Latest blog posts" })
      const list = section.getByRole("list", { name: "Latest blog posts" })
      await expect(list.getByRole("listitem")).toHaveCount(5)
      await expect(list.getByRole("heading", { level: 3 })).toHaveText(blogPosts.map(post => `${post.title} (abre em uma nova aba)`))
      await expect(list.locator("time").first()).toHaveText("6 de outubro de 2026")
      await expect(list.locator("time").first()).toHaveAttribute("datetime", blogPosts[0].date)
      await expect(list).toHaveAttribute("lang", "pt-BR")
      for (const [index, post] of blogPosts.entries()) {
        const item = list.getByRole("listitem").nth(index)
        await expect(item).toContainText(post.summary)
        const link = item.getByRole("link")
        await expect(link).toHaveAttribute("href", post.url)
        await expect(link).toHaveAttribute("target", "_blank")
        await expect(link).toHaveAttribute("rel", "noopener noreferrer")
      }
      await list.getByRole("link").first().focus()
      await expect(list.getByRole("link").first()).toBeFocused()
      expect(await list.getByRole("link").first().evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe("none")
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await testInfo.attach(`blog-${width}-${theme}`, { body: await section.screenshot({ animations: "disabled" }), contentType: "image/png" })
      expect(external).toEqual([])
      expect(errors).toEqual([])
    })
  }
}

test("shows loading while the feed is pending", async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route("**/api/blog-posts", async route => {
    await pending
    await route.fulfill({ json: { posts: blogPosts } })
  })
  await page.goto("/")
  try {
    await expect(page.getByText("Loading recent posts…")).toBeVisible()
  } finally {
    release()
  }
  await expect(page.getByRole("list", { name: "Latest blog posts" }).getByRole("listitem")).toHaveCount(5)
})

test("shows a useful empty state when there are no published posts", async ({ page }) => {
  await page.route("**/api/blog-posts", route => route.fulfill({ json: { posts: [] } }))
  await page.goto("/#blog")
  await expect(page.getByText("No published posts yet. Check back soon.")).toBeVisible()
  await expect(page.getByRole("link", { name: /Read all posts/ })).toHaveAttribute("href", "https://henriquerochadevblog.vercel.app")
})

test("keeps the portfolio usable when the feed fails and can retry", async ({ page }) => {
  let attempts = 0
  await page.route("**/api/blog-posts", route => {
    attempts += 1
    return attempts === 1
      ? route.fulfill({ status: 502, json: { error: "Unavailable" } })
      : route.fulfill({ json: { posts: blogPosts.slice(0, 2) } })
  })
  await page.goto("/#blog")
  await expect(page.getByText("Recent posts are temporarily unavailable. You can still read them on the blog.")).toBeVisible()
  await expect(page.getByRole("link", { name: /Read all posts/ })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Hi, I'm Henrique!", exact: true })).toHaveCount(1)
  await page.getByRole("button", { name: "Try again" }).click()
  await expect(page.getByRole("list", { name: "Latest blog posts" }).getByRole("listitem")).toHaveCount(2)
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0)
})
