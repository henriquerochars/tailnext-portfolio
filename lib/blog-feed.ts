import { publicLinks } from "@/data/public-profile"
import { latestBlogPosts } from "./blog-posts"

export async function blogPostsResponse(fetcher: typeof fetch = fetch): Promise<Response> {
  try {
    const response = await fetcher(`${publicLinks.blog}/search.json`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
      redirect: "error",
    })
    if (!response.ok) throw new Error("Blog index unavailable")
    const posts = latestBlogPosts(await response.json())
    return Response.json({ posts }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    })
  } catch {
    return Response.json({ error: "Blog posts are temporarily unavailable." }, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    })
  }
}
