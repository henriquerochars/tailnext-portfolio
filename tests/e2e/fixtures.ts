import { test as base, expect } from "@playwright/test"
import { latestBlogPosts } from "../../lib/blog-posts"

export const blogIndex = [2, 6, 1, 5, 3, 4].map(day => ({
  title: `Aprendizado ${day}`,
  path: `blog/aprendizado-${day}`,
  date: `2026-10-0${day}T00:00:00.000Z`,
  summary: `Notas sobre desenvolvimento de software — parte ${day}.`,
  draft: false,
}))
export const blogPosts = latestBlogPosts(blogIndex)

// Browser behavior is deterministic and never contacts the live blog.
export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.route("**/api/blog-posts*", route => route.fulfill({ json: { posts: blogPosts } }))
    await runTest(page)
  },
})
export { expect }
