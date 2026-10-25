import { test, expect } from "@playwright/test"
import { latestBlogPosts } from "../../lib/blog-posts"
import { blogPostsResponse } from "../../lib/blog-feed"
import { blogIndex } from "./fixtures"

test("selects the five newest unique published posts and excludes drafts and invalid entries", () => {
  const posts = latestBlogPosts([
    ...blogIndex,
    blogIndex[0],
    { ...blogIndex[0], draft: true, date: "2026-10-20", path: "blog/draft" },
    { ...blogIndex[0], date: "invalid", path: "blog/bad-date" },
    { ...blogIndex[0], title: " " },
    null,
  ])
  expect(posts.map(post => post.title)).toEqual([6, 5, 4, 3, 2].map(day => `Aprendizado ${day}`))
  expect(posts[0]).toEqual({
    title: "Aprendizado 6",
    url: "https://henriquerochadevblog.vercel.app/blog/aprendizado-6",
    date: "2026-10-06T00:00:00.000Z",
    summary: "Notas sobre desenvolvimento de software — parte 6.",
  })
})

test("supports fewer than five posts, empty indexes, nested slugs and missing summaries", () => {
  expect(latestBlogPosts([])).toEqual([])
  const posts = latestBlogPosts([{ ...blogIndex[0], path: "blog/react/introdução", summary: undefined }])
  expect(posts).toHaveLength(1)
  expect(posts[0].url).toBe("https://henriquerochadevblog.vercel.app/blog/react/introdu%C3%A7%C3%A3o")
  expect(posts[0].summary).toBe("")
  expect(() => latestBlogPosts({ posts: [] })).toThrow("Invalid blog index")
})

test("rejects links outside blog post paths, redirects and traversal", () => {
  const paths = ["https://evil.example/post", "//evil.example/post", "javascript:alert(1)", "blog/../about", "blog/%2e%2e/about", "blog/post?redirect=evil", "blog/post#fragment", "blog\\post", "authors/default"]
  expect(latestBlogPosts(paths.map(path => ({ ...blogIndex[0], path })))).toEqual([])
})

test("fetches only the canonical JSON index with bounded time and hourly caching", async () => {
  const fetcher: typeof fetch = async (url, options) => {
    expect(url).toBe("https://henriquerochadevblog.vercel.app/search.json")
    expect(options).toMatchObject({ next: { revalidate: 3600 }, redirect: "error", headers: { Accept: "application/json" } })
    expect(options?.signal).toBeInstanceOf(AbortSignal)
    return Response.json(blogIndex)
  }
  const response = await blogPostsResponse(fetcher)
  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toBe("public, s-maxage=3600, stale-while-revalidate=86400")
  expect((await response.json()).posts).toHaveLength(5)
})

test("does not cache upstream failures, malformed responses or timeouts", async () => {
  const failures: (typeof fetch)[] = [
    async () => new Response("Unavailable", { status: 503 }),
    async () => new Response("not json"),
    async () => Response.json({ invalid: true }),
    async () => { throw new DOMException("Timeout", "TimeoutError") },
  ]
  for (const fetcher of failures) {
    const response = await blogPostsResponse(fetcher)
    expect(response.status).toBe(502)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(await response.json()).toEqual({ error: "Blog posts are temporarily unavailable." })
  }
})
